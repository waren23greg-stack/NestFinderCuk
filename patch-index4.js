const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix all markdown-link corruptions: [foo.bar](http://foo.bar) → foo.bar
html = html.replace(/\[([a-zA-Z_$][a-zA-Z0-9_$]*\.[a-zA-Z_$][a-zA-Z0-9_$.]*)\]\(http:\/\/\1\)/g, '$1');
// Also fix bracketed single-word ones like [el.style](http://el.style)
html = html.replace(/\[([^\]]+)\]\(http:\/\/\1\)/g, '$1');
console.log('Markdown links unescaped');

// 2. Remove the OLD initAuth (the one that still uses _SB_URL)
//    It starts right after the "// Firebase handles token refresh" comment
const OLD_START = "async function initAuth(){\n  const t=localStorage.getItem('sb-token');if(!t)return;";
const OLD_END   = "document.getElementById('drawer-user').textContent='Signed in as '+name;\n    ['nav-payments'";

let s = html.indexOf(OLD_START);
if (s === -1) { console.error('Old initAuth not found'); }
else {
  // Find closing — walk forward to find the matching }initAuth(); or the next function
  // The old block ends at the line with drawer-user + the nav-payments forEach block
  // We'll cut from OLD_START up to just before the new firebase.auth().onAuthStateChanged block
  // which was already inserted right before this old copy.
  // Simply delete from OLD_START to the end of the old stub.
  // The old block ends when the NEW firebase initAuth begins — find it.
  const NEW_BLOCK = "  firebase.auth().onAuthStateChanged(async function(fbUser){";
  let newStart = html.indexOf(NEW_BLOCK, s);
  if (newStart === -1) { console.error('New initAuth block not found'); }
  else {
    // Delete from s to newStart (removes the old duplicate header)
    html = html.slice(0, s) + html.slice(newStart);
    console.log('Old initAuth stub removed');
  }
}

// 3. Any remaining _SB_URL fetch calls — stub them out
html = html.replace(
  /await fetch\(_SB_URL\+[^;]+;/g,
  'await Promise.resolve({ok:true,json:()=>Promise.resolve({})});'
);
console.log('Remaining _SB_URL fetches stubbed');

fs.writeFileSync('index.html', html);

const rem = (html.match(/mtycapgbtvpczvswpjpo|_SB_URL|_SBH\(/g)||[]);
console.log('Remaining hits:', rem.length, rem);
