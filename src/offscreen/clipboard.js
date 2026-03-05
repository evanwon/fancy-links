/**
 * Offscreen document for clipboard operations (Chrome MV3)
 * Chrome MV3 service workers cannot access the clipboard directly.
 * This offscreen document provides a DOM context for clipboard writes.
 *
 * Pattern matches Chrome's official offscreen clipboard sample:
 * - Uses pre-existing textarea + execCommand (not navigator.clipboard)
 * - Fire-and-forget (no sendResponse)
 */
chrome.runtime.onMessage.addListener((message) => {
    if (message.action !== 'offscreen-clipboard-write') return;

    const textarea = document.getElementById('text');
    textarea.value = message.text;
    textarea.select();
    document.execCommand('copy');
});
