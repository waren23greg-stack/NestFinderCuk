// api/notify-student.js
// Sends email to student when their caretaker contact is unlocked

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { user_id, listing_title, listing_location, caretaker_name, caretaker_phone } = req.body;
    const RESEND_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_KEY || !user_id) {
      return res.status(200).json({ sent: false, reason: 'Missing config or user_id' });
    }

    // Get student email from Supabase
    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { data: profile } = await sb.from('profiles').select('full_name').eq('id', user_id).single();
    const { data: authUser } = await sb.auth.admin.getUserById(user_id);
    const email = authUser?.user?.email;
    if (!email) return res.status(200).json({ sent: false, reason: 'No email found' });

    const name = profile?.full_name?.split(' ')[0] || 'Student';
    const waUrl = `https://wa.me/${caretaker_phone?.replace(/\D/g,'').replace(/^0/,'254')}?text=${encodeURIComponent(`Hello ${caretaker_name}, I found your listing on NestFinder CUK (${listing_title}) and I would like to arrange a viewing. When would be convenient?`)}`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><style>
  body{font-family:'Helvetica Neue',Arial,sans-serif;background:#F8F4EE;margin:0;padding:0;}
  .wrap{max-width:520px;margin:2rem auto;background:#fff;border:1px solid rgba(184,149,90,.2);}
  .header{background:#16130E;padding:2rem 2rem 1.5rem;border-bottom:3px solid #B8955A;}
  .logo{font-size:1.2rem;color:#fff;letter-spacing:.02em;}
  .logo b{color:#D4B483;}
  .badge{display:inline-block;margin-top:.5rem;padding:3px 10px;background:rgba(29,158,117,.2);color:#9FE1CB;font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;border:1px solid rgba(29,158,117,.3);}
  .body{padding:2rem;}
  .greeting{font-size:1rem;color:#16130E;margin-bottom:1rem;font-weight:500;}
  .contact-card{background:#F8F4EE;border:1px solid rgba(184,149,90,.2);border-left:4px solid #B8955A;padding:1.25rem 1.5rem;margin:1.25rem 0;}
  .ct-label{font-size:.65rem;letter-spacing:.16em;text-transform:uppercase;color:#8A8070;margin-bottom:.35rem;}
  .ct-name{font-size:1rem;font-weight:600;color:#16130E;margin-bottom:.2rem;}
  .ct-phone{font-size:1.6rem;font-weight:300;color:#16130E;letter-spacing:.06em;font-family:Georgia,serif;}
  .row{display:flex;justify-content:space-between;padding:.6rem 0;border-bottom:1px solid #F0E8DC;font-size:.84rem;}
  .lbl{color:#8A8070;}
  .val{font-weight:500;color:#16130E;}
  .cta{display:block;margin:1.5rem 0 .75rem;padding:14px 24px;background:#16130E;color:#fff;text-decoration:none;text-align:center;font-size:.78rem;letter-spacing:.1em;text-transform:uppercase;}
  .wa{display:block;padding:12px 24px;background:#25D366;color:#fff;text-decoration:none;text-align:center;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;}
  .note{font-size:.75rem;color:#8A8070;margin-top:1.25rem;line-height:1.7;}
  .footer{padding:1rem 2rem;background:#F8F4EE;border-top:1px solid rgba(184,149,90,.1);font-size:.7rem;color:#8A8070;text-align:center;}
</style></head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo">Nest<b>Finder</b> CUK</div>
    <div class="badge">Contact Unlocked</div>
  </div>
  <div class="body">
    <div class="greeting">Hi ${name} 👋</div>
    <p style="font-size:.88rem;color:#4A4438;line-height:1.7;">Your payment has been confirmed. Here is the caretaker's contact for <strong>${listing_title}</strong>:</p>
    <div class="contact-card">
      <div class="ct-label">Caretaker</div>
      <div class="ct-name">${caretaker_name}</div>
      <div class="ct-phone">${caretaker_phone}</div>
    </div>
    <div class="row"><span class="lbl">Listing</span><span class="val">${listing_title}</span></div>
    <div class="row"><span class="lbl">Location</span><span class="val">${listing_location}</span></div>
    <br/>
    <a href="tel:${(caretaker_phone||'').replace(/\s/g,'')}" class="cta">📞 Call ${caretaker_name}</a>
    <a href="${waUrl}" class="wa">💬 WhatsApp ${caretaker_name}</a>
    <p class="note">
      <strong>Next steps:</strong> Call or WhatsApp the caretaker to arrange a convenient time to view the house. Always bring a trusted friend when viewing. Never pay any deposit before signing a rental agreement.<br/><br/>
      Need help? <a href="https://wa.me/254704285315" style="color:#B8955A;">WhatsApp admin on 0704 285 315</a>
    </p>
  </div>
  <div class="footer">NestFinder CUK · nest-finder-cuk.vercel.app · 0704 285 315</div>
</div>
</body>
</html>`;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'NestFinder CUK <warengrege@gmail.com>',
        to: [email],
        subject: `🏠 Contact Unlocked — ${caretaker_name} · ${listing_title}`,
        html
      })
    });

    const result = await emailRes.json();
    return res.status(200).json({ sent: !!result.id });

  } catch (err) {
    console.error('Notify student error:', err);
    return res.status(200).json({ sent: false, error: err.message });
  }
};
