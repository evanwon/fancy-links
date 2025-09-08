/**
 * Tests for diagnostics utility functions
 */

const Diagnostics = require('../../src/utils/diagnostics');

describe('Diagnostics', () => {
  // Store original values to restore after tests
  const originalPlatform = navigator.platform;
  const originalUserAgent = navigator.userAgent;

  beforeEach(() => {
    // Reset browser API mocks
    delete global.browser;
    delete global.chrome;
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(navigator, 'platform', {
      value: originalPlatform,
      writable: true
    });
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true
    });
  });

  describe('collectDiagnostics', () => {
    test('collects basic diagnostics with browser API available', async () => {
      global.browser = {
        runtime: {
          getManifest: jest.fn().mockReturnValue({ version: '1.3.9' })
        },
        storage: {
          sync: {
            get: jest.fn().mockResolvedValue({
              defaultFormat: 'markdown',
              cleanUrls: true,
              debugMode: false,
              showNotifications: true,
              showBadge: false
            })
          }
        }
      };

      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Gecko Firefox/120.0',
        writable: true
      });
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true
      });

      const result = await Diagnostics.collectDiagnostics();

      expect(result.extension.version).toBe('1.3.9');
      expect(result.browser.name).toBe('Firefox');
      expect(result.browser.version).toBe('120.0');
      expect(result.browser.os).toBe('Windows 10/11');
      expect(result.settings.defaultFormat).toBe('markdown');
      expect(result.settings.cleanUrls).toBe(true);
      expect(result.settings.debugMode).toBe(false);
      expect(result.currentPage).toBeUndefined();
    });

    test('collects diagnostics with includeCurrentPage true', async () => {
      global.browser = {
        runtime: {
          getManifest: jest.fn().mockReturnValue({ version: '1.3.9' })
        },
        storage: {
          sync: {
            get: jest.fn().mockResolvedValue({})
          }
        },
        tabs: {
          query: jest.fn().mockResolvedValue([{
            url: 'https://example.com',
            title: 'Example Page'
          }])
        }
      };

      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko Firefox/120.0',
        writable: true
      });

      const result = await Diagnostics.collectDiagnostics(true);

      expect(result.currentPage.url).toBe('https://example.com');
      expect(result.currentPage.title).toBe('Example Page');
      expect(global.browser.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
    });

    test('falls back to chrome API when browser not available', async () => {
      global.chrome = {
        runtime: {
          getManifest: jest.fn().mockReturnValue({ version: '1.3.8' })
        },
        storage: {
          sync: {
            get: jest.fn().mockResolvedValue({
              defaultFormat: 'slack',
              cleanUrls: false
            })
          }
        }
      };

      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/120.0.0.0',
        writable: true
      });

      const result = await Diagnostics.collectDiagnostics();

      expect(result.extension.version).toBe('1.3.8');
      expect(result.browser.name).toBe('Chrome');
      expect(result.browser.version).toBe('120.0.0.0');
      expect(result.settings.defaultFormat).toBe('slack');
      expect(result.settings.cleanUrls).toBe(false);
    });

    test('handles missing browser API gracefully', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Safari/537.36',
        writable: true
      });

      const result = await Diagnostics.collectDiagnostics();

      expect(result.extension.version).toBe('Unknown - API not available');
      expect(result.browser.name).toBe('Safari');
      expect(result.settings.error).toBe('Unable to read settings');
    });

    test('handles storage API errors', async () => {
      global.browser = {
        runtime: {
          getManifest: jest.fn().mockReturnValue({ version: '1.3.9' })
        },
        storage: {
          sync: {
            get: jest.fn().mockRejectedValue(new Error('Storage error'))
          }
        }
      };

      const result = await Diagnostics.collectDiagnostics();

      expect(result.settings.error).toBe('Unable to read settings');
    });

    test('handles tabs API errors when including current page', async () => {
      global.browser = {
        runtime: {
          getManifest: jest.fn().mockReturnValue({ version: '1.3.9' })
        },
        storage: {
          sync: {
            get: jest.fn().mockResolvedValue({})
          }
        },
        tabs: {
          query: jest.fn().mockRejectedValue(new Error('Tabs error'))
        }
      };

      const result = await Diagnostics.collectDiagnostics(true);

      expect(result.currentPage.error).toBe('Unable to read current tab');
    });

    test('uses default settings when none provided', async () => {
      global.browser = {
        runtime: {
          getManifest: jest.fn().mockReturnValue({ version: '1.3.9' })
        },
        storage: {
          sync: {
            get: jest.fn().mockResolvedValue({})
          }
        }
      };

      const result = await Diagnostics.collectDiagnostics();

      expect(result.settings.defaultFormat).toBe('markdown');
      expect(result.settings.cleanUrls).toBe(true);
      expect(result.settings.debugMode).toBe(false);
      expect(result.settings.showNotifications).toBe(true);
      expect(result.settings.showBadge).toBe(true);
      expect(result.settings.includeCurrentPageInBugReports).toBe(false);
    });
  });

  describe('formatDiagnosticsForGitHub', () => {
    test('formats basic diagnostic information correctly', () => {
      const diagnostics = {
        extension: { version: '1.3.9' },
        browser: { name: 'Firefox', version: '120.0', os: 'Windows 10/11' },
        settings: {
          defaultFormat: 'markdown',
          cleanUrls: true,
          debugMode: false,
          showNotifications: true,
          showBadge: false
        }
      };

      const result = Diagnostics.formatDiagnosticsForGitHub(diagnostics);

      expect(result).toContain('## System Information');
      expect(result).toContain('- **Extension Version**: 1.3.9');
      expect(result).toContain('- **Browser**: Firefox 120.0');
      expect(result).toContain('- **OS**: Windows 10/11');
      expect(result).toContain('Default format: markdown');
      expect(result).toContain('Clean URLs: enabled');
      expect(result).toContain('Debug mode: disabled');
      expect(result).toContain('Notifications: enabled');
      expect(result).toContain('Badge: disabled');
    });

    test('includes current page information when available', () => {
      const diagnostics = {
        extension: { version: '1.3.9' },
        browser: { name: 'Firefox', version: '120.0', os: 'macOS' },
        settings: { defaultFormat: 'slack', cleanUrls: false, debugMode: true },
        currentPage: {
          url: 'https://example.com',
          title: 'Example Page'
        }
      };

      const result = Diagnostics.formatDiagnosticsForGitHub(diagnostics);

      expect(result).toContain('## Current Page Information');
      expect(result).toContain('- **URL**: https://example.com');
      expect(result).toContain('- **Title**: Example Page');
    });

    test('handles settings errors gracefully', () => {
      const diagnostics = {
        extension: { version: '1.3.9' },
        browser: { name: 'Firefox', version: '120.0', os: 'Linux' },
        settings: { error: 'Unable to read settings' }
      };

      const result = Diagnostics.formatDiagnosticsForGitHub(diagnostics);

      expect(result).toContain('## System Information');
      expect(result).toContain('- **Extension Version**: 1.3.9');
      expect(result).toContain('- **Browser**: Firefox 120.0');
      expect(result).not.toContain('Default format:');
    });

    test('skips current page section when error occurred', () => {
      const diagnostics = {
        extension: { version: '1.3.9' },
        browser: { name: 'Firefox', version: '120.0', os: 'macOS' },
        settings: { defaultFormat: 'markdown', cleanUrls: true, debugMode: false },
        currentPage: { error: 'Unable to read current tab' }
      };

      const result = Diagnostics.formatDiagnosticsForGitHub(diagnostics);

      expect(result).not.toContain('## Current Page Information');
      expect(result).not.toContain('- **URL**:');
    });
  });

  describe('generateGitHubIssueUrl', () => {
    test('generates correct GitHub issue URL with diagnostics', () => {
      const diagnostics = {
        extension: { version: '1.3.9' },
        browser: { name: 'Firefox', version: '120.0', os: 'Windows 10/11' },
        settings: {
          defaultFormat: 'markdown',
          cleanUrls: true,
          debugMode: false,
          showNotifications: true,
          showBadge: true
        }
      };

      const result = Diagnostics.generateGitHubIssueUrl(diagnostics);

      expect(result).toContain('https://github.com/evanwon/fancy-links/issues/new?');
      expect(result).toContain('title=Bug+report+v1.3.9%3A+%5BDescribe+your+issue+briefly%5D');
      expect(result).toContain('labels=bug');
      
      // Extract and decode the body parameter
      const url = new URL(result);
      const body = url.searchParams.get('body');
      expect(body).toContain('## Problem Description');
      expect(body).toContain('## Steps to Reproduce');
      expect(body).toContain('## System Information');
      expect(body).toContain('- **Extension Version**: 1.3.9');
      expect(body).toContain('## Additional Context');
    });

    test('includes current page information in GitHub issue when available', () => {
      const diagnostics = {
        extension: { version: '1.3.9' },
        browser: { name: 'Firefox', version: '120.0', os: 'macOS' },
        settings: { defaultFormat: 'slack', cleanUrls: false, debugMode: true },
        currentPage: {
          url: 'https://example.com',
          title: 'Example Page'
        }
      };

      const result = Diagnostics.generateGitHubIssueUrl(diagnostics);
      
      // Extract and decode the body parameter
      const url = new URL(result);
      const body = url.searchParams.get('body');
      expect(body).toContain('## Current Page Information');
      expect(body).toContain('- **URL**: https://example.com');
      expect(body).toContain('- **Title**: Example Page');
    });
  });

});