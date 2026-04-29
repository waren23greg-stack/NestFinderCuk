const fs = require('fs');
let v = fs.readFileSync('vercel.json', 'utf8');
console.log('Before:', v.includes('wss://*.firebaseio.com') ? 'CLEAN' : 'CORRUPTED');
// Replace any corrupted wss URL with the clean one
v = v.replace(/wss:\/\/\*\.[^\s"]+firebaseio[^\s";]*/g, 'wss://*.firebaseio.com');
fs.writeFileSync('vercel.json', v);
console.log('After:', v.includes('wss://*.firebaseio.com') ? 'CLEAN' : 'STILL BROKEN');
