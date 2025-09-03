/**
 * Format a link as Rich Text Format (RTF)
 * Creates a hyperlink that works in Word, Outlook, and other RTF-compatible applications
 * RTF format: {\rtf1{\field{\*\fldinst HYPERLINK "URL"}{\fldrslt Title}}}
 */

const { truncateText } = require('../utils/sanitize');

function format(title, url) {
  // Use URL as fallback if no title provided
  const displayText = title || url;
  
  // RTF uses backslash as escape character, so we need to escape backslashes and braces
  // \ becomes \\
  // { becomes \{
  // } becomes \}
  const rtfEscape = (text) => {
    return text
      .replace(/\\/g, '\\\\')  // Escape backslashes first
      .replace(/\{/g, '\\{')   // Escape opening braces
      .replace(/\}/g, '\\}');  // Escape closing braces
  };
  
  const sanitizedTitle = rtfEscape(truncateText(displayText));
  const sanitizedUrl = rtfEscape(url);
  
  // RTF hyperlink field format
  // This creates a clickable hyperlink when pasted into RTF-compatible apps
  return `{\\rtf1{\\field{\\*\\fldinst HYPERLINK "${sanitizedUrl}"}{\\fldrslt ${sanitizedTitle}}}}`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { format };
}