/**
 * Centralized format configuration - Universal module
 * Defines all format metadata, display information, and functions in one place
 * This supports a plugin-like architecture where each format is self-contained
 * 
 * Supports: ES6 modules (popup/options), CommonJS (tests), and global (background)
 */

(function() {
    'use strict';
    
    // Sanitization utilities
    const sanitizers = {
        slack: (text) => text.replace(/[<>|[\]]/g, ''),
        markdown: (text) => text.replace(/[[\]()\\]/g, '\\$&'),
        html: (text) => text.replace(/[<>&"']/g, (match) => {
            const entities = {
                '<': '&lt;',
                '>': '&gt;',
                '&': '&amp;',
                '"': '&quot;',
                "'": '&#x27;'
            };
            return entities[match];
        }),
        urlParam: (text) => text.replace(/[&=+#%]/g, encodeURIComponent),
        rtf: (text) => text.replace(/[\\{}]/g, '\\$&')
    };

    const truncateText = (text, maxLength = 500) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    };

    /**
     * Format configuration registry
     * Each format is a self-contained plugin with all necessary metadata
     */
    const formatConfig = {
        markdown: {
            name: 'Markdown',
            description: 'Markdown link format',
            example: '[Page Title](https://example.com)',
            worksWith: ['Discord', 'Reddit', 'GitHub', 'Notion'],
            format: (title, url) => {
                const displayText = title || url;
                const truncated = truncateText(displayText);
                const sanitized = sanitizers.markdown(truncated);
                return `[${sanitized}](${url})`;
            }
        },

        slack: {
            name: 'Slack',
            description: 'Slack-compatible link format',
            example: '<https://example.com|Page Title>',
            worksWith: [], // Slack doesn't need a "works with" list
            format: (title, url) => {
                const displayText = title || url;
                const truncated = truncateText(displayText);
                const sanitized = sanitizers.slack(truncated);
                return `<${url}|${sanitized}>`;
            }
        },
        
        html: {
            name: 'HTML',
            description: 'HTML anchor tag',
            example: '<a href="https://example.com">Page Title</a>',
            worksWith: [],
            format: (title, url) => {
                const displayText = title || url;
                const truncated = truncateText(displayText);
                const sanitized = sanitizers.html(truncated);
                const urlEscaped = sanitizers.html(url);
                return `<a href="${urlEscaped}">${sanitized}</a>`;
            }
        },
        
        plaintext: {
            name: 'Plain Text',
            description: 'Simple text format',
            example: 'Page Title - https://example.com',
            worksWith: [],
            format: (title, url) => {
                const displayText = title || url;
                const truncated = truncateText(displayText);
                return `${truncated} - ${url}`;
            }
        },
        
        urlparams: {
            name: 'URL + Title',
            description: 'URL with title as parameter',
            example: 'https://example.com?_title=Page%20Title',
            worksWith: [],
            format: (title, url) => {
                const displayText = title || url;
                const truncated = truncateText(displayText);
                const sanitized = sanitizers.urlParam(truncated);
                const separator = url.includes('?') ? '&' : '?';
                return `${url}${separator}_title=${sanitized}`;
            }
        },

        rtf: {
            name: 'RTF',
            description: 'Rich Text Format',
            example: '{\\\\rtf1\\\\ansi\\\\deff0 {\\\\fonttbl {\\\\f0 Times New Roman;}} {\\\\field {\\\\*\\\\fldinst HYPERLINK "https://example.com"} {\\\\fldrslt {\\\\ul\\\\cf1 Page Title}}}}',
            worksWith: ['Microsoft Word', 'Outlook'],
            format: (title, url) => {
                const displayText = title || url;
                const truncated = truncateText(displayText);
                const sanitized = sanitizers.rtf(truncated);
                const urlEscaped = sanitizers.rtf(url);
                return `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}} {\\field {\\*\\fldinst HYPERLINK "${urlEscaped}"} {\\fldrslt {\\ul\\cf1 ${sanitized}}}}}`;
            }
        }
    };

    /**
     * Helper function to get "Works with" text for a format
     * @param {string} formatKey - The format key (e.g., 'markdown')
     * @param {string} prefix - Optional prefix (e.g., 'Works with: ')
     * @returns {string} The formatted "works with" text or empty string
     */
    function getWorksWithText(formatKey, prefix = '') {
        const config = formatConfig[formatKey];
        if (!config || !config.worksWith || config.worksWith.length === 0) {
            return '';
        }
        return prefix + config.worksWith.join(', ');
    }

    /**
     * Get all format keys
     * @returns {string[]} Array of format keys
     */
    function getFormatKeys() {
        return Object.keys(formatConfig);
    }

    /**
     * Get format configuration
     * @param {string} formatKey - The format key
     * @returns {Object|null} Format configuration or null if not found
     */
    function getFormatConfig(formatKey) {
        return formatConfig[formatKey] || null;
    }

    // Export object
    const registry = {
        formatConfig,
        getWorksWithText,
        getFormatKeys,
        getFormatConfig,
        formats: formatConfig
    };

    // Global export for background script (non-module context)
    if (typeof window !== 'undefined') {
        window.FancyLinkFormatConfig = registry;
        
        // Also make it available on globalThis for module access
        if (typeof globalThis !== 'undefined') {
            globalThis.FancyLinkFormatRegistry = registry;
        }
    }

    // Node.js export for testing (CommonJS compatibility)
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = registry;
    }

})();