const fs = require('fs');
const files = ['index.html', 'login.html', 'admin.html', 'payments.html'];
files.forEach(f => {
  let h = fs.readFileSync(f, 'utf8');
  const before = (h.match(/\]\(http:\/\//g)||[]).length;
  h = h.replace(/\[([a-zA-Z0-9_$.]+)\]\(http:\/\/[^)]+\)/g, '$1');
  const after = (h.match(/\]\(http:\/\//g)||[]).length;
  fs.writeFileSync(f, h);
  console.log(f + ': fixed=' + before + ' remaining=' + after);
});
