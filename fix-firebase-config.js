const fs = require('fs');

// Fix firebase-config.js — remove the broken supabase line
let cfg = fs.readFileSync('firebase-config.js', 'utf8');
cfg = cfg.replace(/const supabase\s*=\s*createClient\(firebaseConfig\);?\s*/g, '');

// Add firebase.initializeApp if missing
if (!cfg.includes('initializeApp')) {
  cfg += '\nfirebase.initializeApp(firebaseConfig);\n';
}
fs.writeFileSync('firebase-config.js', cfg);
console.log('firebase-config.js fixed');

// Fix index.html line 633 — remove the broken sb=supabase line
let h = fs.readFileSync('index.html', 'utf8');
h = h.replace('<script>const sb=supabase;</script>', '');
fs.writeFileSync('index.html', h);
console.log('index.html fixed');
