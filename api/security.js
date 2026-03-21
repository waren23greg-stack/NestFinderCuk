// api/security.js — Cryptographic security for NestFinder CUK API
const crypto = require('crypto');

// 1. HMAC Request Signing
function verifyHMAC(req) {
  const secret = process.env.API_SECRET;
  if (!secret) return { ok: true };
  const ts = req.headers['x-timestamp'];
  const sig = req.headers['x-signature'];
  if (!ts || !sig) return { ok: false, reason: 'Missing X-Timestamp or X-Signature' };
  const age = Date.now() - parseInt(ts);
  if (isNaN(age) || age > 300000 || age < -10000) return { ok: false, reason: 'Request expired' };
  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  const payload = `${req.method}:${req.url}:${ts}:${body}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  try {
    const sigBuf = Buffer.from(sig.padEnd(64, '0'), 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length) return { ok: false, reason: 'Invalid signature' };
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return { ok: false, reason: 'Signature mismatch' };
  } catch(e) { return { ok: false, reason: 'Signature parse error' }; }
  return { ok: true };
}

// 2. M-Pesa Callback IP Whitelist
const MPESA_IPS = new Set([
  '196.201.214.200','196.201.214.206','196.201.213.114',
  '196.201.214.207','196.201.214.208','196.201.213.44',
  '196.201.212.127','196.201.212.128','196.201.212.129',
  '196.201.212.132','196.201.212.136','196.201.212.138',
  '::1','127.0.0.1'
]);
function verifyMpesaIP(req) {
  if (process.env.MPESA_ENV !== 'live') return { ok: true };
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
  if (!MPESA_IPS.has(ip)) return { ok: false, reason: `Unauthorized IP: ${ip}` };
  return { ok: true };
}

// 3. Payment Token Signing — prevents forged payment confirmations
function signPaymentId(paymentId) {
  const secret = process.env.API_SECRET || 'nestfinder-dev-secret-change-in-prod';
  return crypto.createHmac('sha256', secret).update(String(paymentId)).digest('hex').slice(0, 32);
}
function verifyPaymentToken(paymentId, token) {
  if (!token) return false;
  const expected = signPaymentId(paymentId);
  try {
    const expBuf = Buffer.from(expected, 'hex');
    const tokBuf = Buffer.from(token, 'hex');
    if (tokBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(tokBuf, expBuf);
  } catch(e) { return false; }
}

// 4. Input Sanitization — strips XSS, SQL injection attempts
function sanitizeInput(obj, depth = 0) {
  if (depth > 4) return {};
  if (typeof obj === 'string') {
    return obj
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/gi, '')
      .trim().slice(0, 2000);
  }
  if (typeof obj === 'number') return isFinite(obj) ? obj : 0;
  if (typeof obj === 'boolean') return obj;
  if (Array.isArray(obj)) return obj.slice(0, 50).map(i => sanitizeInput(i, depth + 1));
  if (obj && typeof obj === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      const key = k.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 50);
      if (key) clean[key] = sanitizeInput(v, depth + 1);
    }
    return clean;
  }
  return null;
}

// 5. Rate Limiting — sliding window per IP
const _rateMap = new Map();
function rateLimit(ip, max = 20, windowMs = 60000) {
  const now = Date.now();
  const key = ip || 'unknown';
  const hits = (_rateMap.get(key) || []).filter(t => now - t < windowMs);
  if (hits.length >= max) return false;
  hits.push(now);
  _rateMap.set(key, hits);
  if (_rateMap.size > 500) {
    for (const [k, v] of _rateMap)
      if (v.every(t => now - t > windowMs)) _rateMap.delete(k);
  }
  return true;
}

// 6. CORS — locked to your Vercel domain
function setCORSHeaders(res) {
  const origin = process.env.ALLOWED_ORIGIN || 'https://nest-finder-cuk.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Timestamp, X-Signature');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store');
}

// 7. Master middleware wrapper
function withSecurity(handler, opts = {}) {
  const { mpesaCallback = false, rateMax = 20, skipHMAC = true } = opts;
  return async function(req, res) {
    setCORSHeaders(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.socket?.remoteAddress || 'unknown';
    if (!rateLimit(ip, rateMax)) {
      return res.status(429).json({ error: 'Too many requests. Try again in a minute.' });
    }
    if (mpesaCallback) {
      const c = verifyMpesaIP(req);
      if (!c.ok) { console.error('[Security] M-Pesa IP blocked:', c.reason); return res.status(403).json({ error: 'Forbidden' }); }
    }
    if (!skipHMAC) {
      const h = verifyHMAC(req);
      if (!h.ok) { console.error('[Security] HMAC failed:', h.reason); return res.status(401).json({ error: 'Invalid signature' }); }
    }
    if (req.body && typeof req.body === 'object') req.body = sanitizeInput(req.body);
    return handler(req, res);
  };
}

module.exports = { withSecurity, verifyHMAC, verifyMpesaIP, signPaymentId, verifyPaymentToken, sanitizeInput, rateLimit, setCORSHeaders };
