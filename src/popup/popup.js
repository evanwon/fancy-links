// Load format configuration from centralized registry 
// The registry is loaded as a script in the HTML, making FancyLinkFormatRegistry available globally
const formats = globalThis.FancyLinkFormatRegistry.formatConfig;
// Note: getWorksWithText is used directly from globalThis.FancyLinkFormatRegistry.getWorksWithText to avoid redeclaration

// Current tab info
let currentTab = null;

// Load version from manifest
function loadVersion() {
    try {
        const manifest = browser.runtime.getManifest();
        const versionElement = document.getElementById('version');

        if (versionElement) {
            // Use version_name which should always be set (e.g., "1.5.0-rc1" for pre-releases, "1.5.0" for stable)
            // Fall back to version only if version_name is missing for some reason
            const displayVersion = manifest.version_name || manifest.version;
            if (manifest && displayVersion) {
                versionElement.textContent = `v${displayVersion}`;
                versionElement.style.display = 'inline';
                versionElement.title = 'Click to view changelog';
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
        
        const setDefaultBtn = document.createElement('button');
        setDefaultBtn.className = 'set-default-btn';
        setDefaultBtn.textContent = 'Set Default';
        setDefaultBtn.setAttribute('data-format', formatKey);
        setDefaultBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent format button click
            setDefaultFormat(formatKey);
        });
        header.appendChild(setDefaultBtn);
        
        button.appendChild(header);
        
        // Add "works with" text if applicable
        if (config.worksWith && config.worksWith.length > 0) {
            const worksWithSpan = document.createElement('span');
            worksWithSpan.className = 'format-apps';
            worksWithSpan.textContent = config.worksWith.join(', ');
            button.appendChild(worksWithSpan);
        }
        
        // Format placeholder display
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
    updateKeyboardHint();
});

// Update keyboard hint based on OS
async function updateKeyboardHint() {
    const shortcutSpan = document.getElementById('keyboardShortcut');
    if (!shortcutSpan) return;
    
    try {
        // Try to get browser API (cross-browser compatible)
        const browserAPI = typeof browser !== 'undefined' ? browser : 
                          (typeof chrome !== 'undefined' ? chrome : null);
        
        if (browserAPI && browserAPI.commands && browserAPI.commands.getAll) {
            const commands = await browserAPI.commands.getAll();
            const copyCommand = commands.find(cmd => cmd.name === 'copy-fancy-link');
            
            if (copyCommand && copyCommand.shortcut) {
                // Use the centralized formatter
                shortcutSpan.textContent = KeyboardShortcuts.formatShortcutForDisplay(copyCommand.shortcut);
                return;
            } else if (copyCommand) {
                // Command exists but no shortcut assigned
                const hintElement = document.querySelector('.keyboard-hint');
                if (hintElement) {
                    hintElement.innerHTML = `No keyboard shortcut set. <a href="#" id="shortcutSettingsLink">Configure in settings →</a>`;
                    
                    // Add click handler for settings link
                    const settingsLink = document.getElementById('shortcutSettingsLink');
                    if (settingsLink) {
                        settingsLink.addEventListener('click', (e) => {
                            e.preventDefault();
                            browserAPI.runtime.openOptionsPage();
                        });
                    }
                }
                return;
            }
        }
        
        // Fallback to default
        shortcutSpan.textContent = KeyboardShortcuts.getDefaultShortcut();
        
    } catch (error) {
        // If commands API fails, use fallback
        console.warn('Could not get keyboard shortcut from commands API:', error);
        shortcutSpan.textContent = KeyboardShortcuts.getDefaultShortcut();
    }
}

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
    // Update each format preview with the example from the format registry
    Object.keys(formats).forEach(formatKey => {
        const previewElement = document.getElementById(`preview-${formatKey}`);
        const config = formats[formatKey];
        if (previewElement && config && config.example) {
            // Use the example directly from the format configuration
            previewElement.textContent = config.example;
        } else if (previewElement) {
            // Fallback if no example is defined
            previewElement.textContent = 'Format preview';
        }
    });
}

