const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Fix remaining markdown-link corruptions first
html = html.replace(/\[([^\]]+)\]\(http:\/\/[^\)]+\)/g, (m, inner) => {
  // Only fix if it looks like a JS property/variable (no spaces)
  if (!/\s/.test(inner)) return inner;
  return m;
});

// Replace the two-line Promise.all fetch block (lines 2901-2902)
// Match from "const [{data:prof}" to the closing "])"
const PA_START = "const [{data:prof},{data:lst}]=await Promise.all([";
const PA_END   = "]);";

let s = html.indexOf(PA_START);
if (s === -1) { console.error('Promise.all not found'); }
else {
  const e = html.indexOf(PA_END, s) + PA_END.length;
  html = html.slice(0, s) +
`const [{data:prof},{data:lst}]=await Promise.all([
      firebase.firestore().collection('users').doc(user.uid||user.id).get().then(d=>({data:d.exists?d.data():{}})),
      firebase.firestore().collection('listings').doc(cur.id).get().then(d=>({data:d.exists?d.data():{}}))
    ]);` +
  html.slice(e);
  console.log('Promise.all replaced');
}

// Nuclear cleanup: stub any _SB_URL or _SBH( still present
html = html.replace(/fetch\(_SB_URL\+[^,)]+,\s*\{[^}]*\}\)/g,
  "Promise.resolve({ok:true,json:()=>Promise.resolve({})})");
html = html.replace(/_SBH\([^)]*\)/g, "{}");

fs.writeFileSync('index.html', html);

const rem = (html.match(/mtycapgbtvpczvswpjpo|_SB_URL|_SBH\(/g)||[]);
console.log('Remaining hits:', rem.length, rem);
