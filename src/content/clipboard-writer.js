/**
 * Content script for clipboard writing
 * Receives messages from background script and writes to clipboard
 */
(function() {
    'use strict';

    // Prevent duplicate listener registration on repeated injection
    if (window._fancyLinksClipboardWriterLoaded) return;
    window._fancyLinksClipboardWriterLoaded = true;

    // Content scripts don't use full BrowserApi — simple inline fallback
    const api = (typeof browser !== 'undefined') ? browser : chrome;

    api.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action !== 'writeToClipboard') return false;

        navigator.clipboard.writeText(message.text)
            .then(() => sendResponse({ success: true }))
            .catch(() => {
                // Fallback to older clipboard API
                const textarea = document.createElement('textarea');
                textarea.value = message.text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                const success = document.execCommand('copy');
                document.body.removeChild(textarea);

                if (!success) {
                    sendResponse({ success: false, error: 'Failed to copy to clipboard' });
                } else {
                    sendResponse({ success: true });
                }
            });

        return true; // Keep message channel open for async sendResponse
    });
})();
