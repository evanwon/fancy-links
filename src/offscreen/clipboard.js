/**
 * Offscreen document for clipboard operations (Chrome MV3)
 * Chrome MV3 service workers cannot access the clipboard directly.
 * This offscreen document provides a DOM context for document.execCommand('copy').
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action !== 'offscreen-clipboard-write') return;

    const textarea = document.createElement('textarea');
    textarea.value = message.text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);

    sendResponse({
        success: success,
        error: success ? undefined : 'Failed to copy to clipboard'
    });
});
