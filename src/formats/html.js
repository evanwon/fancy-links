/**
 * Format a link as HTML anchor tag
 * Format: <a href="URL">Title</a>
 */

const { sanitizeForHtml, truncateText } = require('../utils/sanitize');

function format(title, url) {
  // Use URL as fallback if no title provided
  const displayText = title || url;
  
  // Sanitize the title to prevent XSS and HTML injection
  const sanitizedTitle = sanitizeForHtml(truncateText(displayText));
  
  // Sanitize URL for HTML attribute (quotes)
  const sanitizedUrl = sanitizeForHtml(url);
  
  // Standard HTML anchor tag
  return `<a href="${sanitizedUrl}">${sanitizedTitle}</a>`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { format };
}