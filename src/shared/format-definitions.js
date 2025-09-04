/**
 * Shared format definitions used across the extension
 * This module provides the single source of truth for format configuration
 */

const formatDefinitions = {
    slack: {
        name: 'Slack',
        description: 'Slack-compatible link format',
        example: '<https://example.com|Page Title>',
        worksWith: []
    },
    
    markdown: {
        name: 'Markdown',
        description: 'Markdown link format',
        example: '[Page Title](https://example.com)',
        worksWith: ['Discord', 'Reddit', 'GitHub', 'Notion']
    },
    
    html: {
        name: 'HTML',
        description: 'HTML anchor tag',
        example: '<a href="https://example.com">Page Title</a>',
        worksWith: []
    },
    
    plaintext: {
        name: 'Plain Text',
        description: 'Simple text format',
        example: 'Page Title - https://example.com',
        worksWith: []
    },
    
    rtf: {
        name: 'RTF',
        description: 'Rich Text Format',
        example: 'For Word/Outlook compatibility',
        worksWith: ['Microsoft Word', 'Outlook']
    },
    
    urlparams: {
        name: 'URL + Title',
        description: 'URL with title as parameter',
        example: 'https://example.com?_title=Page%20Title',
        worksWith: []
    }
};

/**
 * Get the "Works with" text for a format
 * @param {string} formatKey - The format key
 * @param {string} prefix - Optional prefix text
 * @returns {string} The formatted "works with" text or empty string
 */
function getWorksWithText(formatKey, prefix = 'Works with: ') {
    const format = formatDefinitions[formatKey];
    if (!format || !format.worksWith || format.worksWith.length === 0) {
        return '';
    }
    return prefix + format.worksWith.join(', ');
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { formatDefinitions, getWorksWithText };
}