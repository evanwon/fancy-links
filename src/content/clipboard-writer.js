/**
 * Content script for clipboard writing
 * Receives messages from background script and writes to clipboard
 */
(function() {
    'use strict';

    browser.runtime.onMessage.addListener(async (message) => {
        if (message.action !== 'writeToClipboard') return;

        try {
            await navigator.clipboard.writeText(message.text);
            return { success: true };
        } catch (error) {
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
                return { success: false, error: 'Failed to copy to clipboard' };
            }
            return { success: true };
        }
    });
})();
