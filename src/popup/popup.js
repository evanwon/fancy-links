// Centralized format configuration
const formatConfig = {
    slack: {
        name: 'Slack',
        description: 'Slack-compatible link format',
        example: '<https://example.com|Page Title>',
        worksWith: [],
        format: (title, url) => {
            const sanitizedTitle = title.replace(/[<>|\[\]]/g, ' ').trim();
            const truncatedTitle = sanitizedTitle.length > 500 ? sanitizedTitle.substring(0, 497) + '...' : sanitizedTitle;
            return `<${url}|${truncatedTitle}>`;
        }
    },
    
    markdown: {
        name: 'Markdown',
        description: 'Markdown link format',
        example: '[Page Title](https://example.com)',
        worksWith: ['Discord', 'Reddit', 'GitHub', 'Notion'],
        format: (title, url) => {
            const sanitizedTitle = title.replace(/[\[\]()\\]/g, '\\$&');
            const truncatedTitle = sanitizedTitle.length > 500 ? sanitizedTitle.substring(0, 497) + '...' : sanitizedTitle;
            return `[${truncatedTitle}](${url})`;
        }
    },
    
    html: {
        name: 'HTML',
        description: 'HTML anchor tag',
        example: '<a href="https://example.com">Page Title</a>',
        worksWith: [],
        format: (title, url) => {
            const sanitizedTitle = title.replace(/[&<>"']/g, match => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
            }[match]));
            const truncatedTitle = sanitizedTitle.length > 500 ? sanitizedTitle.substring(0, 497) + '...' : sanitizedTitle;
            return `<a href="${url}">${truncatedTitle}</a>`;
        }
    },
    
    plaintext: {
        name: 'Plain Text',
        description: 'Simple text format',
        example: 'Page Title - https://example.com',
        worksWith: [],
        format: (title, url) => {
            const truncatedTitle = title.length > 500 ? title.substring(0, 497) + '...' : title;
            return `${truncatedTitle} - ${url}`;
        }
    },
    
    rtf: {
        name: 'RTF',
        description: 'Rich Text Format',
        example: 'For Word/Outlook compatibility',
        worksWith: ['Microsoft Word', 'Outlook'],
        format: (title, url) => {
            const sanitizedTitle = title.replace(/[{}\\]/g, '\\$&');
            const truncatedTitle = sanitizedTitle.length > 500 ? sanitizedTitle.substring(0, 497) + '...' : sanitizedTitle;
            return `{\\rtf1\\ansi\\deff0 {\\field{\\*\\fldinst{HYPERLINK "${url}"}}{\\fldrslt{${truncatedTitle}}}}}`;
        }
    },
    
    urlparams: {
        name: 'URL + Title',
        description: 'URL with title as parameter',
        example: 'https://example.com?_title=Page%20Title',
        worksWith: [],
        format: (title, url) => {
            const separator = url.includes('?') ? '&' : '?';
            const encodedTitle = encodeURIComponent(title.replace(/[^\w\s-]/g, ' ').trim());
            const truncatedTitle = encodedTitle.length > 500 ? encodedTitle.substring(0, 497) + '...' : encodedTitle;
            return `${url}${separator}_title=${truncatedTitle}`;
        }
    }
};

const formats = formatConfig;

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

/**
 * Generate format buttons dynamically from the format configuration
 */
