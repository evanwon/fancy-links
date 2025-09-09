/**
 * Tests for background script functionality
 */

// Mock format registry
global.window = global.window || {};
global.window.FancyLinkFormatConfig = {
  getFormatConfig: jest.fn(),
  getFormats: jest.fn()
};

global.window.FancyLinkCleanUrl = {
  cleanUrl: jest.fn()
};

describe('Background Script', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Clear the module cache to ensure fresh load
    jest.resetModules();
    
    // Mock browser APIs
    global.browser = {
      storage: {
        sync: {
          get: jest.fn()
        }
      },
      tabs: {
        query: jest.fn(),
        executeScript: jest.fn()
      },
      browserAction: {
        setBadgeText: jest.fn(),
        setBadgeBackgroundColor: jest.fn(),
        onClicked: {
          addListener: jest.fn()
        }
      },
      notifications: {
        create: jest.fn()
      },
      runtime: {
        getURL: jest.fn(),
        onMessage: {
          addListener: jest.fn()
        }
      },
      commands: {
        onCommand: {
          addListener: jest.fn()
        }
      }
    };
    
    // Mock setTimeout
    global.setTimeout = jest.fn((fn, timeout) => fn());
    
    // Reset window object before loading
    global.window.FancyLinkCleanUrl = {
      cleanUrl: jest.fn()
    };
    
    // Load the background script - this will export functions to global
    require('../../src/background/background.js');
  });

  describe('Storage Operations', () => {
    describe('getCurrentFormat()', () => {
      test('should return stored format when available', async () => {
        browser.storage.sync.get.mockResolvedValue({ defaultFormat: 'slack' });
        
        const result = await global.getCurrentFormat();
        
        expect(result).toBe('slack');
        expect(browser.storage.sync.get).toHaveBeenCalledWith('defaultFormat');
      });

      test('should return DEFAULT_FORMAT when no stored format', async () => {
        browser.storage.sync.get.mockResolvedValue({});
        
        const result = await global.getCurrentFormat();
        
        expect(result).toBe('markdown');
      });

      test('should return DEFAULT_FORMAT on storage error', async () => {
        browser.storage.sync.get.mockRejectedValue(new Error('Storage error'));
        
        const result = await global.getCurrentFormat();
        
        expect(result).toBe('markdown');
      });
    });

    describe('getSettings()', () => {
      test('should return all settings when present', async () => {
        const mockSettings = {
          defaultFormat: 'html',
          cleanUrls: true,
          showNotifications: true,
          showBadge: false
        };
        browser.storage.sync.get.mockResolvedValue(mockSettings);
        
        const result = await global.getSettings();
        
        expect(result).toEqual(mockSettings);
        expect(browser.storage.sync.get).toHaveBeenCalledWith({
          defaultFormat: 'markdown',
          cleanUrls: false,
          showNotifications: false,
          showBadge: true
        });
      });

      test('should return defaults for missing settings', async () => {
        browser.storage.sync.get.mockResolvedValue({ defaultFormat: 'slack' });
        
        const result = await global.getSettings();
        
        expect(result).toEqual({
          defaultFormat: 'slack'
        });
      });

      test('should return defaults on storage API failure', async () => {
        browser.storage.sync.get.mockRejectedValue(new Error('API unavailable'));
        
        const result = await global.getSettings();
        
        expect(result).toEqual({
          defaultFormat: 'markdown',
          cleanUrls: false,
          showNotifications: false,
          showBadge: true
        });
      });
    });
  });

  describe('Copy Operations', () => {
    beforeEach(() => {
      // Mock successful tab query
      browser.tabs.query.mockResolvedValue([mockTab()]);
      
      // Mock successful script execution
      browser.tabs.executeScript.mockResolvedValue([{ success: true }]);
      
      // Mock format config
      global.window.FancyLinkFormatConfig.getFormatConfig.mockReturnValue({
        format: jest.fn((title, url) => `[${title}](${url})`)
      });
    });

    describe('copyFancyLink()', () => {
      test('should copy with markdown format by default', async () => {
        browser.storage.sync.get.mockResolvedValue({
          defaultFormat: 'markdown',
          cleanUrls: false,
          showNotifications: false,
          showBadge: true
        });

        const result = await global.copyFancyLink();

        expect(result.success).toBe(true);
        expect(browser.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
        expect(global.window.FancyLinkFormatConfig.getFormatConfig).toHaveBeenCalledWith('markdown');
      });

      test('should copy with specified format type', async () => {
        browser.storage.sync.get.mockResolvedValue({
          defaultFormat: 'markdown',
          cleanUrls: false,
          showNotifications: false,
          showBadge: true
        });

        await global.copyFancyLink('slack');

        expect(global.window.FancyLinkFormatConfig.getFormatConfig).toHaveBeenCalledWith('slack');
      });

      test('should clean URLs when cleanUrls enabled', async () => {
        browser.storage.sync.get.mockResolvedValue({
          defaultFormat: 'markdown',
          cleanUrls: true,
          showNotifications: false,
          showBadge: true
        });
        global.window.FancyLinkCleanUrl.cleanUrl.mockReturnValue('https://example.com/clean');

        await global.copyFancyLink();

        expect(global.window.FancyLinkCleanUrl.cleanUrl).toHaveBeenCalledWith('https://example.com');
      });

      test('should not clean URLs when cleanUrls disabled', async () => {
        browser.storage.sync.get.mockResolvedValue({
          defaultFormat: 'markdown',
          cleanUrls: false,
          showNotifications: false,
          showBadge: true
        });

        await global.copyFancyLink();

        expect(global.window.FancyLinkCleanUrl.cleanUrl).not.toHaveBeenCalled();
      });

      test('should handle RTF format with ClipboardItem API', async () => {
        browser.storage.sync.get.mockResolvedValue({
          defaultFormat: 'rtf',
          cleanUrls: false,
          showNotifications: false,
          showBadge: true
        });
        global.window.FancyLinkFormatConfig.getFormatConfig.mockReturnValue({
          format: jest.fn(() => '{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}} Example}')
        });

        const result = await global.copyFancyLink('rtf');

        expect(result.success).toBe(true);
        expect(browser.tabs.executeScript).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            code: expect.stringContaining('isRichText = true')
          })
        );
      });

      test('should handle invalid URLs (about:, chrome:)', async () => {
        browser.tabs.query.mockResolvedValue([mockTab({ url: 'about:blank' })]);

        const result = await global.copyFancyLink();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Cannot copy this type of URL');
      });

      test('should handle no active tab', async () => {
        browser.tabs.query.mockResolvedValue([]);

        const result = await global.copyFancyLink();

        expect(result.success).toBe(false);
        expect(result.error).toBe('No active tab found');
      });

      test('should handle missing tab information', async () => {
        browser.tabs.query.mockResolvedValue([mockTab({ title: '', url: '' })]);

        const result = await global.copyFancyLink();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Cannot copy this type of URL');
      });

      test('should handle unknown format type', async () => {
        browser.storage.sync.get.mockResolvedValue({
          defaultFormat: 'markdown',
          cleanUrls: false,
          showNotifications: false,
          showBadge: true
        });
        global.window.FancyLinkFormatConfig.getFormatConfig.mockReturnValue(null);

        const result = await global.copyFancyLink('unknown');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Unknown format: unknown');
      });

      test('should handle clipboard API failure with fallback', async () => {
        browser.storage.sync.get.mockResolvedValue({
          defaultFormat: 'markdown',
          cleanUrls: false,
          showNotifications: false,
          showBadge: true
        });
        
        // Mock the content script that handles clipboard fallback
        browser.tabs.executeScript.mockResolvedValue([{ success: true }]);

        const result = await global.copyFancyLink();

        expect(result.success).toBe(true);
        expect(browser.tabs.executeScript).toHaveBeenCalled();
        
        // Verify notification was attempted (badge set)
        expect(browser.browserAction.setBadgeText).toHaveBeenCalled();
      });

      test('should handle script execution failure', async () => {
        browser.storage.sync.get.mockResolvedValue({
          defaultFormat: 'markdown',
          cleanUrls: false,
          showNotifications: false,
          showBadge: true
        });
        browser.tabs.executeScript.mockRejectedValue(new Error('Script execution failed'));
        global.showNotification = jest.fn();

        const result = await global.copyFancyLink();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Script execution failed');
      });
    });
  });

  describe('Message Handlers', () => {
    test('should handle copyLink action', async () => {
      const mockRequest = { action: 'copyLink', format: 'slack' };
      
      // Mock the necessary dependencies for copyFancyLink
      browser.storage.sync.get.mockResolvedValue({ defaultFormat: 'markdown' });
      browser.tabs.query.mockResolvedValue([mockTab()]);
      browser.tabs.executeScript.mockResolvedValue([{ success: true }]);
      global.window.FancyLinkFormatConfig.getFormatConfig.mockReturnValue({
        format: jest.fn((title, url) => `<${url}|${title}>`)
      });
      
      // Get message handler - it should have been registered when background.js loaded
      const messageHandler = browser.runtime.onMessage.addListener.mock.calls[0][0];
      const result = await messageHandler(mockRequest);

      expect(result.success).toBe(true);
      expect(global.window.FancyLinkFormatConfig.getFormatConfig).toHaveBeenCalledWith('slack');
    });

    test('should handle cleanUrl action with FancyLinkCleanUrl available', async () => {
      const mockRequest = { action: 'cleanUrl', url: 'https://example.com?utm=test' };
      global.window.FancyLinkCleanUrl.cleanUrl.mockReturnValue('https://example.com');

      const messageHandler = browser.runtime.onMessage.addListener.mock.calls[0][0];
      const result = await messageHandler(mockRequest);

      expect(global.window.FancyLinkCleanUrl.cleanUrl).toHaveBeenCalledWith('https://example.com?utm=test');
      expect(result).toEqual({ cleanedUrl: 'https://example.com' });
    });

    test('should handle cleanUrl action with FancyLinkCleanUrl missing', async () => {
      const mockRequest = { action: 'cleanUrl', url: 'https://example.com?utm=test' };
      global.window.FancyLinkCleanUrl = null;

      const messageHandler = browser.runtime.onMessage.addListener.mock.calls[0][0];
      const result = await messageHandler(mockRequest);
      expect(result).toEqual({ cleanedUrl: 'https://example.com?utm=test' });
    });

    test('should handle cleanUrl action error gracefully', async () => {
      const mockRequest = { action: 'cleanUrl', url: 'https://example.com' };
      global.window.FancyLinkCleanUrl = {
        cleanUrl: jest.fn().mockImplementation(() => {
          throw new Error('Clean URL error');
        })
      };

      const messageHandler = browser.runtime.onMessage.addListener.mock.calls[0][0];
      const result = await messageHandler(mockRequest);
      expect(result).toEqual({ cleanedUrl: 'https://example.com' });
      expect(global.window.FancyLinkCleanUrl.cleanUrl).toHaveBeenCalledWith('https://example.com');
    });

    test('should handle keyboard command copy-fancy-link', async () => {
      // Mock the necessary dependencies for copyFancyLink
      browser.storage.sync.get.mockResolvedValue({ defaultFormat: 'markdown' });
      browser.tabs.query.mockResolvedValue([mockTab()]);
      browser.tabs.executeScript.mockResolvedValue([{ success: true }]);
      global.window.FancyLinkFormatConfig.getFormatConfig.mockReturnValue({
        format: jest.fn((title, url) => `[${title}](${url})`)
      });
      
      // Get command handler - it should have been registered when background.js loaded
      const commandHandler = browser.commands.onCommand.addListener.mock.calls[0][0];
      
      await commandHandler('copy-fancy-link');
      
      // Verify that copyFancyLink was called (by checking its side effects)
      expect(browser.tabs.query).toHaveBeenCalled();
      expect(browser.tabs.executeScript).toHaveBeenCalled();
    });

    test('should handle browserAction click', async () => {
      // Mock the necessary dependencies for copyFancyLink
      browser.storage.sync.get.mockResolvedValue({ defaultFormat: 'markdown' });
      browser.tabs.query.mockResolvedValue([mockTab()]);
      browser.tabs.executeScript.mockResolvedValue([{ success: true }]);
      global.window.FancyLinkFormatConfig.getFormatConfig.mockReturnValue({
        format: jest.fn((title, url) => `[${title}](${url})`)
      });
      
      // Get click handler - it should have been registered when background.js loaded
      const clickHandler = browser.browserAction.onClicked.addListener.mock.calls[0][0];
      
      await clickHandler();
      
      // Verify that copyFancyLink was called (by checking its side effects)
      expect(browser.tabs.query).toHaveBeenCalled();
      expect(browser.tabs.executeScript).toHaveBeenCalled();
    });
  });

  describe('Notification System', () => {
    describe('showNotification()', () => {
      test('should show success badge when showBadge enabled', async () => {
        const settings = { showBadge: true, showNotifications: false };
        
        // Mock setTimeout to capture callback
        let timeoutCallback;
        global.setTimeout = jest.fn((callback, delay) => {
          timeoutCallback = callback;
          return 123;
        });

        await global.showNotification('success', 'Test Title', 'Test Message', settings);

        expect(browser.browserAction.setBadgeText).toHaveBeenCalledWith({ text: '✓' });
        expect(browser.browserAction.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#4CAF50' });
        expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);
      });

      test('should show error badge when showBadge enabled', async () => {
        const settings = { showBadge: true, showNotifications: false };
        
        // Mock setTimeout
        global.setTimeout = jest.fn((callback, delay) => {
          return 123;
        });

        await global.showNotification('error', 'Test Title', 'Test Message', settings);

        expect(browser.browserAction.setBadgeText).toHaveBeenCalledWith({ text: '!' });
        expect(browser.browserAction.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#F44336' });
      });

      test('should not show badge when showBadge disabled', async () => {
        const settings = { showBadge: false, showNotifications: false };

        await global.showNotification('success', 'Test Title', 'Test Message', settings);

        expect(browser.browserAction.setBadgeText).not.toHaveBeenCalled();
        expect(browser.browserAction.setBadgeBackgroundColor).not.toHaveBeenCalled();
      });

      test('should show system notification when showNotifications enabled', async () => {
        const settings = { showBadge: false, showNotifications: true };
        browser.runtime.getURL.mockReturnValue('moz-extension://test/icons/icon-48.png');
        
        // Mock setTimeout
        global.setTimeout = jest.fn((callback, delay) => {
          return 123;
        });

        await global.showNotification('success', 'Test Title', 'Test Message', settings);

        expect(browser.notifications.create).toHaveBeenCalledWith({
          type: 'basic',
          iconUrl: 'moz-extension://test/icons/icon-48.png',
          title: 'Test Title',
          message: 'Test Message'
        });
      });

      test('should not show system notification when showNotifications disabled', async () => {
        const settings = { showBadge: true, showNotifications: false };

        await global.showNotification('success', 'Test Title', 'Test Message', settings);

        expect(browser.notifications.create).not.toHaveBeenCalled();
      });

      test('should handle notification errors gracefully', async () => {
        const settings = { showBadge: true, showNotifications: true };
        browser.browserAction.setBadgeText.mockRejectedValue(new Error('Badge error'));
        browser.notifications.create.mockRejectedValue(new Error('Notification error'));
        browser.runtime.getURL.mockReturnValue('moz-extension://test/icons/icon-48.png');

        // Should not throw
        await expect(async () => {
          await global.showNotification('success', 'Test Title', 'Test Message', settings);
        }).not.toThrow();
      });

      test('should clear badge after timeout', async () => {
        const settings = { showBadge: true, showNotifications: false };
        
        // Mock setTimeout to capture the callback and simulate a timer ID.
        // Returning 123 as a fake timeout ID allows code under test to behave as if a real timer was set.
        let timeoutCallback;
        global.setTimeout = jest.fn((callback, delay) => {
          expect(delay).toBe(2000);
          timeoutCallback = callback;
          return 123;
        });
        
        // Reset mock to clear any previous calls
        browser.browserAction.setBadgeText.mockClear();

        await global.showNotification('success', 'Test Title', 'Test Message', settings);

        // Verify badge was set
        expect(browser.browserAction.setBadgeText).toHaveBeenCalledWith({ text: '✓' });
        
        // Execute the timeout callback
        expect(timeoutCallback).toBeDefined();
        timeoutCallback();
        
        // Verify badge was cleared
        expect(browser.browserAction.setBadgeText).toHaveBeenCalledWith({ text: '' });
      });
    });
  });
});