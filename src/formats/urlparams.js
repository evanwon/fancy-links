/**
 * Format a link with title as a URL parameter
 * Format: URL?_title=Title (or URL&_title=Title if URL already has parameters)
 * Uses _title as parameter name to avoid collisions with existing parameters
 */

const { sanitizeForUrlParam, truncateText } = require('../utils/sanitize');

function format(title, url) {
  // Use URL as fallback if no title provided
  const displayText = title || url;
  
  // Sanitize title for use as URL parameter
  // We bias towards readability, so spaces stay as spaces
  const paramValue = sanitizeForUrlParam(truncateText(displayText));
  
  // Check if URL already has query parameters
  // If it has '?', append with '&', otherwise start with '?'
  const separator = url.includes('?') ? '&' : '?';
  
  // Use _title as parameter name to avoid collisions
  return `${url}${separator}_title=${paramValue}`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { format };
}