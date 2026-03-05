/**
 * Browser API abstraction layer for cross-browser compatibility
 * Provides a unified interface for browser extension APIs across Firefox (MV2) and Chrome (MV3)
 */

(function() {
    'use strict';

    /**
     * Get the browser extension API object
     * @returns {Object|null} browser (Firefox) or chrome (Chrome) or null
     */
    function getApi() {
        if (typeof browser !== 'undefined') {
            return browser;
        }
        if (typeof chrome !== 'undefined') {
            return chrome;
        }
        return null;
    }

    /**
     * Get the manifest version number
     * @returns {number} Manifest version (2 or 3)
     */
    function getManifestVersion() {
        const api = getApi();
        if (!api) return 2;
        return api.runtime.getManifest().manifest_version;
    }

    /**
     * Get the correct action API (browserAction for MV2, action for MV3)
     * @returns {Object|null} The action API object
     */
    function getAction() {
        const api = getApi();
        if (!api) return null;
        if (getManifestVersion() >= 3 && api.action) {
            return api.action;
        }
        return api.browserAction || null;
    }

    /**
     * Set badge text on the toolbar button
     * @param {Object} details - Badge text details (e.g., { text: '✓' })
     * @returns {Promise}
     */
    function setBadgeText(details) {
        const action = getAction();
        if (!action) return Promise.resolve();
        return action.setBadgeText(details);
    }

    /**
     * Set badge background color on the toolbar button
     * @param {Object} details - Badge color details (e.g., { color: '#4CAF50' })
     * @returns {Promise}
     */
    function setBadgeBackgroundColor(details) {
        const action = getAction();
        if (!action) return Promise.resolve();
        return action.setBadgeBackgroundColor(details);
    }

    /**
     * Register a toolbar button click listener
     * @param {Function} callback - Click handler
     */
    function onActionClicked(callback) {
        const action = getAction();
        if (action && action.onClicked) {
            action.onClicked.addListener(callback);
        }
    }

    /**
     * Execute a content script in a tab
     * MV2: tabs.executeScript, MV3: scripting.executeScript
     * @param {number} tabId - Tab ID
     * @param {string} file - Script file path
     * @returns {Promise}
     */
    function executeContentScript(tabId, file) {
        const api = getApi();
        if (!api) return Promise.resolve();

        if (getManifestVersion() >= 3 && api.scripting) {
            return api.scripting.executeScript({
                target: { tabId: tabId },
                files: [file]
            });
        }
        return api.tabs.executeScript(tabId, { file: file });
    }

    /**
     * Get the browser name
     * @returns {string} 'firefox', 'chrome', or 'unknown'
     */
    function getBrowserName() {
        if (typeof browser !== 'undefined') {
            return 'firefox';
        }
        if (typeof chrome !== 'undefined') {
            return 'chrome';
        }
        return 'unknown';
    }

    /**
     * Copy text to clipboard using the appropriate method for the browser/manifest version
     * MV2: Injects content script into the tab
     * MV3: Uses an offscreen document (content scripts lack user gesture context)
     * @param {number} tabId - Tab ID (used only for MV2)
     * @param {string} text - Text to copy
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async function copyToClipboard(tabId, text) {
        if (getManifestVersion() >= 3) {
            const api = getApi();
            // Ensure offscreen document exists
            try {
                await api.offscreen.createDocument({
                    url: 'offscreen/clipboard.html',
                    reasons: ['CLIPBOARD'],
                    justification: 'Write formatted link to clipboard'
                });
            } catch (e) {
                // Document already exists — expected on subsequent calls
            }
            // Fire-and-forget pattern (matches Chrome's official offscreen sample)
            await api.runtime.sendMessage({
                action: 'offscreen-clipboard-write',
                text: text
            });
            return { success: true };
        }
        // MV2: use content script
        await executeContentScript(tabId, '/content/clipboard-writer.js');
        return getApi().tabs.sendMessage(tabId, {
            action: 'writeToClipboard',
            text: text
        });
    }

    const BrowserApi = {
        getApi,
        getManifestVersion,
        getAction,
        setBadgeText,
        setBadgeBackgroundColor,
        onActionClicked,
        executeContentScript,
        copyToClipboard,
        getBrowserName
    };

    // Node.js export for testing (CommonJS compatibility)
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = BrowserApi;
    }

    // Global export for service worker context (no window)
    if (typeof globalThis !== 'undefined') {
        globalThis.BrowserApi = BrowserApi;
    }

    // Global export for browser window context
    if (typeof window !== 'undefined') {
        window.BrowserApi = BrowserApi;
    }
})();
