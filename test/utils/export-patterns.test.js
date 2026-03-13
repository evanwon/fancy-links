/**
 * Tests that utility modules export correctly in all 3 contexts:
 * - Node.js (module.exports / require)
 * - Browser window context (window.*)
 * - Service worker context (globalThis.* with no window)
 */

describe('Export Patterns', () => {
  afterEach(() => {
    jest.resetModules();
    // Clean up globalThis exports
    delete globalThis.FancyLinkFormatConfig;
    delete globalThis.FancyLinkFormatRegistry;
    delete globalThis.FancyLinkCleanUrl;
    delete globalThis.FancyLinkSettings;
    delete globalThis.Diagnostics;
    delete globalThis.BrowserApi;
  });

  describe('format-registry.js', () => {
    test('should export via require() (Node/CommonJS)', () => {
      const registry = require('../../src/formats/format-registry.js');
      expect(registry).toBeDefined();
      expect(registry.formatConfig).toBeDefined();
      expect(registry.getFormatKeys).toBeDefined();
      expect(registry.getFormatConfig).toBeDefined();
      expect(registry.getWorksWithText).toBeDefined();
    });

    test('should export to globalThis.FancyLinkFormatConfig', () => {
      require('../../src/formats/format-registry.js');
      expect(globalThis.FancyLinkFormatConfig).toBeDefined();
      expect(globalThis.FancyLinkFormatConfig.formatConfig).toBeDefined();
    });

    test('should export to globalThis.FancyLinkFormatRegistry (alias)', () => {
      require('../../src/formats/format-registry.js');
      expect(globalThis.FancyLinkFormatRegistry).toBeDefined();
      expect(globalThis.FancyLinkFormatRegistry.formatConfig).toBeDefined();
    });

    test('should export to window.FancyLinkFormatConfig', () => {
      require('../../src/formats/format-registry.js');
      expect(window.FancyLinkFormatConfig).toBeDefined();
      expect(window.FancyLinkFormatConfig.formatConfig).toBeDefined();
    });

    test('globalThis and window exports should be the same object', () => {
      require('../../src/formats/format-registry.js');
      expect(globalThis.FancyLinkFormatConfig).toBe(window.FancyLinkFormatConfig);
    });
  });

  describe('clean-url.js', () => {
    test('should export via require() (Node/CommonJS)', () => {
      const cleanUrl = require('../../src/utils/clean-url.js');
      expect(cleanUrl).toBeDefined();
      expect(typeof cleanUrl.cleanUrl).toBe('function');
      expect(typeof cleanUrl.hasTrackingParams).toBe('function');
      expect(cleanUrl.TRACKING_PARAMS).toBeDefined();
    });

    test('should export to globalThis.FancyLinkCleanUrl', () => {
      require('../../src/utils/clean-url.js');
      expect(globalThis.FancyLinkCleanUrl).toBeDefined();
      expect(typeof globalThis.FancyLinkCleanUrl.cleanUrl).toBe('function');
    });

    test('should export to window.FancyLinkCleanUrl', () => {
      require('../../src/utils/clean-url.js');
      expect(window.FancyLinkCleanUrl).toBeDefined();
      expect(typeof window.FancyLinkCleanUrl.cleanUrl).toBe('function');
    });
  });

  describe('settings-defaults.js', () => {
    test('should export via require() (Node/CommonJS)', () => {
      const settings = require('../../src/utils/settings-defaults.js');
      expect(settings).toBeDefined();
      expect(settings.DEFAULT_SETTINGS).toBeDefined();
      expect(settings.DEFAULT_SETTINGS.defaultFormat).toBe('markdown');
    });

    test('should export to globalThis.FancyLinkSettings', () => {
      require('../../src/utils/settings-defaults.js');
      expect(globalThis.FancyLinkSettings).toBeDefined();
      expect(globalThis.FancyLinkSettings.DEFAULT_SETTINGS).toBeDefined();
    });

    test('should export to window.FancyLinkSettings', () => {
      require('../../src/utils/settings-defaults.js');
      expect(window.FancyLinkSettings).toBeDefined();
      expect(window.FancyLinkSettings.DEFAULT_SETTINGS).toBeDefined();
    });
  });

  describe('diagnostics.js', () => {
    test('should export via require() (Node/CommonJS)', () => {
      const diagnostics = require('../../src/utils/diagnostics.js');
      expect(diagnostics).toBeDefined();
      expect(typeof diagnostics.collectDiagnostics).toBe('function');
      expect(typeof diagnostics.formatDiagnosticsForGitHub).toBe('function');
      expect(typeof diagnostics.generateGitHubIssueUrl).toBe('function');
    });

    test('should export to globalThis.Diagnostics', () => {
      require('../../src/utils/diagnostics.js');
      expect(globalThis.Diagnostics).toBeDefined();
      expect(typeof globalThis.Diagnostics.collectDiagnostics).toBe('function');
    });

    test('should export to window.Diagnostics', () => {
      require('../../src/utils/diagnostics.js');
      expect(window.Diagnostics).toBeDefined();
      expect(typeof window.Diagnostics.collectDiagnostics).toBe('function');
    });
  });

  describe('browser-api.js', () => {
    test('should export via require() (Node/CommonJS)', () => {
      const browserApi = require('../../src/utils/browser-api.js');
      expect(browserApi).toBeDefined();
      expect(typeof browserApi.getApi).toBe('function');
      expect(typeof browserApi.getAction).toBe('function');
      expect(typeof browserApi.executeContentScript).toBe('function');
      expect(typeof browserApi.getBrowserName).toBe('function');
    });

    test('should export to globalThis.BrowserApi', () => {
      require('../../src/utils/browser-api.js');
      expect(globalThis.BrowserApi).toBeDefined();
      expect(typeof globalThis.BrowserApi.getApi).toBe('function');
    });

    test('should export to window.BrowserApi', () => {
      require('../../src/utils/browser-api.js');
      expect(window.BrowserApi).toBeDefined();
      expect(typeof window.BrowserApi.getApi).toBe('function');
    });
  });
});