function generateFormatButtons() {
    const container = document.getElementById('formatButtons');
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Generate buttons for each format
    Object.keys(formats).forEach(formatKey => {
        const config = formats[formatKey];
        if (!config) return;
        
        const button = document.createElement('button');
        button.className = 'format-btn';
        button.setAttribute('data-format', formatKey);
        
        // Header with name and default label
        const header = document.createElement('div');
        header.className = 'format-header';
        
        const name = document.createElement('span');
        name.className = 'format-name';
        name.textContent = config.name;
        header.appendChild(name);
        
        const defaultLabel = document.createElement('span');
        defaultLabel.className = 'default-label';
        defaultLabel.textContent = 'Default';
        header.appendChild(defaultLabel);
        
        button.appendChild(header);
        
        // Add "works with" text if applicable
        if (config.worksWith && config.worksWith.length > 0) {
            const worksWithSpan = document.createElement('span');
            worksWithSpan.className = 'format-apps';
            worksWithSpan.textContent = config.worksWith.join(', ');
            button.appendChild(worksWithSpan);
        }
        
        // Preview area
        const preview = document.createElement('span');
        preview.className = 'format-preview';
        preview.id = `preview-${formatKey}`;
        preview.textContent = 'Loading...';
        button.appendChild(preview);
        
        container.appendChild(button);
    });
}

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    generateFormatButtons();
    await loadCurrentTab();
    await updatePreviews();
    await updateDefaultIndicator();
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
    let url = currentTab.url || '';
    
    // Get settings to check if URL cleaning is enabled
    try {
        const settings = await browser.storage.sync.get({
            defaultFormat: 'markdown',
            cleanUrls: false
        });
        
        // Clean URL for preview if setting is enabled
        if (settings.cleanUrls) {
            // Send message to background script to clean the URL
            try {
                const cleanResult = await browser.runtime.sendMessage({
                    action: 'cleanUrl',
                    url: url
                });
                if (cleanResult && cleanResult.cleanedUrl) {
                    url = cleanResult.cleanedUrl;
                }
            } catch (error) {
                console.warn('Could not clean URL for preview:', error);
                // Continue with original URL if cleaning fails
            }
        }
    } catch (error) {
        console.warn('Could not get settings for preview:', error);
        // Continue with defaults if settings can't be loaded
    }
    
    // Update each format preview
    Object.keys(formats).forEach(formatKey => {
        const previewElement = document.getElementById(`preview-${formatKey}`);
        const config = formats[formatKey];
        if (previewElement && config && config.format) {
            try {
                const formatted = config.format(title, url);
                previewElement.textContent = formatted;
            } catch (error) {
                console.error(`Error formatting ${formatKey}:`, error);
                previewElement.textContent = 'Format error';
            }
        }
    });
}

function setupEventListeners() {
    // Format button clicks - use event delegation since buttons are dynamically created
    document.getElementById('formatButtons').addEventListener('click', async (e) => {
        const button = e.target.closest('.format-btn');
        if (button) {
            const format = button.getAttribute('data-format');
            await copyWithFormat(format);
        }
    });
    
    // Header settings button
    document.getElementById('headerOptionsBtn').addEventListener('click', () => {
        browser.runtime.openOptionsPage();
        window.close();
    });
}

async function copyWithFormat(formatKey) {
    const config = formats[formatKey];
    if (!currentTab || !config || !config.format) {
        showNotification('Error: Invalid format or tab', 'error');
        return;
    }
    
    try {
        // Use the background script's copyLink function which handles settings like cleanUrls
        const result = await browser.runtime.sendMessage({
            action: 'copyLink',
            format: formatKey
        });
        
        if (result && result.success) {
            showNotification(`Copied as ${config.name}!`, 'success');
        } else {
            showNotification(`Copy failed: ${result ? result.error : 'Unknown error'}`, 'error');
        }
        
    } catch (error) {
        console.error('Copy error:', error);
        showNotification('Copy failed', 'error');
    }
}

async function updateDefaultIndicator() {
    try {
        // Get the default format setting
        const settings = await browser.storage.sync.get({
            defaultFormat: 'markdown'
        });
        
        const defaultFormat = settings.defaultFormat;
        
        // Remove default class from all format buttons first
        document.querySelectorAll('.format-btn').forEach(button => {
            button.classList.remove('default');
        });
        
        // Add default class to the current default format button
        const defaultButton = document.querySelector(`.format-btn[data-format="${defaultFormat}"]`);
        if (defaultButton) {
            defaultButton.classList.add('default');
        }
    } catch (error) {
        console.warn('Could not load default format setting:', error);
        // Fallback to showing markdown as default if settings can't be loaded
        const markdownButton = document.querySelector('.format-btn[data-format="markdown"]');
        if (markdownButton) {
            markdownButton.classList.add('default');
        }
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