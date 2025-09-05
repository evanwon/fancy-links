/**
 * Diagnostic information utility for bug reporting
 * Collects system and extension info for GitHub Issues
 */

/**
 * Collects diagnostic information for bug reports
 * @param {boolean} includeCurrentPage - Whether to include current tab info (default: false)
 * @returns {Promise<Object>} Diagnostic information object
 */
async function collectDiagnostics(includeCurrentPage = false) {
  const diagnostics = {};

  // Extension information
  // Use browser API if available, fall back to chrome
  const api = typeof browser !== 'undefined' ? browser : chrome;
  const manifest = api.runtime.getManifest();
  diagnostics.extension = {
    version: manifest.version
  };

  // Browser and OS information
  diagnostics.browser = {
    name: getBrowserName(),
    version: getBrowserVersion(),
    os: getOperatingSystem()
  };

  // Extension settings
  try {
    // Use browser API if available, fall back to chrome
    const api = typeof browser !== 'undefined' ? browser : chrome;
    const settings = await api.storage.sync.get([
      'defaultFormat',
      'cleanUrls', 
      'debugMode',
      'showNotifications',
      'showBadge',
      'includeCurrentPageInBugReports'
    ]);
    
    diagnostics.settings = {
      defaultFormat: settings.defaultFormat || 'markdown',
      cleanUrls: settings.cleanUrls !== false,
      debugMode: settings.debugMode === true,
      showNotifications: settings.showNotifications !== false,
      showBadge: settings.showBadge !== false,
      includeCurrentPageInBugReports: settings.includeCurrentPageInBugReports === true
    };
  } catch (error) {
    diagnostics.settings = { error: 'Unable to read settings' };
  }

  // Current page information (privacy-conscious)
  if (includeCurrentPage) {
    try {
      // Use browser API if available, fall back to chrome
      const api = typeof browser !== 'undefined' ? browser : chrome;
      const [tab] = await api.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        diagnostics.currentPage = {
          url: tab.url,
          title: tab.title
        };
      }
    } catch (error) {
      diagnostics.currentPage = { error: 'Unable to read current tab' };
    }
  }

  return diagnostics;
}

/**
 * Formats diagnostic information for GitHub Issues
 * @param {Object} diagnostics - Diagnostic information object
 * @returns {string} Formatted markdown string
 */
function formatDiagnosticsForGitHub(diagnostics) {
  let output = '';
  
  // System Information section
  output += '## System Information\n';
  output += `- **Extension Version**: ${diagnostics.extension.version}\n`;
  output += `- **Browser**: ${diagnostics.browser.name} ${diagnostics.browser.version}\n`;
  output += `- **OS**: ${diagnostics.browser.os}\n`;
  
  // Settings information
  if (diagnostics.settings && !diagnostics.settings.error) {
    const settings = diagnostics.settings;
    output += `- **Settings**: Default format: ${settings.defaultFormat}, `;
    output += `Clean URLs: ${settings.cleanUrls ? 'enabled' : 'disabled'}, `;
    output += `Debug mode: ${settings.debugMode ? 'enabled' : 'disabled'}`;
    if (settings.showNotifications !== undefined || settings.showBadge !== undefined) {
      output += `, Notifications: ${settings.showNotifications ? 'enabled' : 'disabled'}`;
      output += `, Badge: ${settings.showBadge ? 'enabled' : 'disabled'}`;
    }
    output += '\n';
  }
  
  // Current page (only if included)
  if (diagnostics.currentPage && !diagnostics.currentPage.error) {
    output += '\n## Current Page Information\n';
    output += `- **URL**: ${diagnostics.currentPage.url}\n`;
    output += `- **Title**: ${diagnostics.currentPage.title}\n`;
  }
  
  return output;
}

/**
 * Generates GitHub Issues URL with pre-populated template
 * @param {Object} diagnostics - Diagnostic information object  
 * @returns {string} GitHub Issues URL
 */
function generateGitHubIssueUrl(diagnostics) {
  const repoUrl = 'https://github.com/evanwon/fancy-links/issues/new';
  
  const title = `Bug report v${diagnostics.extension.version}: [Describe your issue briefly]`;
  
  const body = `## Problem Description
[Please describe what happened and what you expected to happen]

## Steps to Reproduce
1. [First step]
2. [Second step]
3. [etc.]

${formatDiagnosticsForGitHub(diagnostics)}

## Additional Context
[Add any other context about the problem here]`;

  const params = new URLSearchParams({
    title: title,
    body: body,
    labels: 'bug'
  });
  
  return `${repoUrl}?${params.toString()}`;
}

/**
 * Gets browser name from user agent
 * @returns {string} Browser name
 */
function getBrowserName() {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
}

/**
 * Gets browser version from user agent
 * @returns {string} Browser version
 */
function getBrowserVersion() {
  const userAgent = navigator.userAgent;
  
  // Firefox version extraction
  const firefoxMatch = userAgent.match(/Firefox\/([0-9.]+)/);
  if (firefoxMatch) return firefoxMatch[1];
  
  // Chrome version extraction  
  const chromeMatch = userAgent.match(/Chrome\/([0-9.]+)/);
  if (chromeMatch) return chromeMatch[1];
  
  return 'Unknown';
}

/**
 * Gets operating system from user agent and platform
 * @returns {string} Operating system
 */
function getOperatingSystem() {
  const platform = navigator.platform;
  const userAgent = navigator.userAgent;
  
  if (platform.includes('Win') || userAgent.includes('Windows')) {
    // Try to get Windows version
    if (userAgent.includes('Windows NT 10.0')) return 'Windows 10/11';
    if (userAgent.includes('Windows NT 6.3')) return 'Windows 8.1';
    if (userAgent.includes('Windows NT 6.1')) return 'Windows 7';
    return 'Windows';
  }
  
  if (platform.includes('Mac') || userAgent.includes('Macintosh')) {
    return 'macOS';
  }
  
  if (platform.includes('Linux') || userAgent.includes('Linux')) {
    return 'Linux';
  }
  
  return platform || 'Unknown';
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  // CommonJS
  module.exports = {
    collectDiagnostics,
    formatDiagnosticsForGitHub, 
    generateGitHubIssueUrl
  };
} else if (typeof window !== 'undefined') {
  // Browser global
  window.Diagnostics = {
    collectDiagnostics,
    formatDiagnosticsForGitHub,
    generateGitHubIssueUrl
  };
}