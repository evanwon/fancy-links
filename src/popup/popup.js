// Format functions - inline implementations for popup
const formats = {
    slack: {
        format: (title, url) => {
            const sanitizedTitle = title.replace(/[<>|\[\]]/g, ' ').trim();
            const truncatedTitle = sanitizedTitle.length > 500 ? sanitizedTitle.substring(0, 497) + '...' : sanitizedTitle;
            return `<${url}|${truncatedTitle}>`;
        }
    },
    markdown: {
        format: (title, url) => {
            const sanitizedTitle = title.replace(/[\[\]()\\]/g, '\\$&');
            const truncatedTitle = sanitizedTitle.length > 500 ? sanitizedTitle.substring(0, 497) + '...' : sanitizedTitle;
            return `[${truncatedTitle}](${url})`;
        }
    },
    html: {
        format: (title, url) => {
            const sanitizedTitle = title.replace(/[&<>"']/g, match => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
            }[match]));
            const truncatedTitle = sanitizedTitle.length > 500 ? sanitizedTitle.substring(0, 497) + '...' : sanitizedTitle;
            return `<a href="${url}">${truncatedTitle}</a>`;
        }
    },
    plaintext: {
        format: (title, url) => {
            const truncatedTitle = title.length > 500 ? title.substring(0, 497) + '...' : title;
            return `${truncatedTitle} - ${url}`;
        }
    },
    rtf: {
        format: (title, url) => {
            const sanitizedTitle = title.replace(/[{}\\]/g, '\\$&');
            const truncatedTitle = sanitizedTitle.length > 500 ? sanitizedTitle.substring(0, 497) + '...' : sanitizedTitle;
            return `{\\rtf1\\ansi\\deff0 {\\field{\\*\\fldinst{HYPERLINK "${url}"}}{\\fldrslt{${truncatedTitle}}}}}`;
        }
    },
    urlparams: {
        format: (title, url) => {
            const separator = url.includes('?') ? '&' : '?';
            const encodedTitle = encodeURIComponent(title.replace(/[^\w\s-]/g, ' ').trim());
            const truncatedTitle = encodedTitle.length > 500 ? encodedTitle.substring(0, 497) + '...' : encodedTitle;
            return `${url}${separator}_title=${truncatedTitle}`;
        }
    }
};

// Current tab info
let currentTab = null;

// Load version from manifest
function loadVersion() {
    try {
        const manifest = browser.runtime.getManifest();
        const versionElement = document.getElementById('version');
        
        if (versionElement) {
            if (manifest && manifest.version) {
                versionElement.textContent = `v${manifest.version}`;
                versionElement.style.display = 'inline';
            } else {
                // Hide the version element if version can't be retrieved
                versionElement.style.display = 'none';
            }
        }
    } catch (error) {
        console.warn('Could not load version from manifest:', error);
        // Hide version element on error
        const versionElement = document.getElementById('version');
        if (versionElement) {
            versionElement.style.display = 'none';
        }
    }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    await loadCurrentTab();
    await updatePreviews();
    loadVersion();
    setupEventListeners();
});

async function loadCurrentTab() {
    try {
        // Get current active tab
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        currentTab = tabs[0];
        
        // Update UI with tab info
        const pageTitle = document.getElementById('pageTitle');
        const pageUrl = document.getElementById('pageUrl');
        
        if (currentTab) {
            pageTitle.textContent = currentTab.title || 'Untitled Page';
            pageUrl.textContent = currentTab.url || '';
        } else {
            pageTitle.textContent = 'No active tab';
            pageUrl.textContent = '';
        }
    } catch (error) {
        console.error('Error loading current tab:', error);
        showNotification('Error loading page info', 'error');
    }
}

async function updatePreviews() {
    if (!currentTab) return;
    
    const title = currentTab.title || 'Untitled Page';
    const url = currentTab.url || '';
    
    // Update each format preview
    Object.keys(formats).forEach(formatKey => {
        const previewElement = document.getElementById(`preview-${formatKey}`);
        if (previewElement && formats[formatKey]) {
            try {
                const formatted = formats[formatKey].format(title, url);
                previewElement.textContent = formatted;
            } catch (error) {
                console.error(`Error formatting ${formatKey}:`, error);
                previewElement.textContent = 'Format error';
            }
        }
    });
}

function setupEventListeners() {
    // Format button clicks
    document.querySelectorAll('.format-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const format = button.getAttribute('data-format');
            await copyWithFormat(format);
        });
    });
    
    // Options button
    document.getElementById('optionsBtn').addEventListener('click', () => {
        browser.runtime.openOptionsPage();
        window.close();
    });
}

async function copyWithFormat(formatKey) {
    if (!currentTab || !formats[formatKey]) {
        showNotification('Error: Invalid format or tab', 'error');
        return;
    }
    
    try {
        const title = currentTab.title || 'Untitled Page';
        const url = currentTab.url || '';
        const formatted = formats[formatKey].format(title, url);
        
        // Copy to clipboard using content script injection
        await browser.tabs.executeScript(currentTab.id, {
            code: `
                navigator.clipboard.writeText(${JSON.stringify(formatted)})
                .then(() => {
                    // Send success message back
                    browser.runtime.sendMessage({
                        type: 'copySuccess',
                        format: '${formatKey}'
                    });
                })
                .catch(error => {
                    // Send error message back
                    browser.runtime.sendMessage({
                        type: 'copyError',
                        error: error.message
                    });
                });
            `
        });
        
        // Listen for response from content script
        const handleMessage = (message) => {
            if (message.type === 'copySuccess') {
                showNotification(`Copied as ${formatKey}!`, 'success');
                browser.runtime.onMessage.removeListener(handleMessage);
            } else if (message.type === 'copyError') {
                showNotification(`Copy failed: ${message.error}`, 'error');
                browser.runtime.onMessage.removeListener(handleMessage);
            }
        };
        
        browser.runtime.onMessage.addListener(handleMessage);
        
        // Fallback timeout
        setTimeout(() => {
            browser.runtime.onMessage.removeListener(handleMessage);
        }, 3000);
        
    } catch (error) {
        console.error('Copy error:', error);
        showNotification('Copy failed', 'error');
    }
}

// Track notification timeout to prevent conflicts
let notificationTimeout = null;

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    
    // Clear any existing timeout
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
    }
    
    // Remove existing classes and add new ones
    notification.classList.remove('show');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    // Force reflow to ensure the class removal takes effect
    notification.offsetHeight;
    
    // Show the notification
    notification.classList.add('show');
    
    // Set new timeout
    notificationTimeout = setTimeout(() => {
        notification.classList.remove('show');
        notificationTimeout = null;
    }, 2000);
}