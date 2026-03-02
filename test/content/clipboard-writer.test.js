/**
 * Tests for clipboard-writer content script
 */

describe('Clipboard Writer Content Script', () => {
    let messageHandler;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();

        // Clear idempotency guard
        delete window._fancyLinksClipboardWriterLoaded;

        // Mock browser.runtime.onMessage
        global.browser = {
            runtime: {
                onMessage: {
                    addListener: jest.fn()
                }
            }
        };

        // Load the content script
        require('../../src/content/clipboard-writer.js');

        // Get the registered message handler
        messageHandler = browser.runtime.onMessage.addListener.mock.calls[0][0];
    });

    test('should register a message listener on load', () => {
        expect(browser.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
        expect(typeof messageHandler).toBe('function');
    });

    test('should ignore non-writeToClipboard messages', async () => {
        const result = await messageHandler({ action: 'other' });
        expect(result).toBeUndefined();
    });

    test('should write to clipboard using navigator.clipboard API', async () => {
        navigator.clipboard.writeText.mockResolvedValue();

        const result = await messageHandler({
            action: 'writeToClipboard',
            text: 'test text'
        });

        expect(result).toEqual({ success: true });
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text');
    });

    test('should fall back to execCommand when clipboard API fails', async () => {
        navigator.clipboard.writeText.mockRejectedValue(new Error('Not allowed'));

        // Mock DOM methods for fallback
        const mockTextarea = {
            value: '',
            style: {},
            select: jest.fn()
        };
        document.createElement = jest.fn(() => mockTextarea);
        document.body.appendChild = jest.fn();
        document.body.removeChild = jest.fn();
        document.execCommand = jest.fn(() => true);

        const result = await messageHandler({
            action: 'writeToClipboard',
            text: 'fallback text'
        });

        expect(result).toEqual({ success: true });
        expect(document.execCommand).toHaveBeenCalledWith('copy');
        expect(mockTextarea.value).toBe('fallback text');
        expect(mockTextarea.style.position).toBe('fixed');
        expect(mockTextarea.style.opacity).toBe('0');
        expect(mockTextarea.select).toHaveBeenCalled();
        expect(document.body.appendChild).toHaveBeenCalledWith(mockTextarea);
        expect(document.body.removeChild).toHaveBeenCalledWith(mockTextarea);
    });

    test('should not register duplicate listeners on repeated injection', () => {
        // Script was already loaded in beforeEach; load it again
        require('../../src/content/clipboard-writer.js');

        // Should still only have one listener registered
        expect(browser.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
    });

    test('should return failure when both clipboard methods fail', async () => {
        navigator.clipboard.writeText.mockRejectedValue(new Error('Not allowed'));

        const mockTextarea = {
            value: '',
            style: {},
            select: jest.fn()
        };
        document.createElement = jest.fn(() => mockTextarea);
        document.body.appendChild = jest.fn();
        document.body.removeChild = jest.fn();
        document.execCommand = jest.fn(() => false);

        const result = await messageHandler({
            action: 'writeToClipboard',
            text: 'fail text'
        });

        expect(result).toEqual({ success: false, error: 'Failed to copy to clipboard' });
    });
});
