/**
 * Browser-compatible format functions
 * This file can be loaded directly in browser extensions without require()
 */

// Sanitization functions (duplicated from sanitize.js for browser compatibility)
function sanitizeForSlack(text) {
    return text.replace(/[<>|[\]]/g, '');
}

function sanitizeForMarkdown(text) {
    return text.replace(/[[\]()\\]/g, '');
}

function sanitizeForHtml(text) {
    return text.replace(/[<>&"']/g, (match) => {
        const entities = {
            '<': '&lt;',
            '>': '&gt;',
            '&': '&amp;',
            '"': '&quot;',
            "'": '&#x27;'
        };
        return entities[match];
    });
}

function sanitizeForUrlParam(text) {
    // Human-readable encoding - only encode essential characters
    return text.replace(/[&=+#%]/g, encodeURIComponent);
}

function truncateText(text, maxLength = 500) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

// Format functions
const formats = {
    slack: {
        format: (title, url) => {
            const displayText = title || url;
            const sanitized = sanitizeForSlack(truncateText(displayText));
            return `<${url}|${sanitized}>`;
        }
    },
    
    
    markdown: {
        format: (title, url) => {
            const displayText = title || url;
            const sanitized = sanitizeForMarkdown(truncateText(displayText));
            return `[${sanitized}](${url})`;
        }
    },
    
    html: {
        format: (title, url) => {
            const displayText = title || url;
            const sanitized = sanitizeForHtml(truncateText(displayText));
            const urlEscaped = sanitizeForHtml(url);
            return `<a href="${urlEscaped}">${sanitized}</a>`;
        }
    },
    
    plaintext: {
        format: (title, url) => {
            const displayText = title || url;
            const sanitized = truncateText(displayText);
            return `${sanitized} - ${url}`;
        }
    },
    
    rtf: {
        format: (title, url) => {
            const displayText = title || url;
            const sanitized = truncateText(displayText).replace(/[\\{}]/g, '\\$&');
            const urlEscaped = url.replace(/[\\{}]/g, '\\$&');
            return `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}} {\\field {\\*\\fldinst HYPERLINK "${urlEscaped}"} {\\fldrslt {\\ul\\cf1 ${sanitized}}}}}`;
        }
    },
    
    urlparams: {
        format: (title, url) => {
            const displayText = title || url;
            const sanitized = sanitizeForUrlParam(truncateText(displayText));
            const separator = url.includes('?') ? '&' : '?';
            return `${url}${separator}_title=${sanitized}`;
        }
    }
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = { formats };
} else {
    // Browser environment - make available globally
    window.FancyLinkFormats = formats;
}