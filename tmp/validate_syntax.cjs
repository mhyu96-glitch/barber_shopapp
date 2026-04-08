const fs = require('fs');
const path = require('path');

const filePath = 'd:/web app tukang cukur/src/pages/superAdmin.js';
const code = fs.readFileSync(filePath, 'utf8');

try {
    new Function(code);
    console.log('Syntax OK');
} catch (e) {
    console.error('Syntax Error found:');
    console.error(e.message);
    const match = e.stack.match(/<anonymous>:(\d+):(\d+)/);
    if (match) {
        console.error(`Line: ${match[1]}, Column: ${match[2]}`);
    } else {
        // If stack doesn't have it, try to find the last known good block
        console.error('No specific line found in stack, likely unclosed brace/string.');
    }
}
