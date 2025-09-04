/**
 * Centralized format configuration
 * Defines all format metadata, display information, and functions in one place
 * This supports a plugin-like architecture where each format is self-contained
 */

// Sanitization utilities
const sanitizers = {
    slack: (text) => text.replace(/[<>|[\]]/g, ''),
    markdown: (text) => text.replace(/[[\]()\\]/g, ''),
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
    slack: {
        name: 'Slack',
        description: 'Slack-compatible link format',
        example: '<https://example.com|Page Title>',
        worksWith: [], // Slack doesn't need a "works with" list
        format: (title, url) => {
            const displayText = title || url;
            const sanitized = sanitizers.slack(truncateText(displayText));
            return `<${url}|${sanitized}>`;
        }
    },
    
    markdown: {
        name: 'Markdown',
        description: 'Markdown link format',
        example: '[Page Title](https://example.com)',
        worksWith: ['Discord', 'Reddit', 'GitHub', 'Notion'],
        format: (title, url) => {
            const displayText = title || url;
            const sanitized = sanitizers.markdown(truncateText(displayText));
            return `[${sanitized}](${url})`;
        }
    },
    
    html: {
        name: 'HTML',
        description: 'HTML anchor tag',
        example: '<a href="https://example.com">Page Title</a>',
        worksWith: [],
        format: (title, url) => {
            const displayText = title || url;
            const sanitized = sanitizers.html(truncateText(displayText));
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
            const sanitized = truncateText(displayText);
            return `${sanitized} - ${url}`;
        }
    },
    
    rtf: {
        name: 'RTF',
        description: 'Rich Text Format',
        example: 'For Word/Outlook compatibility',
        worksWith: ['Microsoft Word', 'Outlook'],
        format: (title, url) => {
            const displayText = title || url;
            const sanitized = sanitizers.rtf(truncateText(displayText));
            const urlEscaped = sanitizers.rtf(url);
            return `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}} {\\field {\\*\\fldinst HYPERLINK "${urlEscaped}"} {\\fldrslt {\\ul\\cf1 ${sanitized}}}}}`;
        }
    },
    
    urlparams: {
        name: 'URL + Title',
        description: 'URL with title as parameter',
        example: 'https://example.com?_title=Page%20Title',
        worksWith: [],
        format: (title, url) => {
            const displayText = title || url;
            const sanitized = sanitizers.urlParam(truncateText(displayText));
            const separator = url.includes('?') ? '&' : '?';
            return `${url}${separator}_title=${sanitized}`;
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

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        formatConfig,
        getWorksWithText,
        getFormatKeys,
        getFormatConfig
    };
} else {
    // Browser environment - make available globally
    window.FancyLinkFormatConfig = {
        formatConfig,
        getWorksWithText,
        getFormatKeys,
        getFormatConfig
    };
}