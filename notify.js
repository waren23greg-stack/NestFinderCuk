// api/notify.js
// Sends email notification to admin when a student submits a payment
// Uses Resend (free tier: 100 emails/day) — sign up at resend.com

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { student_name, listing_title, mpesa_ref, amount = 250, payment_id } = req.body;
    const RESEND_KEY = process.env.RESEND_API_KEY;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'waren23greg@gmail.com';

    if (!RESEND_KEY) {
      // Silently skip if Resend not configured yet
      return res.status(200).json({ sent: false, reason: 'RESEND_API_KEY not set' });
    }

    const adminUrl = `https://nest-finder-cuk.vercel.app/admin.html`;
    const waUrl = `https://wa.me/254704285315?text=Payment+confirmed+for+${encodeURIComponent(listing_title)}`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><style>
  body{font-family:'Helvetica Neue',Arial,sans-serif;background:#F8F4EE;margin:0;padding:0;}
  .wrap{max-width:560px;margin:2rem auto;background:#fff;border:1px solid rgba(184,149,90,.2);}
  .header{background:#16130E;padding:2rem 2rem 1.5rem;border-bottom:3px solid #B8955A;}
  .logo{font-size:1.2rem;color:#fff;letter-spacing:.02em;}
  .logo b{color:#D4B483;}
  .badge{display:inline-block;margin-top:.5rem;padding:3px 10px;background:rgba(184,149,90,.15);color:#D4B483;font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;border:1px solid rgba(184,149,90,.3);}
  .body{padding:2rem;}
  .alert{background:#FEF3D6;border-left:3px solid #B8955A;padding:1rem 1.25rem;margin-bottom:1.5rem;font-size:.88rem;color:#7A5A1E;}
  .row{display:flex;justify-content:space-between;padding:.65rem 0;border-bottom:1px solid #F0E8DC;font-size:.85rem;}
  .row:last-child{border-bottom:none;}
  .lbl{color:#8A8070;font-size:.78rem;text-transform:uppercase;letter-spacing:.08em;}
  .val{font-weight:500;color:#16130E;}
  .ref{font-family:monospace;font-size:1rem;color:#16130E;letter-spacing:.06em;}
  .cta{display:block;margin:1.5rem 0 .75rem;padding:14px 24px;background:#16130E;color:#fff;text-decoration:none;text-align:center;font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;}
  .wa{display:block;padding:12px 24px;background:#25D366;color:#fff;text-decoration:none;text-align:center;font-size:.78rem;letter-spacing:.1em;text-transform:uppercase;}
  .footer{padding:1rem 2rem;background:#F8F4EE;border-top:1px solid rgba(184,149,90,.1);font-size:.72rem;color:#8A8070;text-align:center;}
</style></head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo">Nest<b>Finder</b> CUK</div>
    <div class="badge">New Payment Submitted</div>
  </div>
  <div class="body">
    <div class="alert">
      A student has paid Ksh ${amount} and is waiting for you to confirm their contact.
    </div>
    <div class="row"><span class="lbl">Student</span><span class="val">${student_name || 'Unknown'}</span></div>
    <div class="row"><span class="lbl">Listing</span><span class="val">${listing_title || '—'}</span></div>
    <div class="row"><span class="lbl">Amount</span><span class="val">Ksh ${amount}</span></div>
    <div class="row"><span class="lbl">M-Pesa Code</span><span class="ref">${mpesa_ref}</span></div>
    <div class="row"><span class="lbl">Payment ID</span><span class="val" style="font-size:.72rem;color:#8A8070;">${payment_id}</span></div>
    <br/>
    <a href="${adminUrl}" class="cta">Open Admin Panel — Confirm Payment</a>
    <a href="${waUrl}" class="wa">Send WhatsApp Confirmation</a>
  </div>
  <div class="footer">NestFinder CUK · nest-finder-cuk.vercel.app · +254 704 285 315</div>
</div>
</body>
</html>`;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'NestFinder CUK <notifications@nestfinder.co.ke>',
        to: [ADMIN_EMAIL],
        subject: `💰 New Payment — ${student_name} paid Ksh ${amount} for ${listing_title}`,
        html
      })
    });

    const result = await emailRes.json();
    if (result.id) {
      return res.status(200).json({ sent: true, id: result.id });
    } else {
      console.error('Resend error:', result);
      return res.status(200).json({ sent: false, error: result });
    }

  } catch (err) {
    console.error('Notify error:', err);
    return res.status(200).json({ sent: false, error: err.message });
  }
};
