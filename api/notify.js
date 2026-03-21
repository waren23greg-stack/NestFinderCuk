const { withSecurity } = require('./security');

async function handler(req, res) {
  const { student_name, listing_title, mpesa_ref, amount = 250, payment_id } = req.body;
  const RESEND_KEY = process.env.RESEND_API_KEY;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'waren23greg@gmail.com';

  if (!RESEND_KEY) return res.status(200).json({ sent: false, reason: 'RESEND_API_KEY not set' });
  if (!mpesa_ref) return res.status(400).json({ error: 'Missing mpesa_ref' });

  const adminUrl = `https://nest-finder-cuk.vercel.app/admin.html`;
  const html = `
  <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;background:#fdf9f4;padding:32px;border:1px solid #e8dfd0;">
    <h2 style="color:#16130E;font-size:1.4rem;margin-bottom:4px;">New Payment Received</h2>
    <p style="color:#8a7560;font-size:.85rem;margin-bottom:24px;">NestFinder CUK · Admin Notification</p>
    <table style="width:100%;border-collapse:collapse;font-size:.9rem;">
      <tr><td style="padding:8px 0;color:#8a7560;width:140px;">Student</td><td style="padding:8px 0;color:#16130E;font-weight:500;">${student_name}</td></tr>
      <tr><td style="padding:8px 0;color:#8a7560;">Listing</td><td style="padding:8px 0;color:#16130E;">${listing_title}</td></tr>
      <tr><td style="padding:8px 0;color:#8a7560;">M-Pesa Ref</td><td style="padding:8px 0;color:#16130E;font-family:monospace;">${mpesa_ref}</td></tr>
      <tr><td style="padding:8px 0;color:#8a7560;">Amount</td><td style="padding:8px 0;color:#16130E;">Ksh ${amount}</td></tr>
      <tr><td style="padding:8px 0;color:#8a7560;">Payment ID</td><td style="padding:8px 0;color:#16130E;font-family:monospace;font-size:.78rem;">${payment_id}</td></tr>
    </table>
    <div style="margin-top:24px;">
      <a href="${adminUrl}" style="background:#16130E;color:#d4a96a;padding:12px 24px;text-decoration:none;font-size:.8rem;letter-spacing:.1em;">CONFIRM IN ADMIN PANEL →</a>
    </div>
    <p style="margin-top:24px;font-size:.75rem;color:#b0a090;">NestFinder CUK · Trinity · Nairobi</p>
  </div>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'NestFinder CUK <onboarding@resend.dev>',
        to: ADMIN_EMAIL,
        subject: `Payment received: Ksh ${amount} — ${listing_title}`,
        html
      })
    });
    const result = await r.json();
    return res.status(200).json({ sent: true, id: result.id });
  } catch(e) {
    console.error('[notify] Email error:', e.message);
    return res.status(500).json({ error: 'Email failed' });
  }
}

module.exports = withSecurity(handler, { rateMax: 30 });
