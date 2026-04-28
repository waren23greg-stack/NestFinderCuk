const fs = require('fs');
let html = fs.readFileSync('login.html', 'utf8');

// ── Block 1: find by unique string inside the block ──
const b1Unique = 'SUPABASE INLINE CLIENT';
let b1ScriptStart = -1;
let pos = 0;
while (true) {
  let idx = html.indexOf('<script>', pos);
  if (idx === -1) break;
  let end = html.indexOf('</script>', idx);
  if (html.slice(idx, end).includes(b1Unique)) { b1ScriptStart = idx; break; }
  pos = idx + 1;
}
if (b1ScriptStart === -1) { console.error('Block 1 not found'); process.exit(1); }
const b1End = html.indexOf('</script>', b1ScriptStart) + '</script>'.length;

const fb = 'https://www.gstatic.com/firebasejs/10.12.0';
const sdkTags = [
  `<script src="${fb}/firebase-app-compat.js"></script>`,
  `<script src="${fb}/firebase-auth-compat.js"></script>`,
  `<script src="${fb}/firebase-firestore-compat.js"></script>`,
  `<script src="${fb}/firebase-storage-compat.js"></script>`,
  `<script src="sb-client.js"></script>`,
  `<script src="firebase-config.js"></script>`
].join('\n');

html = html.slice(0, b1ScriptStart) + sdkTags + html.slice(b1End);
console.log('Block 1 replaced');

// ── Block 2: find by Supabase auth fetch pattern ──
let b2Start = -1;
pos = 0;
while (true) {
  let idx = html.indexOf('<script>', pos);
  if (idx === -1) break;
  let end = html.indexOf('</script>', idx);
  let chunk = html.slice(idx, end);
  if (chunk.includes('/auth/v1/token') || chunk.includes('mtycapgbtvpczvswpjpo') || chunk.includes('window.SB_URL')) {
    b2Start = idx; break;
  }
  pos = idx + 1;
}
if (b2Start === -1) { console.error('Block 2 not found'); process.exit(1); }
const b2End = html.indexOf('</script>', b2Start) + '</script>'.length;

const newBlock2 = `<script>
const _auth = firebase.auth();
const _db   = firebase.firestore();

async function getCurrentUser() {
  return new Promise(resolve => {
    _auth.onAuthStateChanged(async user => {
      if (!user) { resolve(null); return; }
      try {
        const doc = await _db.collection('users').doc(user.uid).get();
        resolve({ id: user.uid, email: user.email, ...(doc.exists ? doc.data() : {}) });
      } catch(e) { resolve({ id: user.uid, email: user.email }); }
    });
  });
}

async function checkAlreadyLoggedIn() {
  const user = await getCurrentUser();
  if (!user) return;
  window.location.href = (user.role === 'admin') ? 'admin.html' : 'index.html';
}
checkAlreadyLoggedIn();

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  const btn   = document.getElementById('login-btn');
  showMsg('in-msg', '');
  if (!email || !pass) { showMsg('in-msg', 'Please enter email and password.'); return; }
  btn.disabled = true; btn.textContent = 'Signing in\u2026';
  try {
    const cred = await _auth.signInWithEmailAndPassword(email, pass);
    const doc  = await _db.collection('users').doc(cred.user.uid).get();
    const role = doc.exists ? (doc.data().role || 'student') : 'student';
    window.location.href = role === 'admin' ? 'admin.html' : 'index.html';
  } catch(e) {
    showMsg('in-msg', e.message || 'Incorrect email or password.');
    btn.disabled = false; btn.textContent = 'Sign In';
  }
}

async function doRegister() {
  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass  = document.getElementById('reg-pass').value;
  const pass2 = document.getElementById('reg-pass2').value;
  const btn   = document.getElementById('reg-btn');
  showMsg('reg-msg', '');
  if (!name || !email || !pass) { showMsg('reg-msg', 'All fields are required.'); return; }
  if (pass !== pass2) { showMsg('reg-msg', 'Passwords do not match.'); return; }
  if (pass.length < 6) { showMsg('reg-msg', 'Password must be at least 6 characters.'); return; }
  btn.disabled = true; btn.textContent = 'Creating account\u2026';
  try {
    const cred = await _auth.createUserWithEmailAndPassword(email, pass);
    await _db.collection('users').doc(cred.user.uid).set({
      uid: cred.user.uid,
      email: email,
      display_name: name,
      role: 'student',
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    window.location.href = 'index.html';
  } catch(e) {
    showMsg('reg-msg', e.message || 'Registration failed.');
    btn.disabled = false; btn.textContent = 'Create Account';
  }
}

async function doForgot() {
  const email = document.getElementById('forgot-email').value.trim();
  showMsg('forgot-msg', '');
  if (!email) { showMsg('forgot-msg', 'Enter your email address.'); return; }
  try {
    await _auth.sendPasswordResetEmail(email);
    showMsg('forgot-msg', 'Reset email sent \u2014 check your inbox.');
  } catch(e) {
    showMsg('forgot-msg', e.message || 'Could not send reset email.');
  }
}

function showMsg(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}
</script>`;

html = html.slice(0, b2Start) + newBlock2 + html.slice(b2End);
console.log('Block 2 replaced');

fs.writeFileSync('login.html', html);
console.log('login.html updated successfully');
