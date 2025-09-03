/**
 * Format a link for Reddit using Markdown syntax
 * Format: [Title](URL)
 * Same as Discord/Markdown but labeled separately for user clarity
 */

const { sanitizeForMarkdown, truncateText } = require('../utils/sanitize');

function format(title, url) {
  // Use URL as fallback if no title provided
  const displayText = title || url;
  
  // Sanitize and truncate the title for Markdown
  const sanitizedTitle = sanitizeForMarkdown(truncateText(displayText));
  
  // Reddit uses standard Markdown link format
  return `[${sanitizedTitle}](${url})`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { format };
}