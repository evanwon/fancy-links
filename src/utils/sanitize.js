/**
 * Common sanitization utilities for format modules
 */

/**
 * Sanitize text for Slack format
 * Removes characters that have special meaning in Slack's mrkdwn:
 * - < and > : Used for links and mentions
 * - | : Used as separator in link format
 * - [ and ] : Can interfere with link parsing
 */
function sanitizeForSlack(text) {
  return text.replace(/[<>|\[\]]/g, '');
}

/**
 * Sanitize text for Markdown/Discord/Reddit formats
 * Escapes characters that have special meaning in Markdown:
 * - [ and ] : Used for link syntax
 * - ( and ) : Used for URL portion of links
 * - \ : Escape character
 */
function sanitizeForMarkdown(text) {
  return text.replace(/[\[\]()\\]/g, '\\$&');
}

/**
 * Sanitize text for HTML
 * Escapes HTML entities to prevent XSS and display issues:
 * - & : Start of HTML entities
 * - < and > : HTML tags
 * - " : Attribute quotes
 * - ' : Alternative attribute quotes
 */
function sanitizeForHtml(text) {
  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, char => htmlEntities[char]);
}

/**
 * Sanitize text for URL parameters
 * Encodes special characters but keeps the result human-readable
 * Only encodes characters that would break URL structure
 */
function sanitizeForUrlParam(text) {
  // First pass: Replace characters that break URLs
  // but keep spaces and common punctuation readable
  return text
    .replace(/[&=#?/\\]/g, encodeURIComponent)  // Encode URL-breaking chars
    .replace(/\s+/g, ' ');  // Normalize whitespace
}

/**
 * Truncate text with ellipsis if it exceeds max length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length (default 500)
 * @returns {string} Truncated text with ... if needed
 */
function truncateText(text, maxLength = 500) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sanitizeForSlack,
    sanitizeForMarkdown,
    sanitizeForHtml,
    sanitizeForUrlParam,
    truncateText
  };
}