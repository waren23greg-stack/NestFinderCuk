const fs = require('fs');

const files = ['index.html', 'login.html', 'admin.html', 'payments.html'];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let h = fs.readFileSync(f, 'utf8');
  const before = (h.match(/\]\(http/g)||[]).length;
  // Remove all markdown link wrappers: [text](url) -> text
  h = h.replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, '$1');
  const after = (h.match(/\]\(http/g)||[]).length;
  fs.writeFileSync(f, h);
  console.log(f + ': removed=' + (before-after) + ' remaining=' + after);
});
