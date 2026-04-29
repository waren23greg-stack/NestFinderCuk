const fs = require('fs');
let h = fs.readFileSync('login.html', 'utf8');

// Replace the sign-in Firestore call with a direct redirect
const OLD = `_auth.signInWithEmailAndPassword(email, pass).then(function(cred) {
    return _db.collection('users').doc(cred.user.uid).get();
  }).then(function(doc) {
    var role = doc.exists ? (doc.data().role || 'student') : 'student';
    window.location.href = role === 'admin' ? 'admin.html' : 'index.html';
  }).catch(function(e) {
    showMsg('in-msg', e.message || 'Incorrect email or password.');
    btn.disabled = false; btn.firstChild.textContent = 'Sign In ';
  });`;

const NEW = `_auth.signInWithEmailAndPassword(email, pass).then(function() {
    window.location.href = 'index.html';
  }).catch(function(e) {
    showMsg('in-msg', e.message || 'Incorrect email or password.');
    btn.disabled = false; btn.firstChild.textContent = 'Sign In ';
  });`;

if (h.includes('_auth.signInWithEmailAndPassword')) {
  // Find and replace the sign-in block by line scanning
  const lines = h.split('\n');
  let start = -1, depth = 0, inBlock = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('signInWithEmailAndPassword') && lines[i].includes('email, pass')) {
      start = i;
      inBlock = true;
    }
    if (inBlock) {
      for (const c of lines[i]) {
        if (c === '(') depth++;
        else if (c === ')') depth--;
      }
      if (start !== -1 && depth <= 0 && i > start) {
        // Replace these lines
        const newLines = [
          "  _auth.signInWithEmailAndPassword(email, pass).then(function() {",
          "    window.location.href = 'index.html';",
          "  }).catch(function(e) {",
          "    showMsg('in-msg', e.message || 'Incorrect email or password.');",
          "    btn.disabled = false; btn.firstChild.textContent = 'Sign In ';",
          "  });"
        ];
        lines.splice(start, i - start + 1, ...newLines);
        console.log('Sign-in block replaced at line', start + 1);
        break;
      }
    }
  }
  h = lines.join('\n');
}

// Also fix the onAuthStateChanged to not call Firestore
h = h.replace(
  /_db\.collection\('users'\)\.doc\(user\.uid\)\.get\(\)\.then\(function\(doc\)\s*\{[\s\S]*?\}\)\.catch[\s\S]*?\}\);/,
  "// Skip Firestore check on login — handled by index.html\n      window.location.href = 'index.html';"
);

fs.writeFileSync('login.html', h);
console.log('done');
