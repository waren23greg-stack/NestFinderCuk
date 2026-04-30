const fs = require('fs');

const files = ['index.html', 'login.html', 'admin.html', 'payments.html'];

files.forEach(f => {
  if (!fs.existsSync(f)) { console.log('SKIP (not found):', f); return; }
  let h = fs.readFileSync(f, 'utf8');
  const before = (h.match(/\]\(http:\/\//g)||[]).length;
  // Fix [word.word](http://...) patterns
  h = h.replace(/\[([a-zA-Z0-9_$.[\]]+)\]\(http:\/\/[^)]+\)/g, '$1');
  const after = (h.match(/\]\(http:\/\//g)||[]).length;
  fs.writeFileSync(f, h);
  console.log(f + ': fixed=' + before + ' remaining=' + after);
});

console.log('\nVerify index.html key lines:');
const idx = fs.readFileSync('index.html', 'utf8');
console.log('snap.docs.map ok:', idx.includes('snap.docs.map('));
console.log('doc.data ok:', idx.includes('doc.data()'));
console.log('d.id ok:', idx.includes('d.id'));
console.log('el.style ok:', idx.includes('el.style'));
