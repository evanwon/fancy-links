/**
 * Tests for offscreen clipboard document (Chrome MV3)
 */

describe('Offscreen Clipboard', () => {
    let messageHandler;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();

        // Mock Chrome runtime API
        global.chrome = {
            runtime: {
                onMessage: {
                    addListener: jest.fn()
                }
            }
        };

        // Mock DOM elements
        const mockTextarea = {
            value: '',
            select: jest.fn()
        };
        document.getElementById = jest.fn(() => mockTextarea);
        document.execCommand = jest.fn(() => true);

        // Load the offscreen script
        require('../../src/offscreen/clipboard.js');

        messageHandler = chrome.runtime.onMessage.addListener.mock.calls[0][0];
    });

    test('should register a message listener', () => {
        expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
        expect(typeof messageHandler).toBe('function');
    });

    test('should copy text to clipboard via execCommand', () => {
        const textarea = document.getElementById('text');

        messageHandler({ action: 'offscreen-clipboard-write', text: 'hello world' });

        expect(textarea.value).toBe('hello world');
        expect(textarea.select).toHaveBeenCalled();
        expect(document.execCommand).toHaveBeenCalledWith('copy');
    });

    test('should ignore non-clipboard messages', () => {
        const textarea = document.getElementById('text');
        textarea.value = '';

        messageHandler({ action: 'other-action', text: 'ignored' });

        expect(textarea.select).not.toHaveBeenCalled();
        expect(document.execCommand).not.toHaveBeenCalled();
    });
});
