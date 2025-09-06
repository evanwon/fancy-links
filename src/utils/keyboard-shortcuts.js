/**
 * Utility functions for handling keyboard shortcuts across the extension
 */

/**
 * Get OS-appropriate modifier key name
 * @returns {string} 'Cmd' for Mac, 'Ctrl' for others
 */
function getOSModifierKey() {
    const platform = navigator.platform;
    const userAgent = navigator.userAgent;
    
    if (platform.includes('Mac') || userAgent.includes('Macintosh')) {
        return 'Cmd';
    }
    return 'Ctrl';
}

/**
 * Check if running on macOS
 * @returns {boolean}
 */
function isMacOS() {
    const platform = navigator.platform;
    const userAgent = navigator.userAgent;
    return platform.includes('Mac') || userAgent.includes('Macintosh');
}

/**
 * Format keyboard shortcut for display
 * Converts Firefox's internal format to user-friendly format
 * @param {string} shortcut - The shortcut string from Firefox
 * @returns {string} User-friendly formatted shortcut
 */
function formatShortcutForDisplay(shortcut) {
    if (!shortcut) return '';
    
    // On Mac, convert "Command" to "Cmd" and "Alt" to "Option"
    if (isMacOS()) {
        return shortcut
            .replace('Command', 'Cmd')
            .replace('Alt', 'Option');
    }
    
    return shortcut;
}

/**
 * Get the default keyboard shortcut for the current OS
 * @returns {string} Default shortcut string
 */
function getDefaultShortcut() {
    return isMacOS() ? 'Cmd+Option+C' : 'Ctrl+Alt+C';
}

/**
 * Get the current keyboard shortcut from browser commands API
 * Falls back to default if not available
 * @returns {Promise<string>} The current or default shortcut
 */
async function getCurrentShortcut() {
    try {
        // Try to get browser API (cross-browser compatible)
        const browserAPI = typeof browser !== 'undefined' ? browser : 
                          (typeof chrome !== 'undefined' ? chrome : null);
        
        if (browserAPI && browserAPI.commands && browserAPI.commands.getAll) {
            const commands = await browserAPI.commands.getAll();
            const copyCommand = commands.find(cmd => cmd.name === 'copy-fancy-link');
            
            if (copyCommand && copyCommand.shortcut) {
                return formatShortcutForDisplay(copyCommand.shortcut);
            }
        }
    } catch (error) {
        console.warn('Could not get keyboard shortcut from commands API:', error);
    }
    
    // Return default if API fails or shortcut not found
    return getDefaultShortcut();
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getOSModifierKey,
        isMacOS,
        formatShortcutForDisplay,
        getDefaultShortcut,
        getCurrentShortcut
    };
}

// Also make available globally for browser extension context
if (typeof globalThis !== 'undefined') {
    globalThis.KeyboardShortcuts = {
        getOSModifierKey,
        isMacOS,
        formatShortcutForDisplay,
        getDefaultShortcut,
        getCurrentShortcut
    };
}