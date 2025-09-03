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
    await loadSettings();
    setupEventListeners();
});

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