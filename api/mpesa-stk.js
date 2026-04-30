
const _reqMap = {};
function rateLimit(ip, max=10, windowMs=60000){
  const now = Date.now();
  _reqMap[ip] = (_reqMap[ip] || []).filter(t => now - t < windowMs);
  if(_reqMap[ip].length >= max) return false;
  _reqMap[ip].push(now);
  return true;
}

// api/mpesa-stk.js
// Vercel serverless function — handles M-Pesa STK Push

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!rateLimit(ip)) return res.status(429).json({ error: 'Too many requests. Try again in a minute.' });

  try {
    const { phone, listing_id, user_id, amount = 250 } = req.body;

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 100000) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!phone || !listing_id || !user_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Format phone: 0712345678 → 254712345678
    const formattedPhone = phone.startsWith('0')
      ? '254' + phone.slice(1)
      : phone.startsWith('+254')
      ? phone.slice(1)
      : phone;

    const CONSUMER_KEY    = process.env.MPESA_CONSUMER_KEY;
    const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
    const SHORTCODE       = process.env.MPESA_SHORTCODE;
    const PASSKEY         = process.env.MPESA_PASSKEY;
    const CALLBACK_URL    = process.env.MPESA_CALLBACK_URL;
    const IS_LIVE         = process.env.MPESA_ENV === 'live';

    const BASE_URL = IS_LIVE
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';

    // Step 1: Get OAuth token
    const authString = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    const tokenRes = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${authString}` }
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.status(500).json({ error: 'Failed to get M-Pesa token. Check your consumer key/secret.' });
    }

    // Step 2: Generate timestamp & password
    const now = new Date();
    const timestamp =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');

    const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

    // Step 3: Send STK Push
    const stkRes = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        BusinessShortCode: SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: parsedAmount,
        PartyA: formattedPhone,
        PartyB: SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: CALLBACK_URL,
        AccountReference: `NestFinder-${listing_id.slice(0, 8)}`,
        TransactionDesc: `NestFinder CUK viewing fee Ksh ${amount}`
      })
    });

    const stkData = await stkRes.json();

    if (stkData.ResponseCode === '0') {
      return res.status(200).json({
        success: true,
        checkout_request_id: stkData.CheckoutRequestID,
        message: 'STK push sent. Enter your M-Pesa PIN on your phone.'
      });
    } else {
      return res.status(400).json({
        error: stkData.errorMessage || stkData.ResponseDescription || 'STK push failed'
      });
    }

  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
