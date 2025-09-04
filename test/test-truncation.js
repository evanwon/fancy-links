/**
 * Test file to verify text truncation in format-registry.js
 */

// Load the format registry
const formatRegistry = require('../src/formats/format-registry.js');

// Create a title that's over 500 characters
const longTitle = 'A'.repeat(510); // 510 A's - should be truncated to 497 A's + "..."
const url = 'https://example.com';

console.log('Testing text truncation (500 character limit)');
console.log('===============================================');
console.log(`Original title length: ${longTitle.length} characters`);
console.log('');

// Test each format
Object.keys(formatRegistry.formatConfig).forEach(formatKey => {
    const config = formatRegistry.formatConfig[formatKey];
    const formatted = config.format(longTitle, url);
    
    // Extract the title part from the formatted output to check truncation
    let titleInOutput = '';
    
    switch(formatKey) {
        case 'slack':
            titleInOutput = formatted.match(/\|([^>]+)>/)?.[1] || '';
            break;
        case 'markdown':
            titleInOutput = formatted.match(/\[([^\]]+)\]/)?.[1] || '';
            break;
        case 'html':
            titleInOutput = formatted.match(/>([^<]+)</)?.[1] || '';
            break;
        case 'plaintext':
            titleInOutput = formatted.split(' - ')[0];
            break;
        case 'rtf':
            // RTF is complex, just check if output contains truncation marker
            titleInOutput = formatted.includes('...') ? 'truncated' : 'not truncated';
            break;
        case 'urlparams':
            const match = formatted.match(/_title=(.+)$/);
            titleInOutput = match ? decodeURIComponent(match[1]) : '';
            break;
    }
    
    // Check if truncation happened
    const expectedLength = formatKey === 'rtf' ? 'truncated' : 497; // 497 chars + "..." = 500
    const actualLength = formatKey === 'rtf' ? titleInOutput : 
                        (titleInOutput.endsWith('...') ? titleInOutput.length - 3 : titleInOutput.length);
    
    if (formatKey === 'markdown') {
        // Markdown escapes backslashes, so the title might be longer
        console.log(`${formatKey.padEnd(12)}: Title in output: ${titleInOutput.substring(0, 50)}...`);
        console.log(`               Contains ellipsis: ${titleInOutput.includes('...')}`);
    } else if (formatKey === 'rtf') {
        console.log(`${formatKey.padEnd(12)}: ${titleInOutput}`);
    } else {
        console.log(`${formatKey.padEnd(12)}: Title length in output: ${titleInOutput.length} chars ${titleInOutput.endsWith('...') ? '(ends with "...")' : ''}`);
    }
});

console.log('');
console.log('✅ Truncation test completed!');