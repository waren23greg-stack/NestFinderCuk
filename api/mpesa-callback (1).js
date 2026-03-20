// api/mpesa-callback.js
// Safaricom calls this URL when payment is confirmed or fails

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const result = req.body?.Body?.stkCallback;

    if (!result) {
      return res.status(400).json({ error: 'Invalid callback body' });
    }

    const checkoutRequestId = result.CheckoutRequestID;
    const resultCode = result.ResultCode;

    const sb = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    if (resultCode === 0) {
      // Payment successful
      const items = result.CallbackMetadata?.Item || [];
      const get = (name) => items.find(i => i.Name === name)?.Value;

      const mpesaRef = get('MpesaReceiptNumber');
      const amount   = get('Amount');

      await sb.from('payments')
        .update({ status: 'confirmed', mpesa_ref: mpesaRef, amount })
        .eq('checkout_request_id', checkoutRequestId);

      console.log(`✅ Payment confirmed: ${mpesaRef} — Ksh ${amount}`);

    } else {
      // Failed or cancelled
      await sb.from('payments')
        .update({ status: 'failed' })
        .eq('checkout_request_id', checkoutRequestId);

      console.log(`❌ Payment failed: ${result.ResultDesc}`);
    }

    // Always respond 200 to Safaricom
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });

  } catch (err) {
    console.error('Callback error:', err);
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}
