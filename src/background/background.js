/**
 * Background script for Fancy Links extension
 * Handles copying links in various formats
 */

// Use shared libraries loaded by manifest.json
// Note: FancyLinkFormatConfig is available from format-registry.js
// Note: FancyLinkSettings is available from settings-defaults.js
// Note: BrowserApi is available from browser-api.js

const NOTIFICATION_TIMEOUT = 2000;

/**
 * Get the current format setting from storage
 */
async function getCurrentFormat() {
  try {
    const defaults = globalThis.FancyLinkSettings.DEFAULT_SETTINGS;
    const result = await BrowserApi.getApi().storage.sync.get('defaultFormat');
    return result.defaultFormat || defaults.defaultFormat;
  } catch (error) {
    console.error('Error getting format setting:', error);
    return globalThis.FancyLinkSettings.DEFAULT_SETTINGS.defaultFormat;
  }
}

/**
 * Get all settings from storage
 */
async function getSettings() {
  try {
    const defaults = globalThis.FancyLinkSettings.DEFAULT_SETTINGS;
    const result = await BrowserApi.getApi().storage.sync.get(defaults);
    return result;
  } catch (error) {
    console.error('Error getting settings:', error);
    return { ...globalThis.FancyLinkSettings.DEFAULT_SETTINGS };
  }
}

/**
 * Copy the current tab's link in the specified format
 */
async function copyFancyLink(formatType = null) {
  try {
    // Get current tab
    const tabs = await BrowserApi.getApi().tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) {
      throw new Error('No active tab found');
    }

    const tab = tabs[0];
    const title = tab.title || '';
    let url = tab.url || '';

    // Only allow safe URL schemes
    if (!url) {
      throw new Error('Cannot copy this type of URL');
    }
    const safeSchemes = ['http:', 'https:', 'ftp:'];
    try {
      const urlScheme = new URL(url).protocol;
      if (!safeSchemes.includes(urlScheme)) {
        throw new Error('Cannot copy this type of URL');
      }
    } catch (e) {
      if (e.message === 'Cannot copy this type of URL') throw e;
      throw new Error('Cannot copy this type of URL');
    }

    // Get settings
    const settings = await getSettings();
    const format = formatType || settings.defaultFormat;

    // Clean URL if enabled
    if (settings.cleanUrls && globalThis.FancyLinkCleanUrl) {
      url = globalThis.FancyLinkCleanUrl.cleanUrl(url);
    }

    // Get the formatter configuration and function
    const formatConfig = globalThis.FancyLinkFormatConfig.getFormatConfig(format);
    if (!formatConfig || !formatConfig.format) {
      throw new Error(`Unknown format: ${format}`);
    }

    // Format the link
    const formattedLink = formatConfig.format(title, url);

    // Copy to clipboard (MV2: content script, MV3: offscreen document)
    const result = await BrowserApi.copyToClipboard(tab.id, formattedLink);

    if (!result || !result.success) {
      throw new Error(result?.error || 'Clipboard copy failed');
    }

    // Show success notification
    await showNotification('success', `Copied ${format} link!`, title, settings);

    return { success: true };

  } catch (error) {
    console.error('Error copying fancy link:', error);
    // Load settings for notification, or use defaults if not available
    let notificationSettings;
    try {
      notificationSettings = await getSettings();
    } catch (settingsError) {
      console.error('Error getting notification settings:', settingsError);
      notificationSettings = { ...globalThis.FancyLinkSettings.DEFAULT_SETTINGS };
    }
    await showNotification('error', 'Failed to copy link', error.message, notificationSettings);
    return { success: false, error: error.message };
  }
}

/**
 * Show a notification to the user
 */
async function showNotification(type, title, message, settings = {}) {
  try {
    // Show badge if enabled (default true)
    if (settings.showBadge !== false) {
      const badgeColor = type === 'success' ? '#4CAF50' : '#F44336';
      const badgeText = type === 'success' ? '✓' : '!';

      await BrowserApi.setBadgeText({ text: badgeText });
      await BrowserApi.setBadgeBackgroundColor({ color: badgeColor });

      // Clear badge after timeout
      setTimeout(() => {
        BrowserApi.setBadgeText({ text: '' });
      }, NOTIFICATION_TIMEOUT);
    }

    // Show system notification only if enabled (default false)
    if (settings.showNotifications === true) {
      const api = BrowserApi.getApi();
      await api.notifications.create({
        type: 'basic',
        iconUrl: api.runtime.getURL('icons/icon-48.png'),
        title: title,
        message: message
      });
    }

  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

/**
 * Handle keyboard shortcut command
 */
BrowserApi.getApi().commands.onCommand.addListener(async (command) => {
  if (command === 'copy-fancy-link') {
    await copyFancyLink();
  }
});

/**
 * Handle messages from popup or content scripts
 */
BrowserApi.getApi().runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'copyLink') {
    const result = await copyFancyLink(request.format);
    return result;
  }

  if (request.action === 'cleanUrl') {
    try {
      if (globalThis.FancyLinkCleanUrl && request.url) {
        const cleanedUrl = globalThis.FancyLinkCleanUrl.cleanUrl(request.url);
        return { cleanedUrl };
      }
      return { cleanedUrl: request.url };
    } catch (error) {
      console.error('Error cleaning URL:', error);
      return { cleanedUrl: request.url };
    }
  }
});

/**
 * Handle toolbar button click (when popup is not shown)
 * This is a fallback - normally the popup will handle this
 */
BrowserApi.onActionClicked(async () => {
  await copyFancyLink();
});

// Export functions for testing
if (typeof global !== 'undefined') {
  global.getCurrentFormat = getCurrentFormat;
  global.getSettings = getSettings;
  global.copyFancyLink = copyFancyLink;
  global.showNotification = showNotification;
}