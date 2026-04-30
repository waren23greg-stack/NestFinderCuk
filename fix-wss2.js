const fs = require('fs');
let v = fs.readFileSync('vercel.json', 'utf8');

// Base64 encoded clean string: wss://*.firebaseio.com
const clean = Buffer.from('d3NzOi8vKi5maXJlYmFzZWlvLmNvbQ==', 'base64').toString();
console.log('Clean string:', clean);

// Replace everything from wss:// up to the next space
v = v.replace(/wss:\/\/[^\s]+/, clean);

fs.writeFileSync('vercel.json', v);

// Verify
const idx = v.indexOf('wss');
console.log('Result:', JSON.stringify(v.slice(idx, idx+30)));
