describe('Settings Defaults', () => {
  let settingsModule;

  beforeEach(() => {
    jest.resetModules();
    settingsModule = require('../../src/utils/settings-defaults.js');
  });

  test('should export DEFAULT_SETTINGS', () => {
    expect(settingsModule.DEFAULT_SETTINGS).toBeDefined();
  });

  test('should have all expected keys', () => {
    const expectedKeys = [
      'defaultFormat', 'showNotifications', 'showBadge',
      'cleanUrls', 'debugMode', 'includeCurrentPageInBugReports'
    ];
    expect(Object.keys(settingsModule.DEFAULT_SETTINGS).sort())
      .toEqual(expectedKeys.sort());
  });

  test('should have correct default values', () => {
    expect(settingsModule.DEFAULT_SETTINGS.defaultFormat).toBe('markdown');
    expect(settingsModule.DEFAULT_SETTINGS.showNotifications).toBe(false);
    expect(settingsModule.DEFAULT_SETTINGS.showBadge).toBe(true);
    expect(settingsModule.DEFAULT_SETTINGS.cleanUrls).toBe(false);
    expect(settingsModule.DEFAULT_SETTINGS.debugMode).toBe(false);
    expect(settingsModule.DEFAULT_SETTINGS.includeCurrentPageInBugReports).toBe(false);
  });
});
