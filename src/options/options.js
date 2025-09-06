// Load format configuration from centralized registry 
// The registry is loaded as a script in the HTML, making FancyLinkFormatRegistry available globally
const formats = globalThis.FancyLinkFormatRegistry.formatConfig;
// Note: getWorksWithText is used directly from globalThis.FancyLinkFormatRegistry.getWorksWithText to avoid redeclaration

// Default settings
const DEFAULT_SETTINGS = {
    defaultFormat: 'markdown',
    showNotifications: false,
    showBadge: true,
    cleanUrls: false,
    debugMode: false,
    includeCurrentPageInBugReports: false
};

// Initialize options page
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    await updateKeyboardShortcutDisplay();
    setupEventListeners();
});

// Update keyboard shortcut display (cross-browser compatible)
async function updateKeyboardShortcutDisplay() {
    const shortcutElement = document.getElementById('currentShortcut');
    if (!shortcutElement) return;
    
    try {
        // Try to get browser API (Firefox primarily, but designed for cross-browser)
        const browserAPI = typeof browser !== 'undefined' ? browser : 
                          (typeof chrome !== 'undefined' ? chrome : null);
        
        if (browserAPI && browserAPI.commands && browserAPI.commands.getAll) {
            const commands = await browserAPI.commands.getAll();
            const copyCommand = commands.find(cmd => cmd.name === 'copy-fancy-link');
            
            if (copyCommand && copyCommand.shortcut) {
                shortcutElement.textContent = copyCommand.shortcut;
                return;
            }
        }
        
        // Fallback to OS-specific default
        const platform = navigator.platform;
        const userAgent = navigator.userAgent;
        const isMac = platform.includes('Mac') || userAgent.includes('Macintosh');
        shortcutElement.textContent = isMac ? 'Cmd+Shift+L' : 'Ctrl+Shift+L';
        
    } catch (error) {
        console.warn('Could not get keyboard shortcut:', error);
        // Fallback to generic display
        shortcutElement.textContent = 'Ctrl+Shift+L (Cmd+Shift+L on Mac)';
    }
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
    // Set checkboxes
    document.getElementById('showNotifications').checked = settings.showNotifications;
    document.getElementById('showBadge').checked = settings.showBadge;
    document.getElementById('cleanUrls').checked = settings.cleanUrls;
    document.getElementById('debugMode').checked = settings.debugMode;
    document.getElementById('includeCurrentPageInBugReports').checked = settings.includeCurrentPageInBugReports;
}

function setupEventListeners() {
    // Save button
    document.getElementById('saveButton').addEventListener('click', saveSettings);
    
    // Reset button
    document.getElementById('resetButton').addEventListener('click', resetSettings);
    
    // Report issue link
    document.getElementById('reportIssueLink').addEventListener('click', handleReportIssue);
    
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
        // Get current default format from storage to preserve it
        const currentSettings = await browser.storage.sync.get({ defaultFormat: DEFAULT_SETTINGS.defaultFormat });
        
        const settings = {
            defaultFormat: currentSettings.defaultFormat, // Preserve existing default format
            showNotifications: document.getElementById('showNotifications').checked,
            showBadge: document.getElementById('showBadge').checked,
            cleanUrls: document.getElementById('cleanUrls').checked,
            debugMode: document.getElementById('debugMode').checked,
            includeCurrentPageInBugReports: document.getElementById('includeCurrentPageInBugReports').checked
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

async function handleReportIssue(event) {
    event.preventDefault();
    
    try {
        // Get current settings to determine if we should include page info
        const settings = await browser.storage.sync.get(['includeCurrentPageInBugReports']);
        const includeCurrentPage = settings.includeCurrentPageInBugReports === true;
        
        // Load diagnostics utility - use chrome API for compatibility
        const diagnostics = await Diagnostics.collectDiagnostics(includeCurrentPage);
        const issueUrl = Diagnostics.generateGitHubIssueUrl(diagnostics);
        
        // Open GitHub Issues in new tab
        browser.tabs.create({ url: issueUrl });
        
    } catch (error) {
        console.error('Error generating issue report:', error);
        showStatus('Error generating issue report', 'error');
    }
}

