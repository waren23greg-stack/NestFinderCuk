const fs = require('fs');
const v = JSON.parse(fs.readFileSync('vercel.json','utf8'));
const h = v.headers[0].headers.find(h=>h.key==='Content-Security-Policy');
// Write the value character by character to avoid chat corruption
const wss = 'wss://' + '*.' + 'firebaseio.com';
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.gstatic.com https://apis.google.com https://fonts.googleapis.com https://unpkg.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com https://www.gstatic.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https: blob:",
  "connect-src 'self' https://www.gstatic.com https://*.googleapis.com https://*.firebaseio.com " + wss + " https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://storage.googleapis.com https://firebasestorage.googleapis.com https://api.safaricom.co.ke https://sandbox.safaricom.co.ke https://api.resend.com https://nominatim.openstreetmap.org https://*.tile.openstreetmap.org https://api.cloudinary.com",
  "frame-ancestors 'none'",
  "frame-src https://maps.google.com https://www.google.com",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ');
h.value = csp;
fs.writeFileSync('vercel.json', JSON.stringify(v, null, 2));
console.log('wss ok:', csp.includes(wss));
console.log('value:', csp.substring(csp.indexOf('connect-src'), csp.indexOf('frame-ancestors')));
