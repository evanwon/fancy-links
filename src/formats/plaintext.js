/**
 * Format a link as plain text
 * Format: Title - URL
 * Simple, universal format that works everywhere
 */

const { truncateText } = require('../utils/sanitize');

function format(title, url) {
  // Use URL as fallback if no title provided
  const displayText = title || url;
  
  // Just truncate, no special sanitization needed for plain text
  const truncatedTitle = truncateText(displayText);
  
  // Simple dash separator between title and URL
  return `${truncatedTitle} - ${url}`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { format };
}