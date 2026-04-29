const fs = require('fs');
let h = fs.readFileSync('login.html', 'utf8');
h = h.replace(/\[([a-zA-Z0-9_$.]+)\]\(http:\/\/[^)]+\)/g, '$1');
fs.writeFileSync('login.html', h);
console.log('done');
console.log('remaining:', (h.match(/\]\(http:\/\//g)||[]).length);
console.log('doc.data ok:', h.includes('doc.data()'));