function setupEventListeners() {
    // Format button clicks - use event delegation since buttons are dynamically created
    const formatButtons = document.getElementById('formatButtons');
    if (formatButtons) {
        formatButtons.addEventListener('click', async (e) => {
            const button = e.target.closest('.format-btn');
            if (button) {
                const format = button.getAttribute('data-format');
                await copyWithFormat(format);
            }
        });
    }
    
    // Header settings button
    const headerOptionsBtn = document.getElementById('headerOptionsBtn');
    if (headerOptionsBtn) {
        headerOptionsBtn.addEventListener('click', () => {
            browser.runtime.openOptionsPage();
            window.close();
        });
    }
    
    // Help button for issue reporting
    const helpButton = document.getElementById('helpButton');
    if (helpButton) {
        helpButton.addEventListener('click', handleHelpButtonClick);
    }
    
    // Version number click to open changelog
    const versionElement = document.getElementById('version');
    if (versionElement) {
        versionElement.addEventListener('click', handleVersionClick);
    }
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

async function setDefaultFormat(formatKey) {
    try {
        // Save the new default format to storage
        await browser.storage.sync.set({
            defaultFormat: formatKey
        });
        
        // Update the UI to reflect the change
        await updateDefaultIndicator();
        
        // Show confirmation notification
        const config = formats[formatKey];
        const formatName = config ? config.name : formatKey;
        showNotification(`${formatName} set as default format`, 'success');
        
    } catch (error) {
        console.error('Error setting default format:', error);
        showNotification('Failed to set default format', 'error');
    }
}

async function updateDefaultIndicator() {
    try {
        // Get the default format setting
        const settings = await browser.storage.sync.get({
            defaultFormat: 'markdown'
        });
        
        const defaultFormat = settings.defaultFormat;
        
        // Update all format buttons
        document.querySelectorAll('.format-btn').forEach(button => {
            const formatKey = button.getAttribute('data-format');
            const isDefault = formatKey === defaultFormat;
            
            // Update button class
            button.classList.toggle('default', isDefault);
            
            // Show/hide appropriate label/button
            const defaultLabel = button.querySelector('.default-label');
            const setDefaultBtn = button.querySelector('.set-default-btn');
            
            if (defaultLabel && setDefaultBtn) {
                if (isDefault) {
                    defaultLabel.style.display = 'inline';
                    setDefaultBtn.style.display = 'none';
                } else {
                    defaultLabel.style.display = 'none';
                    setDefaultBtn.style.display = 'inline';
                }
            }
        });
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

async function handleHelpButtonClick() {
    try {
        // Get current settings to determine if we should include page info
        const settings = await browser.storage.sync.get(['includeCurrentPageInBugReports']);
        const includeCurrentPage = settings.includeCurrentPageInBugReports === true;
        
        // Collect diagnostics information
        const diagnostics = await Diagnostics.collectDiagnostics(includeCurrentPage);
        const issueUrl = Diagnostics.generateGitHubIssueUrl(diagnostics);
        
        // Open GitHub Issues in new tab
        browser.tabs.create({ url: issueUrl });
        window.close(); // Close popup after opening issue reporting
        
    } catch (error) {
        console.error('Error generating issue report:', error);
        showNotification('Error generating issue report', 'error');
    }
}

async function handleVersionClick() {
    try {
        const manifest = browser.runtime.getManifest();
        // Use version_name for the tag since that's what we tag releases with (e.g., "v1.5.0-rc1")
        // Only proceed if version_name exists to ensure we link to a valid release tag
        if (manifest && manifest.version_name) {
            const changelogUrl = `https://github.com/evanwon/fancy-links/releases/tag/v${manifest.version_name}`;
            browser.tabs.create({ url: changelogUrl });
            window.close();
        }
    } catch (error) {
        console.error('Error opening changelog:', error);
        showNotification('Error opening changelog', 'error');
    }
}

