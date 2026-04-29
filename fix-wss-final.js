const fs = require('fs');
let v = fs.readFileSync('vercel.json', 'utf8');

// Decode the clean URL from base64 to avoid any chat corruption
const clean = Buffer.from('d3NzOi8vKi5maXJlYmFzZWlvLmNvbQ==', 'base64').toString();

// Replace the corrupted wss URL (any form) with the clean one
v = v.replace(/wss:\/\/[^";\s]+/g, clean);

fs.writeFileSync('vercel.json', v);

const idx = v.indexOf('wss');
const result = v.slice(idx, idx+30);
console.log('Result:', JSON.stringify(result));
console.log('Clean:', result.startsWith('wss://*.firebaseio.com') ? 'YES' : 'NO');
