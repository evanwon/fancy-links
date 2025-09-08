/**
 * Tests for keyboard shortcuts utility functions
 */

const KeyboardShortcuts = require('../../src/utils/keyboard-shortcuts');

describe('KeyboardShortcuts', () => {
  // Store original values to restore after tests
  const originalPlatform = navigator.platform;
  const originalUserAgent = navigator.userAgent;

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

  describe('getOSModifierKey', () => {
    test('returns Cmd for Mac platform', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true
      });
      expect(KeyboardShortcuts.getOSModifierKey()).toBe('Cmd');
    });

    test('returns Cmd for Macintosh in user agent', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true
      });
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        writable: true
      });
      expect(KeyboardShortcuts.getOSModifierKey()).toBe('Cmd');
    });

    test('returns Ctrl for Windows platform', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true
      });
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true
      });
      expect(KeyboardShortcuts.getOSModifierKey()).toBe('Ctrl');
    });

    test('returns Ctrl for Linux platform', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Linux x86_64',
        writable: true
      });
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (X11; Linux x86_64)',
        writable: true
      });
      expect(KeyboardShortcuts.getOSModifierKey()).toBe('Ctrl');
    });
  });

  describe('isMacOS', () => {
    test('returns true for Mac platform', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true
      });
      expect(KeyboardShortcuts.isMacOS()).toBe(true);
    });

    test('returns true for Macintosh in user agent', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true
      });
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        writable: true
      });
      expect(KeyboardShortcuts.isMacOS()).toBe(true);
    });

    test('returns false for Windows', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true
      });
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true
      });
      expect(KeyboardShortcuts.isMacOS()).toBe(false);
    });

    test('returns false for Linux', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Linux x86_64',
        writable: true
      });
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (X11; Linux x86_64)',
        writable: true
      });
      expect(KeyboardShortcuts.isMacOS()).toBe(false);
    });
  });

  describe('formatShortcutForDisplay', () => {
    test('returns empty string for null/undefined input', () => {
      expect(KeyboardShortcuts.formatShortcutForDisplay(null)).toBe('');
      expect(KeyboardShortcuts.formatShortcutForDisplay(undefined)).toBe('');
      expect(KeyboardShortcuts.formatShortcutForDisplay('')).toBe('');
    });

    test('converts Command to Cmd on Mac', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true
      });
      expect(KeyboardShortcuts.formatShortcutForDisplay('Command+Alt+C'))
        .toBe('Cmd+Option+C');
    });

    test('converts Alt to Option on Mac', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true
      });
      expect(KeyboardShortcuts.formatShortcutForDisplay('Ctrl+Alt+C'))
        .toBe('Ctrl+Option+C');
    });

    test('does not modify shortcuts on non-Mac platforms', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true
      });
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true
      });
      expect(KeyboardShortcuts.formatShortcutForDisplay('Ctrl+Alt+C'))
        .toBe('Ctrl+Alt+C');
    });

    test('handles shortcuts without Command or Alt', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true
      });
      expect(KeyboardShortcuts.formatShortcutForDisplay('Ctrl+C'))
        .toBe('Ctrl+C');
    });
  });

  describe('getDefaultShortcut', () => {
    test('returns Mac shortcut for macOS', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true
      });
      expect(KeyboardShortcuts.getDefaultShortcut()).toBe('Cmd+Option+C');
    });

    test('returns Windows/Linux shortcut for non-Mac', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true
      });
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true
      });
      expect(KeyboardShortcuts.getDefaultShortcut()).toBe('Ctrl+Alt+C');
    });
  });

  describe('getCurrentShortcut', () => {
    beforeEach(() => {
      // Reset browser API mocks
      delete global.browser;
      delete global.chrome;
    });

    test('returns shortcut from browser.commands API when available', async () => {
      global.browser = {
        commands: {
          getAll: jest.fn().mockResolvedValue([
            {
              name: 'copy-fancy-link',
              shortcut: 'Ctrl+Alt+C'
            }
          ])
        }
      };

      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true
      });
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true
      });

      const result = await KeyboardShortcuts.getCurrentShortcut();
      expect(result).toBe('Ctrl+Alt+C');
      expect(global.browser.commands.getAll).toHaveBeenCalled();
    });

    test('formats shortcut for display when retrieved from API', async () => {
      global.browser = {
        commands: {
          getAll: jest.fn().mockResolvedValue([
            {
              name: 'copy-fancy-link',
              shortcut: 'Command+Alt+C'
            }
          ])
        }
      };

      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true
      });

      const result = await KeyboardShortcuts.getCurrentShortcut();
      expect(result).toBe('Cmd+Option+C');
    });

    test('falls back to chrome API when browser is not available', async () => {
      global.chrome = {
        commands: {
          getAll: jest.fn().mockResolvedValue([
            {
              name: 'copy-fancy-link',
              shortcut: 'Ctrl+Alt+C'
            }
          ])
        }
      };

      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true
      });
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true
      });

      const result = await KeyboardShortcuts.getCurrentShortcut();
      expect(result).toBe('Ctrl+Alt+C');
      expect(global.chrome.commands.getAll).toHaveBeenCalled();
    });

    test('returns default shortcut when no API available', async () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true
      });
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true
      });

      const result = await KeyboardShortcuts.getCurrentShortcut();
      expect(result).toBe('Ctrl+Alt+C');
    });

    test('returns default shortcut when command not found', async () => {
      global.browser = {
        commands: {
          getAll: jest.fn().mockResolvedValue([
            {
              name: 'other-command',
              shortcut: 'Ctrl+Alt+X'
            }
          ])
        }
      };

      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true
      });
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true
      });

      const result = await KeyboardShortcuts.getCurrentShortcut();
      expect(result).toBe('Ctrl+Alt+C');
    });

    test('returns default shortcut when command has no shortcut', async () => {
      global.browser = {
        commands: {
          getAll: jest.fn().mockResolvedValue([
            {
              name: 'copy-fancy-link',
              shortcut: ''
            }
          ])
        }
      };

      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true
      });
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true
      });

      const result = await KeyboardShortcuts.getCurrentShortcut();
      expect(result).toBe('Ctrl+Alt+C');
    });

    test('handles API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      global.browser = {
        commands: {
          getAll: jest.fn().mockRejectedValue(new Error('API Error'))
        }
      };

      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true
      });
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true
      });

      const result = await KeyboardShortcuts.getCurrentShortcut();
      expect(result).toBe('Ctrl+Alt+C');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Could not get keyboard shortcut from commands API:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    test('handles missing commands.getAll method', async () => {
      global.browser = {
        commands: {}
      };

      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true
      });
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true
      });

      const result = await KeyboardShortcuts.getCurrentShortcut();
      expect(result).toBe('Ctrl+Alt+C');
    });
  });
});