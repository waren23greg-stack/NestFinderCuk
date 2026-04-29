const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// Fix [word.word](http://word.word) patterns
h = h.replace(/\[([a-zA-Z0-9_$.]+)\]\(http:\/\/[^)]+\)/g, '$1');

fs.writeFileSync('index.html', h);

// Verify
const remaining = (h.match(/\]\(http:\/\//g) || []).length;
console.log('Remaining markdown links:', remaining);
console.log('doc.data check:', h.includes('doc.data()') ? 'OK' : 'STILL BROKEN');
console.log('fbUser.email check:', h.includes('fbUser.email') ? 'OK' : 'STILL BROKEN');
console.log('snap.docs.map check:', h.includes('snap.docs.map') ? 'OK' : 'STILL BROKEN');
