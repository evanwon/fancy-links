/**
 * Tests for URL cleaning functionality
 * Run with: node test-clean-url.js
 */

// Import the clean-url module
const { cleanUrl, hasTrackingParams, TRACKING_PARAMS } = require('./src/utils/clean-url.js');

// Test cases
const testCases = [
    {
        name: 'URL with UTM parameters',
        input: 'https://example.com/page?utm_source=google&utm_medium=cpc&utm_campaign=test',
        expected: 'https://example.com/page',
    },
    {
        name: 'URL with Facebook tracking',
        input: 'https://example.com/article?fbclid=IwAR123abc&other_param=keep',
        expected: 'https://example.com/article?other_param=keep',
    },
    {
        name: 'URL with multiple tracking parameters',
        input: 'https://example.com/?utm_source=twitter&fbclid=abc123&gclid=def456&ref=homepage',
        expected: 'https://example.com/',
    },
    {
        name: 'URL with Amazon tracking',
        input: 'https://amazon.com/product?tag=affiliate123&ref=sr_1_1&psc=1&keywords=test',
        expected: 'https://amazon.com/product?keywords=test',
    },
    {
        name: 'YouTube URL with tracking',
        input: 'https://youtube.com/watch?v=abc123&feature=youtu.be&si=tracking123',
        expected: 'https://youtube.com/watch?v=abc123',
    },
    {
        name: 'Clean URL (no tracking parameters)',
        input: 'https://example.com/clean-page?valid_param=keep',
        expected: 'https://example.com/clean-page?valid_param=keep',
    },
    {
        name: 'URL with only tracking parameters',
        input: 'https://example.com/?utm_source=test&fbclid=123',
        expected: 'https://example.com/',
    },
    {
        name: 'Invalid URL',
        input: 'not-a-valid-url',
        expected: 'not-a-valid-url', // Should return original if parsing fails
    },
    {
        name: 'URL with fragment',
        input: 'https://example.com/page?utm_source=test#section',
        expected: 'https://example.com/page#section',
    },
    {
        name: 'URL with mixed tracking and valid parameters',
        input: 'https://shop.com/item?id=123&color=red&utm_campaign=sale&size=large&gclid=abc',
        expected: 'https://shop.com/item?id=123&color=red&size=large',
    }
];

// Test hasTrackingParams function
const trackingTestCases = [
    {
        name: 'URL with tracking params',
        input: 'https://example.com/?utm_source=test',
        expected: true,
    },
    {
        name: 'Clean URL',
        input: 'https://example.com/?valid=param',
        expected: false,
    },
    {
        name: 'Invalid URL',
        input: 'not-a-url',
        expected: false,
    }
];

// Run tests
function runTests() {
    console.log('Testing URL Cleaning Functionality\n');
    
    let passed = 0;
    let failed = 0;
    
    // Test cleanUrl function
    console.log('=== Testing cleanUrl() ===');
    testCases.forEach((testCase, index) => {
        const result = cleanUrl(testCase.input);
        const success = result === testCase.expected;
        
        console.log(`${index + 1}. ${testCase.name}: ${success ? '✅ PASS' : '❌ FAIL'}`);
        if (!success) {
            console.log(`   Expected: ${testCase.expected}`);
            console.log(`   Got:      ${result}`);
        }
        
        success ? passed++ : failed++;
    });
    
    console.log('\n=== Testing hasTrackingParams() ===');
    trackingTestCases.forEach((testCase, index) => {
        const result = hasTrackingParams(testCase.input);
        const success = result === testCase.expected;
        
        console.log(`${index + 1}. ${testCase.name}: ${success ? '✅ PASS' : '❌ FAIL'}`);
        if (!success) {
            console.log(`   Expected: ${testCase.expected}`);
            console.log(`   Got:      ${result}`);
        }
        
        success ? passed++ : failed++;
    });
    
    // Test tracking parameters coverage
    console.log('\n=== Tracking Parameters Coverage ===');
    console.log(`Total tracking parameters defined: ${TRACKING_PARAMS.length}`);
    console.log('Sample parameters:', TRACKING_PARAMS.slice(0, 10).join(', '));
    
    // Summary
    console.log(`\n=== Test Summary ===`);
    console.log(`Total tests: ${passed + failed}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
        console.log('🎉 All tests passed!');
        process.exit(0);
    } else {
        console.log('❌ Some tests failed');
        process.exit(1);
    }
}

// Run the tests
runTests();