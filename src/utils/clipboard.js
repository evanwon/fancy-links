async function copyToClipboard(text, isRichText = false) {
  try {
    if (isRichText) {
      const htmlBlob = new Blob([text], { type: 'text/html' });
      const plainBlob = new Blob([stripHtml(text)], { type: 'text/plain' });
      
      const clipboardItem = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': plainBlob
      });
      
      await navigator.clipboard.write([clipboardItem]);
    } else {
      await navigator.clipboard.writeText(text);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Clipboard operation failed:', error);
    
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (success) {
        return { success: true };
      }
    } catch (fallbackError) {
      console.error('Fallback clipboard operation failed:', fallbackError);
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to copy to clipboard' 
    };
  }
}

function stripHtml(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { copyToClipboard, stripHtml };
}