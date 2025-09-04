// Manual test script for format functions
// Run with: node test/test-formats.js

const fs = require('fs');
const path = require('path');

// Import format configuration from centralized registry
const { formatConfig: formats } = require('../src/formats/format-registry.js');

// Test cases
const testCases = [
    {
        title: "Test Page for Fancy Links Extension",
        url: "https://github.com/test/repo"
    },
    {
        title: "Page with [Special] (Characters) & Symbols",
        url: "https://example.com/path?param=value&other=test"
    },
    {
        title: "Very Long Title That Should Be Truncated If It Exceeds The Character Limit Set In The Sanitization Function To Prevent Issues With Various Platforms And Services That Have Length Restrictions On Link Titles And Descriptions Which Can Cause Problems When Sharing Links In Different Contexts And Applications That May Not Handle Extremely Long Text Properly",
        url: "https://example.com"
    }
];

console.log('🧪 Fancy Links Extension - Format Testing');
console.log('==========================================\n');

testCases.forEach((testCase, index) => {
    console.log(`Test Case ${index + 1}:`);
    console.log(`Title: "${testCase.title}"`);
    console.log(`URL: ${testCase.url}\n`);
    
    console.log('Formatted Results:');
    console.log('------------------');
    
    Object.entries(formats).forEach(([formatName, formatModule]) => {
        try {
            const result = formatModule.format(testCase.title, testCase.url);
            console.log(`${formatName.padEnd(12)}: ${result}`);
        } catch (error) {
            console.log(`${formatName.padEnd(12)}: ERROR - ${error.message}`);
        }
    });
    
    console.log('\n' + '='.repeat(60) + '\n');
});

console.log('✅ Format testing completed!');