/**
 * @jest-environment jsdom
 */

/**
 * Tests for options page functionality
 */

describe('Options Page', () => {
  let mockElements;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Mock DOM elements that options.js accesses via getElementById
    mockElements = {
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
    document.querySelectorAll = jest.fn(() => []);
    document.addEventListener = jest.fn();

    // Mock browser APIs (extend the jest-webextension-mock defaults)
    browser.storage.sync.get.mockResolvedValue({});
    browser.storage.sync.set.mockResolvedValue(undefined);
    browser.storage.sync.remove.mockResolvedValue(undefined);
    browser.storage.sync.clear.mockResolvedValue(undefined);
    browser.tabs.create = jest.fn();

    // Mock FancyLinkFormatRegistry (loaded by options.html via script tag)
    global.FancyLinkFormatRegistry = {
      formatConfig: {},
      getWorksWithText: jest.fn()
    };
    // Also set on globalThis for the top-level access in options.js
    globalThis.FancyLinkFormatRegistry = global.FancyLinkFormatRegistry;

    // Mock KeyboardShortcuts
    global.KeyboardShortcuts = {
      getCurrentShortcut: jest.fn().mockResolvedValue('Ctrl+Alt+C')
    };

    // Mock Diagnostics
    global.Diagnostics = {
      collectDiagnostics: jest.fn().mockResolvedValue({}),
      generateGitHubIssueUrl: jest.fn().mockReturnValue('https://github.com/test')
    };

    // Load options.js - it registers a DOMContentLoaded listener
    require('../../src/options/options.js');
  });

  /**
   * Helper to trigger DOMContentLoaded and wait for async initialization
   */
  async function triggerDOMContentLoaded() {
    const domReadyCall = document.addEventListener.mock.calls
      .find(call => call[0] === 'DOMContentLoaded');
    if (domReadyCall) {
      await domReadyCall[1]();
    }
    // Allow microtasks to complete
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  /**
   * Helper to get a click handler registered on a given element
   */
  function getClickHandler(elementId) {
    const element = mockElements[elementId];
    const clickCall = element.addEventListener.mock.calls
      .find(call => call[0] === 'click');
    return clickCall ? clickCall[1] : null;
  }

  describe('resetSettings()', () => {
    test('should use remove+set instead of clear', async () => {
      await triggerDOMContentLoaded();

      const clickHandler = getClickHandler('resetButton');
      expect(clickHandler).toBeTruthy();

      await clickHandler();

      // Should NOT call clear()
      expect(browser.storage.sync.clear).not.toHaveBeenCalled();
      // Should call remove() with known keys from DEFAULT_SETTINGS
      expect(browser.storage.sync.remove).toHaveBeenCalledWith(
        expect.arrayContaining([
          'defaultFormat',
          'showNotifications',
          'showBadge',
          'cleanUrls',
          'debugMode',
          'includeCurrentPageInBugReports'
        ])
      );
      // Should call set() with default values
      expect(browser.storage.sync.set).toHaveBeenCalled();
    });

    test('should preserve keys not in DEFAULT_SETTINGS', async () => {
      // Simulate storage containing a key not managed by options page
      browser.storage.sync.get.mockResolvedValue({
        customKey: 'should-survive'
      });

      await triggerDOMContentLoaded();

      const clickHandler = getClickHandler('resetButton');
      await clickHandler();

      // remove() should only contain known keys, NOT 'customKey'
      const removeCall = browser.storage.sync.remove.mock.calls[0][0];
      expect(removeCall).not.toContain('customKey');
    });

    test('should re-set DEFAULT_SETTINGS after removal', async () => {
      await triggerDOMContentLoaded();

      const clickHandler = getClickHandler('resetButton');
      await clickHandler();

      // Verify set() was called with the default settings
      const setCall = browser.storage.sync.set.mock.calls;
      // The last set call should be from resetSettings (loadSettings may also call set)
      const resetSetCall = setCall[setCall.length - 1][0];
      expect(resetSetCall).toEqual(expect.objectContaining({
        defaultFormat: 'markdown',
        showNotifications: false,
        showBadge: true,
        cleanUrls: false,
        debugMode: false,
        includeCurrentPageInBugReports: false
      }));
    });

    test('should update UI with default settings after reset', async () => {
      // Set non-default values first
      mockElements.showNotifications.checked = true;
      mockElements.showBadge.checked = false;

      await triggerDOMContentLoaded();

      const clickHandler = getClickHandler('resetButton');
      await clickHandler();

      // After reset, UI should reflect defaults
      expect(mockElements.showNotifications.checked).toBe(false);
      expect(mockElements.showBadge.checked).toBe(true);
      expect(mockElements.cleanUrls.checked).toBe(false);
      expect(mockElements.debugMode.checked).toBe(false);
    });

    test('should show success status after reset', async () => {
      await triggerDOMContentLoaded();

      const clickHandler = getClickHandler('resetButton');
      await clickHandler();

      expect(mockElements.statusMessage.textContent).toBe('Settings reset to defaults');
    });

    test('should handle reset error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      browser.storage.sync.remove.mockRejectedValue(new Error('Storage error'));

      await triggerDOMContentLoaded();

      const clickHandler = getClickHandler('resetButton');
      await clickHandler();

      // Should show error status
      expect(mockElements.statusMessage.textContent).toBe('Error resetting settings');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error resetting settings:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('loadSettings()', () => {
    test('should load settings from storage and update UI', async () => {
      browser.storage.sync.get.mockResolvedValue({
        showNotifications: true,
        showBadge: false,
        cleanUrls: true,
        debugMode: false,
        includeCurrentPageInBugReports: false
      });

      await triggerDOMContentLoaded();

      expect(browser.storage.sync.get).toHaveBeenCalled();
      expect(mockElements.showNotifications.checked).toBe(true);
      expect(mockElements.showBadge.checked).toBe(false);
      expect(mockElements.cleanUrls.checked).toBe(true);
    });

    test('should fall back to defaults when storage is empty', async () => {
      browser.storage.sync.get.mockResolvedValue({});

      await triggerDOMContentLoaded();

      // Defaults: showNotifications=false, showBadge=true, cleanUrls=false
      expect(mockElements.showNotifications.checked).toBe(false);
      expect(mockElements.showBadge.checked).toBe(true);
      expect(mockElements.cleanUrls.checked).toBe(false);
    });

    test('should handle storage error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      browser.storage.sync.get.mockRejectedValue(new Error('Storage unavailable'));

      await triggerDOMContentLoaded();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error loading settings:',
        expect.any(Error)
      );
      // Should fall back to defaults
      expect(mockElements.showBadge.checked).toBe(true);
      consoleSpy.mockRestore();
    });
  });

  describe('saveSettings()', () => {
    test('should save current UI values to storage', async () => {
      await triggerDOMContentLoaded();

      // Simulate user changing settings via UI
      mockElements.showNotifications.checked = true;
      mockElements.cleanUrls.checked = true;

      const clickHandler = getClickHandler('saveButton');
      await clickHandler();

      expect(browser.storage.sync.set).toHaveBeenCalledWith(
        expect.objectContaining({
          showNotifications: true,
          cleanUrls: true
        })
      );
    });

    test('should show success status after saving', async () => {
      await triggerDOMContentLoaded();

      const clickHandler = getClickHandler('saveButton');
      await clickHandler();

      expect(mockElements.statusMessage.textContent).toBe('Settings saved successfully!');
    });

    test('should handle save error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      // The first get call is in loadSettings, the second is in saveSettings
      browser.storage.sync.get
        .mockResolvedValueOnce({}) // loadSettings
        .mockResolvedValueOnce({ defaultFormat: 'markdown' }); // saveSettings reads defaultFormat
      browser.storage.sync.set.mockRejectedValue(new Error('Write error'));

      await triggerDOMContentLoaded();

      const clickHandler = getClickHandler('saveButton');
      await clickHandler();

      expect(mockElements.statusMessage.textContent).toBe('Error saving settings');
      consoleSpy.mockRestore();
    });
  });
});
