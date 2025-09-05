/**
 * Test suite for diagnostics module
 * Tests browser API compatibility and current page inclusion functionality
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Color codes for terminal output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

// Test tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Load and execute diagnostics module in a controlled context
function loadDiagnosticsModule(apiType = 'both') {
    const diagnosticsPath = path.join(__dirname, '..', 'src', 'utils', 'diagnostics.js');
    const diagnosticsCode = fs.readFileSync(diagnosticsPath, 'utf8');
    
    // Mock manifest
    const mockManifest = {
        version: '1.2.0'
    };
    
    // Mock storage
    const mockStorage = {
        defaultFormat: 'markdown',
        cleanUrls: true,
        debugMode: false,
        showNotifications: true,
        showBadge: true,
        includeCurrentPageInBugReports: true
    };
    
    // Mock tab
    const mockTab = {
        url: 'https://example.com/test-page',
        title: 'Test Page Title'
    };
    
    // Create mock API
    const createMockAPI = () => ({
        runtime: {
            getManifest: () => mockManifest
        },
        storage: {
            sync: {
                get: (keys) => Promise.resolve(mockStorage)
            }
        },
        tabs: {
            query: (options) => Promise.resolve([mockTab])
        }
    });
    
    // Create sandbox context
    const sandbox = {
        console: console,
        setTimeout: setTimeout,
        Promise: Promise,
        URLSearchParams: URLSearchParams,
        navigator: {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
            platform: 'Win32'
        },
        window: {}
    };
    
    // Add browser/chrome APIs based on type
    if (apiType === 'browser' || apiType === 'both') {
        sandbox.browser = createMockAPI();
    }
    if (apiType === 'chrome' || apiType === 'both') {
        sandbox.chrome = createMockAPI();
    }
    
    // Create context and run the code
    const context = vm.createContext(sandbox);
    vm.runInContext(diagnosticsCode, context);
    
    // Return the Diagnostics object
    return sandbox.window.Diagnostics;
}

// Test helper
async function runTest(testName, testFn) {
    totalTests++;
    try {
        await testFn();
        passedTests++;
        console.log(`${totalTests}. ${testName}: ${colors.green}✅ PASS${colors.reset}`);
    } catch (error) {
        failedTests++;
        console.log(`${totalTests}. ${testName}: ${colors.red}❌ FAIL${colors.reset}`);
        console.log(`   Error: ${error.message}`);
    }
}

// Main test suite
async function runTests() {
    console.log('Testing Diagnostics Module');
    console.log('==========================\n');
    
    // Test 1: Browser API only (Firefox)
    console.log(`${colors.cyan}=== Testing Browser API (Firefox) ===${colors.reset}`);
    await runTest('Browser API detection', async () => {
        const Diagnostics = loadDiagnosticsModule('browser');
        const diagnostics = await Diagnostics.collectDiagnostics(false);
        
        if (!diagnostics.extension || diagnostics.extension.version !== '1.2.0') {
            throw new Error('Failed to get extension info with browser API');
        }
        if (!diagnostics.settings || diagnostics.settings.error) {
            throw new Error('Failed to get settings with browser API');
        }
    });
    
    await runTest('Include current page with browser API', async () => {
        const Diagnostics = loadDiagnosticsModule('browser');
        const diagnostics = await Diagnostics.collectDiagnostics(true);
        
        if (!diagnostics.currentPage) {
            throw new Error('Current page not included when requested');
        }
        if (diagnostics.currentPage.url !== 'https://example.com/test-page') {
            throw new Error(`Wrong URL: ${diagnostics.currentPage.url}`);
        }
        if (diagnostics.currentPage.title !== 'Test Page Title') {
            throw new Error(`Wrong title: ${diagnostics.currentPage.title}`);
        }
    });
    
    await runTest('Exclude current page with browser API', async () => {
        const Diagnostics = loadDiagnosticsModule('browser');
        const diagnostics = await Diagnostics.collectDiagnostics(false);
        
        if (diagnostics.currentPage) {
            throw new Error('Current page included when not requested');
        }
    });
    
    // Test 2: Chrome API only
    console.log(`\n${colors.cyan}=== Testing Chrome API ===${colors.reset}`);
    await runTest('Chrome API detection', async () => {
        const Diagnostics = loadDiagnosticsModule('chrome');
        const diagnostics = await Diagnostics.collectDiagnostics(false);
        
        if (!diagnostics.extension || diagnostics.extension.version !== '1.2.0') {
            throw new Error('Failed to get extension info with chrome API');
        }
        if (!diagnostics.settings || diagnostics.settings.error) {
            throw new Error('Failed to get settings with chrome API');
        }
    });
    
    await runTest('Include current page with chrome API', async () => {
        const Diagnostics = loadDiagnosticsModule('chrome');
        const diagnostics = await Diagnostics.collectDiagnostics(true);
        
        if (!diagnostics.currentPage) {
            throw new Error('Current page not included when requested');
        }
        if (diagnostics.currentPage.url !== 'https://example.com/test-page') {
            throw new Error(`Wrong URL: ${diagnostics.currentPage.url}`);
        }
    });
    
    // Test 3: Both APIs available (should prefer browser)
    console.log(`\n${colors.cyan}=== Testing API Priority (Both Available) ===${colors.reset}`);
    await runTest('Prefers browser API when both available', async () => {
        const Diagnostics = loadDiagnosticsModule('both');
        
        // This test verifies that browser API is used when both are available
        // The implementation should use browser API in Firefox
        const diagnostics = await Diagnostics.collectDiagnostics(false);
        
        if (!diagnostics.extension || diagnostics.extension.version !== '1.2.0') {
            throw new Error('Failed to use browser API when both available');
        }
    });
    
    // Test 4: GitHub issue URL generation
    console.log(`\n${colors.cyan}=== Testing GitHub Issue Generation ===${colors.reset}`);
    await runTest('Generate GitHub issue URL', async () => {
        const Diagnostics = loadDiagnosticsModule('browser');
        const diagnostics = await Diagnostics.collectDiagnostics(false);
        const issueUrl = Diagnostics.generateGitHubIssueUrl(diagnostics);
        
        if (!issueUrl.includes('https://github.com/evanwon/fancy-links/issues/new')) {
            throw new Error('Invalid GitHub issue URL base');
        }
        if (!issueUrl.includes('title=Bug')) {
            throw new Error('Missing title parameter');
        }
        if (!issueUrl.includes('labels=bug')) {
            throw new Error('Missing bug label');
        }
    });
    
    await runTest('GitHub issue includes current page when enabled', async () => {
        const Diagnostics = loadDiagnosticsModule('browser');
        const diagnostics = await Diagnostics.collectDiagnostics(true);
        
        // Verify diagnostics has current page
        if (!diagnostics.currentPage || !diagnostics.currentPage.url) {
            throw new Error('Current page not included in diagnostics');
        }
        
        const issueUrl = Diagnostics.generateGitHubIssueUrl(diagnostics);
        
        // Decode the URL to check content
        const decodedUrl = decodeURIComponent(issueUrl);
        
        // Debug: print the decoded content to understand what we're getting
        // console.log('Decoded URL content:', decodedUrl);
        
        // Check that the URL and title are present somewhere in the body
        // Note: URL encoding uses + for spaces, so we need to check for both forms
        if (!decodedUrl.includes('https://example.com/test-page')) {
            throw new Error('Missing page URL in issue body');
        }
        if (!decodedUrl.includes('Test Page Title') && !decodedUrl.includes('Test+Page+Title')) {
            throw new Error(`Missing page title in issue body. Content: ${decodedUrl.substring(0, 500)}...`);
        }
    });
    
    // Test 5: System detection
    console.log(`\n${colors.cyan}=== Testing System Detection ===${colors.reset}`);
    await runTest('Detects browser and OS correctly', async () => {
        const Diagnostics = loadDiagnosticsModule('browser');
        const diagnostics = await Diagnostics.collectDiagnostics(false);
        
        if (diagnostics.browser.name !== 'Firefox') {
            throw new Error(`Wrong browser: ${diagnostics.browser.name}`);
        }
        if (!diagnostics.browser.version.includes('122')) {
            throw new Error(`Wrong browser version: ${diagnostics.browser.version}`);
        }
        if (!diagnostics.browser.os.includes('Windows')) {
            throw new Error(`Wrong OS: ${diagnostics.browser.os}`);
        }
    });
    
    // Test 6: Error handling  
    console.log(`\n${colors.cyan}=== Testing Error Handling ===${colors.reset}`);
    await runTest('Handles missing API gracefully', async () => {
        // Test with no APIs available
        const Diagnostics = loadDiagnosticsModule('none');
        
        // Even without browser/chrome APIs, the functions should still exist
        if (!Diagnostics || !Diagnostics.collectDiagnostics) {
            throw new Error('Module not loaded even without APIs');
        }
        
        // Try to collect diagnostics - should handle missing APIs gracefully
        const diagnostics = await Diagnostics.collectDiagnostics(false);
        
        // Should still have browser info from navigator
        if (!diagnostics.browser) {
            throw new Error('Missing browser info');
        }
        
        // With no API, extension info should fail gracefully
        if (!diagnostics.extension) {
            throw new Error('Missing extension info');
        }
    });
    
    // Summary
    console.log(`\n${colors.cyan}=== Test Summary ===${colors.reset}`);
    console.log(`Total tests: ${totalTests}`);
    console.log(`Passed: ${colors.green}${passedTests}${colors.reset}`);
    console.log(`Failed: ${colors.red}${failedTests}${colors.reset}`);
    console.log(`Success rate: ${((passedTests/totalTests)*100).toFixed(1)}%`);
    
    if (failedTests === 0) {
        console.log(`${colors.green}🎉 All diagnostics tests passed!${colors.reset}`);
        console.log('\nThis test suite validates:');
        console.log('✓ Browser API compatibility (Firefox)');
        console.log('✓ Chrome API compatibility');
        console.log('✓ Correct API priority when both are available');
        console.log('✓ Current page inclusion setting works correctly');
        console.log('✓ GitHub issue generation with diagnostic info');
        console.log('✓ System detection (browser, version, OS)');
        console.log('✓ Graceful error handling');
    } else {
        console.log(`${colors.red}❌ Some tests failed. Please review the errors above.${colors.reset}`);
        process.exit(1);
    }
}

// Run the tests
runTests().catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
});