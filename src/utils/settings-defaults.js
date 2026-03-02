/**
 * Shared settings defaults for the Fancy Links extension
 * Used by both background.js and options.js to ensure consistency
 */
(function() {
    'use strict';

    const DEFAULT_SETTINGS = {
        defaultFormat: 'markdown',
        showNotifications: false,
        showBadge: true,
        cleanUrls: false,
        debugMode: false,
        includeCurrentPageInBugReports: false
    };

    // Global export for browser context
    if (typeof window !== 'undefined') {
        window.FancyLinkSettings = { DEFAULT_SETTINGS };
    }

    // Global export for globalThis (options page)
    if (typeof globalThis !== 'undefined') {
        globalThis.FancyLinkSettings = { DEFAULT_SETTINGS };
    }

    // Node.js export for testing
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { DEFAULT_SETTINGS };
    }
})();
