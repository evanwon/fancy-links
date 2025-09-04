// Centralized format configuration (matching popup.js)
const formatConfig = {
    slack: {
        name: 'Slack',
        description: 'Slack-compatible link format',
        example: '<https://example.com|Page Title>',
        worksWith: []
    },
    markdown: {
        name: 'Markdown', 
        description: 'Markdown link format',
        example: '[Page Title](https://example.com)',
        worksWith: ['Discord', 'Reddit', 'GitHub', 'Notion']
    },
    html: {
        name: 'HTML',
        description: 'HTML anchor tag',
        example: '<a href="https://example.com">Page Title</a>',
        worksWith: []
    },
    plaintext: {
        name: 'Plain Text',
        description: 'Simple text format',
        example: 'Page Title - https://example.com',
        worksWith: []
    },
    rtf: {
        name: 'RTF (Rich Text)',
        description: 'Rich Text Format',
        example: 'For Word/Outlook compatibility',
        worksWith: []
    },
    urlparams: {
        name: 'URL + Title Parameter',
        description: 'URL with title as parameter',
        example: 'https://example.com?_title=Page%20Title',
        worksWith: []
    }
};

const formats = formatConfig;

// Default settings
const DEFAULT_SETTINGS = {
    defaultFormat: 'markdown',
    showNotifications: false,
    showBadge: true,
    cleanUrls: false,
    debugMode: false
};

// Initialize options page
document.addEventListener('DOMContentLoaded', async () => {
    generateFormatOptions();
    await loadSettings();
    setupEventListeners();
});

/**
 * Generate format options dynamically from the format configuration
 */
function generateFormatOptions() {
    const container = document.getElementById('formatOptions');
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Generate radio options for each format
    Object.keys(formats).forEach(formatKey => {
        const config = formats[formatKey];
        if (!config) return;
        
        const label = document.createElement('label');
        label.className = 'format-option';
        
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'defaultFormat';
        input.value = formatKey;
        label.appendChild(input);
        
        const formatInfo = document.createElement('div');
        formatInfo.className = 'format-info';
        
        const name = document.createElement('span');
        name.className = 'format-name';
        name.textContent = config.name;
        formatInfo.appendChild(name);
        
        const example = document.createElement('span');
        example.className = 'format-example';
        example.textContent = config.example;
        formatInfo.appendChild(example);
        
        // Add "works with" text if applicable
        if (config.worksWith && config.worksWith.length > 0) {
            const worksWithSpan = document.createElement('span');
            worksWithSpan.className = 'format-apps';
            worksWithSpan.textContent = 'Works with: ' + config.worksWith.join(', ');
            formatInfo.appendChild(worksWithSpan);
        }
        
        label.appendChild(formatInfo);
        container.appendChild(label);
    });
}

async function loadSettings() {
    try {
        // Check if browser and storage APIs are available
        if (typeof browser === 'undefined') {
            throw new Error('Browser API not available');
        }
        
        if (!browser.storage || !browser.storage.sync) {
            throw new Error('Storage API not available');
        }
        
        // Load settings from browser storage
        const result = await browser.storage.sync.get(DEFAULT_SETTINGS);
        const settings = { ...DEFAULT_SETTINGS, ...result };
        
        console.log('Settings loaded successfully:', settings);
        
        // Update UI with loaded settings
        updateUI(settings);
        
    } catch (error) {
        console.error('Error loading settings:', error);
        showStatus(`Error loading settings: ${error.message}`, 'error');
        
        // Fall back to defaults
        updateUI(DEFAULT_SETTINGS);
    }
}

function updateUI(settings) {
    // Set default format radio button
    const formatRadio = document.querySelector(`input[name="defaultFormat"][value="${settings.defaultFormat}"]`);
    if (formatRadio) {
        formatRadio.checked = true;
    }
    
    // Set checkboxes
    document.getElementById('showNotifications').checked = settings.showNotifications;
    document.getElementById('showBadge').checked = settings.showBadge;
    document.getElementById('cleanUrls').checked = settings.cleanUrls;
    document.getElementById('debugMode').checked = settings.debugMode;
}

function setupEventListeners() {
    // Save button
    document.getElementById('saveButton').addEventListener('click', saveSettings);
    
    // Reset button
    document.getElementById('resetButton').addEventListener('click', resetSettings);
    
    // Auto-save on change
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', () => {
            // Clear any existing status message
            showStatus('');
        });
    });
}

async function saveSettings() {
    try {
        const settings = {
            defaultFormat: document.querySelector('input[name="defaultFormat"]:checked')?.value || DEFAULT_SETTINGS.defaultFormat,
            showNotifications: document.getElementById('showNotifications').checked,
            showBadge: document.getElementById('showBadge').checked,
            cleanUrls: document.getElementById('cleanUrls').checked,
            debugMode: document.getElementById('debugMode').checked
        };
        
        // Save to browser storage
        await browser.storage.sync.set(settings);
        
        showStatus('Settings saved successfully!', 'success');
        
        // Clear status after 3 seconds
        setTimeout(() => {
            showStatus('');
        }, 3000);
        
    } catch (error) {
        console.error('Error saving settings:', error);
        showStatus('Error saving settings', 'error');
    }
}

async function resetSettings() {
    try {
        // Clear stored settings
        await browser.storage.sync.clear();
        
        // Update UI with defaults
        updateUI(DEFAULT_SETTINGS);
        
        showStatus('Settings reset to defaults', 'success');
        
        // Clear status after 3 seconds
        setTimeout(() => {
            showStatus('');
        }, 3000);
        
    } catch (error) {
        console.error('Error resetting settings:', error);
        showStatus('Error resetting settings', 'error');
    }
}

function showStatus(message, type = '') {
    const statusElement = document.getElementById('statusMessage');
    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
}