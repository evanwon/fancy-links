/**
 * @jest-environment jsdom
 */

/**
 * Chrome MV3 integration tests
 * Validates that the extension's cross-browser abstractions work correctly
 * under Chrome-like globals using setupChromeMocks() from test/setup.js.
 */

describe('Chrome MV3 Integration', () => {
  let chromeMocks;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Remove Firefox-like globals so Chrome detection works
    delete global.browser;

    chromeMocks = setupChromeMocks();
  });

  afterEach(() => {
    delete global.chrome;
  });

  describe('BrowserApi under Chrome globals', () => {
    let BrowserApi;

    beforeEach(() => {
      BrowserApi = require('../../src/utils/browser-api.js');
    });

    test('getApi() returns chrome object', () => {
      expect(BrowserApi.getApi()).toBe(global.chrome);
    });

    test('getManifestVersion() returns 3', () => {
      expect(BrowserApi.getManifestVersion()).toBe(3);
    });

    test('getAction() returns chrome.action', () => {
      expect(BrowserApi.getAction()).toBe(global.chrome.action);
    });

    test('getBrowserName() returns "chrome"', () => {
      expect(BrowserApi.getBrowserName()).toBe('chrome');
    });

    test('executeContentScript() calls chrome.scripting.executeScript()', async () => {
      chromeMocks.scripting.executeScript.mockResolvedValue([{ result: true }]);

      await BrowserApi.executeContentScript(42, '/content/test.js');

      expect(chromeMocks.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 42 },
        files: ['/content/test.js']
      });
    });

    test('setBadgeText() calls chrome.action.setBadgeText()', async () => {
      chromeMocks.action.setBadgeText.mockResolvedValue(undefined);

      await BrowserApi.setBadgeText({ text: '✓' });

      expect(chromeMocks.action.setBadgeText).toHaveBeenCalledWith({ text: '✓' });
    });
  });

  describe('globalThis exports (no window)', () => {
    test('BrowserApi is available on globalThis when loaded', () => {
      require('../../src/utils/browser-api.js');

      expect(globalThis.BrowserApi).toBeDefined();
      expect(globalThis.BrowserApi.getApi).toBeInstanceOf(Function);
    });
  });

  describe('Notification ID under Chrome', () => {
    beforeEach(() => {
      // Set up all globals that background.js expects
      globalThis.BrowserApi = require('../../src/utils/browser-api.js');

      globalThis.FancyLinkFormatConfig = {
        getFormatConfig: jest.fn(() => ({
          format: jest.fn((title, url) => `[${title}](${url})`)
        })),
        getFormats: jest.fn()
      };
      globalThis.FancyLinkSettings = {
        DEFAULT_SETTINGS: {
          defaultFormat: 'markdown',
          showNotifications: true,
          showBadge: true,
          cleanUrls: false,
          debugMode: false,
          includeCurrentPageInBugReports: false
        }
      };
      globalThis.FancyLinkCleanUrl = { cleanUrl: jest.fn(url => url) };
      globalThis.KeyboardShortcuts = { getCurrentShortcut: jest.fn() };
      globalThis.Diagnostics = { collectDiagnostics: jest.fn(), generateGitHubIssueUrl: jest.fn() };

      // Mock tabs.query to return a valid tab
      chromeMocks.tabs.query.mockResolvedValue([{ id: 1, url: 'https://example.com', title: 'Test' }]);
      // Mock storage to return settings with notifications enabled
      chromeMocks.storage.sync.get.mockResolvedValue({
        defaultFormat: 'markdown',
        showNotifications: true,
        showBadge: true,
        cleanUrls: false
      });
      // Mock offscreen and runtime for clipboard
      chromeMocks.offscreen.createDocument.mockResolvedValue(undefined);
      chromeMocks.runtime.sendMessage.mockResolvedValue(undefined);
    });

    test('notifications.create is called with a string ID', async () => {
      require('../../src/background/background.js');

      // Get the onClicked handler
      const onClickedCall = chromeMocks.action.onClicked.addListener.mock.calls[0];
      expect(onClickedCall).toBeDefined();

      const clickHandler = onClickedCall[0];
      await clickHandler({ id: 1 });

      // Verify notification was created with a string ID (not undefined/null)
      expect(chromeMocks.notifications.create).toHaveBeenCalled();
      const notifId = chromeMocks.notifications.create.mock.calls[0][0];
      expect(typeof notifId).toBe('string');
      expect(notifId).toMatch(/^fancy-links-\d+$/);
    });
  });

  describe('Options shortcut help under Chrome', () => {
    test('creates clickable shortcut link for Chrome', async () => {
      const mockShortcutHelp = document.createElement('p');
      mockShortcutHelp.textContent = 'Visit about:addons to customize your shortcut.';

      // Set up DOM mocks
      document.getElementById = jest.fn(() => null);
      document.querySelector = jest.fn((selector) => {
        if (selector === '.shortcut-help p') return mockShortcutHelp;
        return null;
      });
      document.querySelectorAll = jest.fn(() => []);
      document.addEventListener = jest.fn();

      // Mock all globals options.js expects
      globalThis.FancyLinkFormatRegistry = { formatConfig: {} };
      globalThis.FancyLinkSettings = {
        DEFAULT_SETTINGS: {
          defaultFormat: 'markdown',
          showNotifications: false,
          showBadge: true,
          cleanUrls: false,
          debugMode: false,
          includeCurrentPageInBugReports: false
        }
      };
      globalThis.KeyboardShortcuts = {
        getCurrentShortcut: jest.fn().mockResolvedValue('Ctrl+Alt+C')
      };
      globalThis.Diagnostics = {
        collectDiagnostics: jest.fn(),
        generateGitHubIssueUrl: jest.fn()
      };

      // BrowserApi from Chrome globals
      globalThis.BrowserApi = require('../../src/utils/browser-api.js');

      // Mock getElementById to return required elements
      const mockElements = {
        showNotifications: { checked: false, addEventListener: jest.fn() },
        showBadge: { checked: true, addEventListener: jest.fn() },
        cleanUrls: { checked: false, addEventListener: jest.fn() },
        debugMode: { checked: false, addEventListener: jest.fn() },
        includeCurrentPageInBugReports: { checked: false, addEventListener: jest.fn() },
        saveButton: { addEventListener: jest.fn() },
        resetButton: { addEventListener: jest.fn() },
        reportIssueLink: { addEventListener: jest.fn() },
        statusMessage: { textContent: '', className: '' },
        currentShortcut: { textContent: '' }
      };
      document.getElementById = jest.fn((id) => mockElements[id] || null);

      require('../../src/options/options.js');

      // Trigger DOMContentLoaded
      const domReadyCall = document.addEventListener.mock.calls.find(c => c[0] === 'DOMContentLoaded');
      await domReadyCall[1]();
      await new Promise(resolve => setTimeout(resolve, 0));

      const link = mockShortcutHelp.querySelector('a');
      expect(link).toBeTruthy();
      expect(link.textContent).toBe('chrome://extensions/shortcuts');
      expect(mockShortcutHelp.textContent).toBe(
        'Go to chrome://extensions/shortcuts to customize your shortcut.'
      );
    });
  });

  describe('Message handler under Chrome', () => {
    beforeEach(() => {
      globalThis.BrowserApi = require('../../src/utils/browser-api.js');

      globalThis.FancyLinkFormatConfig = {
        getFormatConfig: jest.fn(() => ({
          format: jest.fn((title, url) => `[${title}](${url})`)
        })),
        getFormats: jest.fn()
      };
      globalThis.FancyLinkSettings = {
        DEFAULT_SETTINGS: {
          defaultFormat: 'markdown',
          showNotifications: false,
          showBadge: true,
          cleanUrls: false,
          debugMode: false,
          includeCurrentPageInBugReports: false
        }
      };
      globalThis.FancyLinkCleanUrl = { cleanUrl: jest.fn(url => url) };
      globalThis.KeyboardShortcuts = { getCurrentShortcut: jest.fn() };
      globalThis.Diagnostics = { collectDiagnostics: jest.fn(), generateGitHubIssueUrl: jest.fn() };

      chromeMocks.tabs.query.mockResolvedValue([{ id: 1, url: 'https://example.com', title: 'Test' }]);
      chromeMocks.storage.sync.get.mockResolvedValue({
        defaultFormat: 'markdown',
        showNotifications: false,
        showBadge: true,
        cleanUrls: false
      });
      chromeMocks.offscreen.createDocument.mockResolvedValue(undefined);
      chromeMocks.runtime.sendMessage.mockResolvedValue(undefined);
    });

    test('returns true for async copyLink message', () => {
      require('../../src/background/background.js');

      const listenerCall = chromeMocks.runtime.onMessage.addListener.mock.calls[0];
      expect(listenerCall).toBeDefined();

      const messageHandler = listenerCall[0];
      const sendResponse = jest.fn();

      const result = messageHandler({ action: 'copyLink', format: 'markdown' }, {}, sendResponse);
      expect(result).toBe(true);
    });

    test('returns false for sync cleanUrl message', () => {
      require('../../src/background/background.js');

      const listenerCall = chromeMocks.runtime.onMessage.addListener.mock.calls[0];
      const messageHandler = listenerCall[0];
      const sendResponse = jest.fn();

      const result = messageHandler({ action: 'cleanUrl', url: 'https://example.com?utm_source=test' }, {}, sendResponse);
      expect(result).toBe(false);
    });
  });
});
