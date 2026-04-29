const fs = require('fs');
let cfg = fs.readFileSync('firebase-config.js', 'utf8');
cfg = cfg.replace(/\[([^\]]+)\]\(http[^)]+\)/g, '$1');
fs.writeFileSync('firebase-config.js', cfg);
console.log('done');
