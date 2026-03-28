// api/generate-promo.js
// Called by admin.html when a payment is confirmed
// Generates a unique NEST-XXXXXX promo code tied to the user
// Security: verifies payment is genuinely confirmed before generating

const SB_URL = 'https://mtycapgbtvpczvswpjpo.supabase.co';
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // server-only, never exposed to browser

function serviceHeaders() {
  return {
    'apikey': SB_SERVICE_KEY,
    'Authorization': `Bearer ${SB_SERVICE_KEY}`,
    'Content-Type': 'application/json'
  };
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0,O,I,1 to avoid confusion
  let code = 'NEST-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { payment_id } = req.body;

    if (!payment_id) {
      return res.status(400).json({ error: 'payment_id required' });
    }

    if (!SB_SERVICE_KEY) {
      return res.status(500).json({ error: 'Server misconfigured: SUPABASE_SERVICE_KEY not set' });
    }

    // ── STEP 1: Verify the payment is genuinely confirmed in the DB ──
    // We use the service key (server-side only) so this cannot be faked client-side
    const payRes = await fetch(
      `${SB_URL}/rest/v1/payments?id=eq.${payment_id}&select=id,status,user_id,listing_id,amount`,
      { headers: serviceHeaders() }
    );
    const payments = await payRes.json();
    const payment = Array.isArray(payments) && payments.length > 0 ? payments[0] : null;

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    if (payment.status !== 'confirmed') {
      return res.status(403).json({ error: 'Payment is not confirmed — cannot generate promo code' });
    }
    if (payment.amount < 250) {
      return res.status(403).json({ error: 'Payment amount too low for promo code' });
    }

    // ── STEP 2: Check if a promo code already exists for this payment ──
    // Prevents duplicate codes if admin accidentally confirms twice
    const existRes = await fetch(
      `${SB_URL}/rest/v1/promo_codes?listing_id=eq.${payment.listing_id}&owner_user_id=eq.${payment.user_id}&select=code`,
      { headers: serviceHeaders() }
    );
    const existing = await existRes.json();
    if (Array.isArray(existing) && existing.length > 0) {
      // Already generated — return the existing code
      return res.status(200).json({ code: existing[0].code, already_existed: true });
    }

    // ── STEP 3: Generate a unique code (retry up to 5 times on collision) ──
    let code = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateCode();
      // Check uniqueness
      const checkRes = await fetch(
        `${SB_URL}/rest/v1/promo_codes?code=eq.${candidate}&select=id`,
        { headers: serviceHeaders() }
      );
      const checkData = await checkRes.json();
      if (!Array.isArray(checkData) || checkData.length === 0) {
        code = candidate;
        break;
      }
    }

    if (!code) {
      return res.status(500).json({ error: 'Could not generate a unique code — try again' });
    }

    // ── STEP 4: Save the promo code ──
    const saveRes = await fetch(`${SB_URL}/rest/v1/promo_codes`, {
      method: 'POST',
      headers: { ...serviceHeaders(), 'Prefer': 'return=representation' },
      body: JSON.stringify({
        code,
        owner_user_id: payment.user_id,
        listing_id: payment.listing_id,
        is_used: false
      })
    });

    if (!saveRes.ok) {
      const err = await saveRes.json().catch(() => ({}));
      return res.status(500).json({ error: 'Failed to save promo code', detail: err });
    }

    return res.status(200).json({ code, already_existed: false });

  } catch (err) {
    console.error('generate-promo error:', err);
    return res.status(500).json({ error: err.message });
  }
};
