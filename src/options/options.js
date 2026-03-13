// Load format configuration from centralized registry
// The registry is loaded as a script in the HTML, making FancyLinkFormatRegistry available globally
const formats = globalThis.FancyLinkFormatRegistry.formatConfig;
// Note: getWorksWithText is used directly from globalThis.FancyLinkFormatRegistry.getWorksWithText to avoid redeclaration
// Note: FancyLinkSettings is available from settings-defaults.js

// Initialize options page
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    await updateKeyboardShortcutDisplay();
    updateShortcutHelpForBrowser();
    setupEventListeners();
});

// Update shortcut help text for Chrome users with a clickable link
function updateShortcutHelpForBrowser() {
    if (BrowserApi.getBrowserName() === 'chrome') {
        const shortcutHelp = document.querySelector('.shortcut-help p');
        if (shortcutHelp) {
            shortcutHelp.textContent = 'Go to ';
            const link = document.createElement('a');
            link.href = '#';
            link.textContent = 'chrome://extensions/shortcuts';
            link.addEventListener('click', (e) => {
                e.preventDefault();
                BrowserApi.getApi().tabs.create({ url: 'chrome://extensions/shortcuts' });
            });
            shortcutHelp.appendChild(link);
            shortcutHelp.appendChild(document.createTextNode(' to customize your shortcut.'));
        }
    }
}

// Update keyboard shortcut display
async function updateKeyboardShortcutDisplay() {
    const shortcutElement = document.getElementById('currentShortcut');
    if (!shortcutElement) return;
    
    try {
        // Use the centralized utility to get the current shortcut
        const shortcut = await KeyboardShortcuts.getCurrentShortcut();
        shortcutElement.textContent = shortcut;
    } catch (error) {
        console.warn('Could not get keyboard shortcut:', error);
        // Fallback to generic display
        shortcutElement.textContent = 'Ctrl+Alt+C (Cmd+Option+C on Mac)';
    }
}


async function loadSettings() {
    try {
        // Check if browser extension APIs are available
        const api = BrowserApi.getApi();
        if (!api) {
            throw new Error('Browser API not available');
        }

        if (!api.storage || !api.storage.sync) {
            throw new Error('Storage API not available');
        }

        // Load settings from browser storage
        const defaults = globalThis.FancyLinkSettings.DEFAULT_SETTINGS;
        const result = await api.storage.sync.get(defaults);
        const settings = { ...defaults, ...result };
        
        // Update UI with loaded settings
        updateUI(settings);
        
    } catch (error) {
        console.error('Error loading settings:', error);
        showStatus(`Error loading settings: ${error.message}`, 'error');
        
        // Fall back to defaults
        updateUI(globalThis.FancyLinkSettings.DEFAULT_SETTINGS);
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
        const api = BrowserApi.getApi();
        const currentSettings = await api.storage.sync.get({ defaultFormat: globalThis.FancyLinkSettings.DEFAULT_SETTINGS.defaultFormat });

        const settings = {
            defaultFormat: currentSettings.defaultFormat, // Preserve existing default format
            showNotifications: document.getElementById('showNotifications').checked,
            showBadge: document.getElementById('showBadge').checked,
            cleanUrls: document.getElementById('cleanUrls').checked,
            debugMode: document.getElementById('debugMode').checked,
            includeCurrentPageInBugReports: document.getElementById('includeCurrentPageInBugReports').checked
        };

        // Save to browser storage
        await api.storage.sync.set(settings);
        
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
        const defaults = globalThis.FancyLinkSettings.DEFAULT_SETTINGS;
        const knownKeys = Object.keys(defaults);
        const api = BrowserApi.getApi();
        await api.storage.sync.remove(knownKeys);
        await api.storage.sync.set(defaults);
        updateUI(defaults);
        showStatus('Settings reset to defaults', 'success');
        setTimeout(() => { showStatus(''); }, 3000);
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
        const api = BrowserApi.getApi();
        const settings = await api.storage.sync.get(['includeCurrentPageInBugReports']);
        const includeCurrentPage = settings.includeCurrentPageInBugReports === true;

        // Collect diagnostics information
        const diagnostics = await Diagnostics.collectDiagnostics(includeCurrentPage);
        const issueUrl = Diagnostics.generateGitHubIssueUrl(diagnostics);

        // Open GitHub Issues in new tab
        api.tabs.create({ url: issueUrl });
        
    } catch (error) {
        console.error('Error generating issue report:', error);
        showStatus('Error generating issue report', 'error');
    }
}

