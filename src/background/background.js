/**
 * Background script for Fancy Links extension
 * Handles copying links in various formats
 */

// Use shared format library loaded by manifest.json
// Note: FancyLinkFormatConfig is available from format-registry.js

// Default settings
const DEFAULT_FORMAT = 'markdown';
const NOTIFICATION_TIMEOUT = 2000;

/**
 * Get the current format setting from storage
 */
async function getCurrentFormat() {
  try {
    const result = await browser.storage.sync.get('defaultFormat');
    return result.defaultFormat || DEFAULT_FORMAT;
  } catch (error) {
    console.error('Error getting format setting:', error);
    return DEFAULT_FORMAT;
  }
}

/**
 * Get all settings from storage
 */
async function getSettings() {
  try {
    const result = await browser.storage.sync.get({
      defaultFormat: DEFAULT_FORMAT,
      cleanUrls: false,
      showNotifications: false,
      showBadge: true
    });
    return result;
  } catch (error) {
    console.error('Error getting settings:', error);
    return { defaultFormat: DEFAULT_FORMAT, cleanUrls: false, showNotifications: false, showBadge: true };
  }
}

/**
 * Copy the current tab's link in the specified format
 */
async function copyFancyLink(formatType = null) {
  try {
    // Get current tab
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) {
      throw new Error('No active tab found');
    }
    
    const tab = tabs[0];
    const title = tab.title || '';
    let url = tab.url || '';
    
    // Check if we have a valid URL
    if (!url || url.startsWith('about:') || url.startsWith('chrome:')) {
      throw new Error('Cannot copy this type of URL');
    }
    
    // Get settings
    const settings = await getSettings();
    const format = formatType || settings.defaultFormat;
    
    // Clean URL if enabled
    if (settings.cleanUrls && window.FancyLinkCleanUrl) {
      url = window.FancyLinkCleanUrl.cleanUrl(url);
    }
    
    // Get the formatter configuration and function
    const formatConfig = window.FancyLinkFormatConfig.getFormatConfig(format);
    if (!formatConfig || !formatConfig.format) {
      throw new Error(`Unknown format: ${format}`);
    }
    
    // Format the link
    const formattedLink = formatConfig.format(title, url);
    
    // Copy to clipboard using content script injection
    // This is necessary because clipboard API isn't available in background scripts
    const result = await browser.tabs.executeScript(tab.id, {
      code: `
        (async function() {
          try {
            const text = ${JSON.stringify(formattedLink)};
            const isRichText = ${format === 'rtf'};
            
            if (isRichText) {
              // For RTF, try to copy as rich text
              const rtfBlob = new Blob([text], { type: 'text/rtf' });
              const plainText = text.replace(/<[^>]*>/g, ''); // Strip RTF for plain text
              const plainBlob = new Blob([plainText], { type: 'text/plain' });
              
              const clipboardItem = new ClipboardItem({
                'text/rtf': rtfBlob,
                'text/plain': plainBlob
              });
              
              await navigator.clipboard.write([clipboardItem]);
            } else {
              // For all other formats
              await navigator.clipboard.writeText(text);
            }
            
            return { success: true };
          } catch (error) {
            // Fallback to older clipboard API
            const textarea = document.createElement('textarea');
            textarea.value = ${JSON.stringify(formattedLink)};
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            
            if (!success) {
              throw new Error('Failed to copy to clipboard');
            }
            
            return { success: true };
          }
        })();
      `
    });
    
    // Show success notification
    await showNotification('success', `Copied ${format} link!`, title, settings);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error copying fancy link:', error);
    // Load settings for notification, or use defaults if not available
    const notificationSettings = settings || await getSettings();
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
      
      await browser.browserAction.setBadgeText({ text: badgeText });
      await browser.browserAction.setBadgeBackgroundColor({ color: badgeColor });
      
      // Clear badge after timeout
      setTimeout(() => {
        browser.browserAction.setBadgeText({ text: '' });
      }, NOTIFICATION_TIMEOUT);
    }
    
    // Show system notification only if enabled (default false)
    if (settings.showNotifications === true) {
      await browser.notifications.create({
        type: 'basic',
        iconUrl: browser.runtime.getURL('icons/icon-48.png'),
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
browser.commands.onCommand.addListener(async (command) => {
  if (command === 'copy-fancy-link') {
    await copyFancyLink();
  }
});

/**
 * Handle messages from popup or content scripts
 */
browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'copyLink') {
    const result = await copyFancyLink(request.format);
    return result;
  }
  
  if (request.action === 'cleanUrl') {
    try {
      if (window.FancyLinkCleanUrl && request.url) {
        const cleanedUrl = window.FancyLinkCleanUrl.cleanUrl(request.url);
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
browser.browserAction.onClicked.addListener(async () => {
  await copyFancyLink();
});