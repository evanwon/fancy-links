/**
 * Format a link for Slack using mrkdwn syntax
 * Format: <URL|Title>
 */

const { sanitizeForSlack, truncateText } = require('../utils/sanitize');

function format(title, url) {
  // Use URL as fallback if no title provided
  const displayText = title || url;
  
  // Sanitize and truncate the title for Slack
  const sanitizedTitle = sanitizeForSlack(truncateText(displayText));
  
  // Slack's link format: <URL|display text>
  return `<${url}|${sanitizedTitle}>`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { format };
}