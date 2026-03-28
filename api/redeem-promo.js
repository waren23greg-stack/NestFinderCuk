// api/redeem-promo.js
// Called when a student enters a promo code instead of paying
// Security: all validation server-side using service key

const SB_URL = 'https://mtycapgbtvpczvswpjpo.supabase.co';
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

function serviceHeaders() {
  return {
    'apikey': SB_SERVICE_KEY,
    'Authorization': `Bearer ${SB_SERVICE_KEY}`,
    'Content-Type': 'application/json'
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { code, user_id, listing_id } = req.body;

    if (!code || !user_id || !listing_id) {
      return res.status(400).json({ error: 'code, user_id, and listing_id are required' });
    }

    if (!SB_SERVICE_KEY) {
      return res.status(500).json({ error: 'Server misconfigured: SUPABASE_SERVICE_KEY not set' });
    }

    const cleanCode = code.trim().toUpperCase();

    // ── STEP 1: Look up the promo code ──
    const codeRes = await fetch(
      `${SB_URL}/rest/v1/promo_codes?code=eq.${encodeURIComponent(cleanCode)}&select=*`,
      { headers: serviceHeaders() }
    );
    const codes = await codeRes.json();
    const promo = Array.isArray(codes) && codes.length > 0 ? codes[0] : null;

    if (!promo) {
      return res.status(404).json({ error: 'Invalid promo code. Please check and try again.' });
    }

    // ── STEP 2: Validate the code ──
    if (promo.is_used) {
      return res.status(409).json({ error: 'This promo code has already been used.' });
    }

    // Prevent self-referral
    if (promo.owner_user_id === user_id) {
      return res.status(403).json({ error: "You can't use your own promo code." });
    }

    // Check if user already has access to this listing (paid or used promo before)
    const existingPayRes = await fetch(
      `${SB_URL}/rest/v1/payments?user_id=eq.${user_id}&listing_id=eq.${listing_id}&status=eq.confirmed&select=id`,
      { headers: serviceHeaders() }
    );
    const existingPays = await existingPayRes.json();
    if (Array.isArray(existingPays) && existingPays.length > 0) {
      return res.status(409).json({ error: 'You already have access to this listing.' });
    }

    // ── STEP 3: Mark code as used ──
    const updateRes = await fetch(
      `${SB_URL}/rest/v1/promo_codes?id=eq.${promo.id}`,
      {
        method: 'PATCH',
        headers: { ...serviceHeaders(), 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          is_used: true,
          used_by_user_id: user_id,
          used_at: new Date().toISOString()
        })
      }
    );

    if (!updateRes.ok) {
      return res.status(500).json({ error: 'Failed to mark code as used' });
    }

    // ── STEP 4: Create a confirmed payment record for the friend (Ksh 0) ──
    // This lets the existing contact-unlock flow work without any other changes
    const payRes = await fetch(`${SB_URL}/rest/v1/payments`, {
      method: 'POST',
      headers: { ...serviceHeaders(), 'Prefer': 'return=representation' },
      body: JSON.stringify({
        user_id,
        listing_id,
        phone: '',
        amount: 0,
        status: 'confirmed',
        mpesa_ref: 'PROMO-' + cleanCode
      })
    });

    if (!payRes.ok) {
      // Rollback: un-mark the code as used
      await fetch(`${SB_URL}/rest/v1/promo_codes?id=eq.${promo.id}`, {
        method: 'PATCH',
        headers: { ...serviceHeaders(), 'Prefer': 'return=minimal' },
        body: JSON.stringify({ is_used: false, used_by_user_id: null, used_at: null })
      });
      return res.status(500).json({ error: 'Failed to create payment record' });
    }

    // ── STEP 5: Fetch caretaker contact to return ──
    const ctRes = await fetch(
      `${SB_URL}/rest/v1/caretaker_contacts?listing_id=eq.${listing_id}&select=caretaker_name,phone`,
      { headers: serviceHeaders() }
    );
    const ctData = await ctRes.json();
    const contact = Array.isArray(ctData) && ctData.length > 0 ? ctData[0] : null;

    return res.status(200).json({
      success: true,
      contact,
      message: 'Promo code accepted! Contact unlocked for free.'
    });

  } catch (err) {
    console.error('redeem-promo error:', err);
    return res.status(500).json({ error: err.message });
  }
};
