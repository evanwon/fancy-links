/**
 * Tests for browser API abstraction layer
 */

describe('BrowserApi', () => {
  let BrowserApi;

  afterEach(() => {
    delete global.browser;
    delete global.chrome;
    jest.resetModules();
  });

  function loadBrowserApi() {
    jest.resetModules();
    BrowserApi = require('../../src/utils/browser-api.js');
    return BrowserApi;
  }

  describe('getApi()', () => {
    test('should return browser when available', () => {
      global.browser = { runtime: {} };
      loadBrowserApi();
      expect(BrowserApi.getApi()).toBe(global.browser);
    });

    test('should return chrome when browser is not available', () => {
      delete global.browser;
      global.chrome = { runtime: {} };
      loadBrowserApi();
      expect(BrowserApi.getApi()).toBe(global.chrome);
    });

    test('should return null when neither is available', () => {
      delete global.browser;
      delete global.chrome;
      loadBrowserApi();
      expect(BrowserApi.getApi()).toBeNull();
    });

    test('should prefer browser over chrome when both exist', () => {
      global.browser = { runtime: { id: 'firefox' } };
      global.chrome = { runtime: { id: 'chrome' } };
      loadBrowserApi();
      expect(BrowserApi.getApi()).toBe(global.browser);
    });
  });

  describe('getManifestVersion()', () => {
    test('should return manifest version 2 for MV2', () => {
      global.browser = {
        runtime: { getManifest: jest.fn(() => ({ manifest_version: 2 })) }
      };
      loadBrowserApi();
      expect(BrowserApi.getManifestVersion()).toBe(2);
    });

    test('should return manifest version 3 for MV3', () => {
      delete global.browser;
      global.chrome = {
        runtime: { getManifest: jest.fn(() => ({ manifest_version: 3 })) }
      };
      loadBrowserApi();
      expect(BrowserApi.getManifestVersion()).toBe(3);
    });

    test('should return 2 when no API available', () => {
      delete global.browser;
      delete global.chrome;
      loadBrowserApi();
      expect(BrowserApi.getManifestVersion()).toBe(2);
    });
  });

  describe('getAction()', () => {
    test('should return browserAction for MV2', () => {
      const mockBrowserAction = { setBadgeText: jest.fn() };
      global.browser = {
        runtime: { getManifest: jest.fn(() => ({ manifest_version: 2 })) },
        browserAction: mockBrowserAction
      };
      loadBrowserApi();
      expect(BrowserApi.getAction()).toBe(mockBrowserAction);
    });

    test('should return action for MV3', () => {
      delete global.browser;
      const mockAction = { setBadgeText: jest.fn() };
      global.chrome = {
        runtime: { getManifest: jest.fn(() => ({ manifest_version: 3 })) },
        action: mockAction
      };
      loadBrowserApi();
      expect(BrowserApi.getAction()).toBe(mockAction);
    });

    test('should return null when no API available', () => {
      delete global.browser;
      delete global.chrome;
      loadBrowserApi();
      expect(BrowserApi.getAction()).toBeNull();
    });
  });

  describe('setBadgeText()', () => {
    test('should delegate to browserAction.setBadgeText on MV2', () => {
      const mockSetBadgeText = jest.fn();
      global.browser = {
        runtime: { getManifest: jest.fn(() => ({ manifest_version: 2 })) },
        browserAction: {
          setBadgeText: mockSetBadgeText,
          setBadgeBackgroundColor: jest.fn()
        }
      };
      loadBrowserApi();
      BrowserApi.setBadgeText({ text: '✓' });
      expect(mockSetBadgeText).toHaveBeenCalledWith({ text: '✓' });
    });

    test('should delegate to action.setBadgeText on MV3', () => {
      delete global.browser;
      const mockSetBadgeText = jest.fn();
      global.chrome = {
        runtime: { getManifest: jest.fn(() => ({ manifest_version: 3 })) },
        action: {
          setBadgeText: mockSetBadgeText,
          setBadgeBackgroundColor: jest.fn()
        }
      };
      loadBrowserApi();
      BrowserApi.setBadgeText({ text: '!' });
      expect(mockSetBadgeText).toHaveBeenCalledWith({ text: '!' });
    });

    test('should resolve when no API available', async () => {
      delete global.browser;
      delete global.chrome;
      loadBrowserApi();
      await expect(BrowserApi.setBadgeText({ text: '✓' })).resolves.toBeUndefined();
    });
  });

  describe('setBadgeBackgroundColor()', () => {
    test('should delegate to correct action API', () => {
      const mockSetColor = jest.fn();
      global.browser = {
        runtime: { getManifest: jest.fn(() => ({ manifest_version: 2 })) },
        browserAction: {
          setBadgeText: jest.fn(),
          setBadgeBackgroundColor: mockSetColor
        }
      };
      loadBrowserApi();
      BrowserApi.setBadgeBackgroundColor({ color: '#4CAF50' });
      expect(mockSetColor).toHaveBeenCalledWith({ color: '#4CAF50' });
    });

    test('should resolve when no API available', async () => {
      delete global.browser;
      delete global.chrome;
      loadBrowserApi();
      await expect(BrowserApi.setBadgeBackgroundColor({ color: '#F00' })).resolves.toBeUndefined();
    });
  });

  describe('onActionClicked()', () => {
    test('should register listener on browserAction for MV2', () => {
      const mockAddListener = jest.fn();
      global.browser = {
        runtime: { getManifest: jest.fn(() => ({ manifest_version: 2 })) },
        browserAction: {
          onClicked: { addListener: mockAddListener }
        }
      };
      loadBrowserApi();
      const callback = jest.fn();
      BrowserApi.onActionClicked(callback);
      expect(mockAddListener).toHaveBeenCalledWith(callback);
    });

    test('should register listener on action for MV3', () => {
      delete global.browser;
      const mockAddListener = jest.fn();
      global.chrome = {
        runtime: { getManifest: jest.fn(() => ({ manifest_version: 3 })) },
        action: {
          onClicked: { addListener: mockAddListener }
        }
      };
      loadBrowserApi();
      const callback = jest.fn();
      BrowserApi.onActionClicked(callback);
      expect(mockAddListener).toHaveBeenCalledWith(callback);
    });
  });

  describe('executeContentScript()', () => {
    test('should use tabs.executeScript on MV2', () => {
      const mockExecuteScript = jest.fn(() => Promise.resolve());
      global.browser = {
        runtime: { getManifest: jest.fn(() => ({ manifest_version: 2 })) },
        tabs: { executeScript: mockExecuteScript }
      };
      loadBrowserApi();
      BrowserApi.executeContentScript(1, '/content/script.js');
      expect(mockExecuteScript).toHaveBeenCalledWith(1, { file: '/content/script.js' });
    });

    test('should use scripting.executeScript on MV3', () => {
      delete global.browser;
      const mockExecuteScript = jest.fn(() => Promise.resolve());
      global.chrome = {
        runtime: { getManifest: jest.fn(() => ({ manifest_version: 3 })) },
        scripting: { executeScript: mockExecuteScript }
      };
      loadBrowserApi();
      BrowserApi.executeContentScript(5, '/content/script.js');
      expect(mockExecuteScript).toHaveBeenCalledWith({
        target: { tabId: 5 },
        files: ['/content/script.js']
      });
    });

    test('should resolve when no API available', async () => {
      delete global.browser;
      delete global.chrome;
      loadBrowserApi();
      await expect(BrowserApi.executeContentScript(1, '/test.js')).resolves.toBeUndefined();
    });
  });

  describe('getBrowserName()', () => {
    test('should return firefox when browser is available', () => {
      global.browser = { runtime: {} };
      loadBrowserApi();
      expect(BrowserApi.getBrowserName()).toBe('firefox');
    });

    test('should return chrome when only chrome is available', () => {
      delete global.browser;
      global.chrome = { runtime: {} };
      loadBrowserApi();
      expect(BrowserApi.getBrowserName()).toBe('chrome');
    });

    test('should return unknown when neither is available', () => {
      delete global.browser;
      delete global.chrome;
      loadBrowserApi();
      expect(BrowserApi.getBrowserName()).toBe('unknown');
    });
  });

  describe('exports', () => {
    test('should export via module.exports', () => {
      global.browser = { runtime: {} };
      loadBrowserApi();
      expect(BrowserApi).toBeDefined();
      expect(typeof BrowserApi.getApi).toBe('function');
      expect(typeof BrowserApi.getAction).toBe('function');
      expect(typeof BrowserApi.getManifestVersion).toBe('function');
      expect(typeof BrowserApi.setBadgeText).toBe('function');
      expect(typeof BrowserApi.setBadgeBackgroundColor).toBe('function');
      expect(typeof BrowserApi.onActionClicked).toBe('function');
      expect(typeof BrowserApi.executeContentScript).toBe('function');
      expect(typeof BrowserApi.getBrowserName).toBe('function');
    });
  });
});
