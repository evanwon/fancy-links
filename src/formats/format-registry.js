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
        markdown: (text) => text.replace(/[()\\]/g, '\\$&'),
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
        urlParam: (text) => text.replace(/\s+/g, '_').replace(/[&=+#%]/g, encodeURIComponent)
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
            example: '[Title](URL)',
            worksWith: ['Discord', 'Reddit', 'GitHub', 'Notion'],
            format: (title, url) => {
                const displayText = title || url;
                const truncated = truncateText(displayText);
                const sanitized = sanitizers.markdown(truncated);
                return `[${sanitized}](${url})`;
            }
        },

        urlparams: {
            name: 'URL with Title Parameter',
            description: 'URL with title as parameter',
            example: 'URL?_title=Title',
            worksWith: [],
            format: (title, url) => {
                const displayText = title || url;
                const truncated = truncateText(displayText);
                const sanitized = sanitizers.urlParam(truncated);
                const separator = url.includes('?') ? '&' : '?';
                return `${url}${separator}_title=${sanitized}`;
            }
        },
        
        plaintext: {
            name: 'Plain Text',
            description: 'Simple text format',
            example: 'Title - URL',
            worksWith: [],
            format: (title, url) => {
                const displayText = title || url;
                const truncated = truncateText(displayText);
                return `${truncated} - ${url}`;
            }
        },

        html: {
            name: 'HTML',
            description: 'HTML anchor tag',
            example: '<a href="URL">Title</a>',
            worksWith: [],
            format: (title, url) => {
                const displayText = title || url;
                const truncated = truncateText(displayText);
                const sanitized = sanitizers.html(truncated);
                const urlEscaped = sanitizers.html(url);
                return `<a href="${urlEscaped}">${sanitized}</a>`;
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