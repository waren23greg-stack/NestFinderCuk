// netlify/functions/mpesa-stk.js
// Netlify serverless function — handles M-Pesa STK Push

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { phone, listing_id, user_id, amount = 250 } = JSON.parse(event.body);

    if (!phone || !listing_id || !user_id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
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
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to get M-Pesa token' }) };
    }

    // Step 2: Generate timestamp & password
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
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
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: CALLBACK_URL,
        AccountReference: `NestFinder-${listing_id.slice(0, 8)}`,
        TransactionDesc: `NestFinder CUK viewing fee - Ksh ${amount}`
      })
    });

    const stkData = await stkRes.json();

    if (stkData.ResponseCode === '0') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          checkout_request_id: stkData.CheckoutRequestID,
          message: 'STK push sent. Check your phone.'
        })
      };
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: stkData.errorMessage || stkData.ResponseDescription || 'STK push failed' })
      };
    }

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error: ' + err.message })
    };
  }
};
