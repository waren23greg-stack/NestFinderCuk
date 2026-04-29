const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
h = h.replace(/\[([^\]\s]+)\]\(http:\/\/[^\)]+\)/g, '$1');
fs.writeFileSync('index.html', h);
console.log('done');
