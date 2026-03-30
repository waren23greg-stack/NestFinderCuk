// api/notify-mover.js
// Sends email confirmation to student when they book a Trinity Movers move

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, email, phone, pickup, dropoff, pickup_zone, dropoff_zone, move_date, tier, price, notes } = req.body;
    const RESEND_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_KEY || !email) {
      return res.status(200).json({ sent: false, reason: 'Missing config or email' });
    }

    const firstName = name?.split(' ')[0] || 'Student';
    const dateFormatted = move_date ? new Date(move_date).toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : move_date;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><style>
  body{font-family:'Helvetica Neue',Arial,sans-serif;background:#F8F4EE;margin:0;padding:0;}
  .wrap{max-width:520px;margin:2rem auto;background:#fff;border:1px solid rgba(184,149,90,.2);}
  .header{background:#16130E;padding:2rem 2rem 1.5rem;border-bottom:3px solid #B8955A;}
  .logo{font-size:1.2rem;color:#fff;letter-spacing:.02em;}
  .logo b{color:#D4B483;}
  .badge{display:inline-block;margin-top:.5rem;padding:3px 10px;background:rgba(184,149,90,.15);color:#D4B483;font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;border:1px solid rgba(184,149,90,.3);}
  .body{padding:2rem;}
  .greeting{font-size:1rem;color:#16130E;margin-bottom:1rem;font-weight:500;}
  .move-card{background:#F8F4EE;border:1px solid rgba(184,149,90,.2);border-left:4px solid #B8955A;padding:1.25rem 1.5rem;margin:1.25rem 0;}
  .row{display:flex;justify-content:space-between;padding:.6rem 0;border-bottom:1px solid #F0E8DC;font-size:.84rem;}
  .row:last-child{border-bottom:none;}
  .lbl{color:#8A8070;}
  .val{font-weight:500;color:#16130E;text-align:right;max-width:60%;}
  .price-row{display:flex;justify-content:space-between;padding:.75rem 0;font-size:1rem;}
  .price-val{font-family:Georgia,serif;font-size:1.4rem;color:#B8955A;font-weight:300;}
  .cta{display:block;margin:1.5rem 0 .75rem;padding:14px 24px;background:#16130E;color:#fff;text-decoration:none;text-align:center;font-size:.78rem;letter-spacing:.1em;text-transform:uppercase;}
  .wa{display:block;padding:12px 24px;background:#25D366;color:#fff;text-decoration:none;text-align:center;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;}
  .note{font-size:.75rem;color:#8A8070;margin-top:1.25rem;line-height:1.7;}
  .footer{padding:1rem 2rem;background:#F8F4EE;border-top:1px solid rgba(184,149,90,.1);font-size:.7rem;color:#8A8070;text-align:center;}
  .zone{font-size:.68rem;color:#8A8070;text-transform:capitalize;}
</style></head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo">Nest<b>Finder</b> CUK · <span style="color:#B8955A;font-size:.9rem;">Trinity Movers</span></div>
    <div class="badge">Booking Received</div>
  </div>
  <div class="body">
    <div class="greeting">Hi ${firstName},</div>
    <p style="font-size:.88rem;color:#4A4438;line-height:1.7;">Your moving request has been received. Admin will confirm via WhatsApp shortly. Payment is settled on move day — no upfront needed.</p>

    <div class="move-card">
      <div class="row"><span class="lbl">Pickup</span><span class="val">${pickup}<br/><span class="zone">${pickup_zone} zone</span></span></div>
      <div class="row"><span class="lbl">Drop-off</span><span class="val">${dropoff}<br/><span class="zone">${dropoff_zone} zone</span></span></div>
      <div class="row"><span class="lbl">Move Date</span><span class="val">${dateFormatted}</span></div>
      <div class="row"><span class="lbl">Service Tier</span><span class="val">${tier}</span></div>
      ${notes ? `<div class="row"><span class="lbl">Notes</span><span class="val">${notes}</span></div>` : ''}
      <div class="price-row"><span class="lbl" style="font-size:.84rem;">Amount Due</span><span class="price-val">Ksh ${parseInt(price).toLocaleString()}</span></div>
    </div>

    <p style="font-size:.8rem;color:#4A4438;line-height:1.7;background:rgba(184,149,90,.06);border:1px solid rgba(184,149,90,.15);padding:1rem;">
      <strong style="color:#B8955A;">Pay on move day.</strong> Cash or M-Pesa directly with the movers. Admin will confirm this booking and reach out before your move date.
    </p>

    <a href="https://wa.me/254704285315?text=${encodeURIComponent(`Hi, I just booked a Trinity Movers move. Name: ${name}, Date: ${move_date}, From: ${pickup} to ${dropoff}`)}" class="wa">WhatsApp Admin — 0704 285 315</a>

    <p class="note">
      Questions or need to reschedule? WhatsApp admin on <a href="https://wa.me/254704285315" style="color:#B8955A;">0704 285 315</a><br/><br/>
      <a href="https://nestfindercuk.rocks/movers.html" style="color:#B8955A;">nestfindercuk.rocks/movers</a>
    </p>
  </div>
  <div class="footer">NestFinder CUK · Trinity Movers · 0704 285 315</div>
</div>
</body>
</html>`;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Trinity Movers <warengrege@gmail.com>',
        to: [email],
        subject: `Your Move is Booked — ${dateFormatted} · Trinity Movers`,
        html
      })
    });

    const result = await emailRes.json();
    return res.status(200).json({ sent: !!result.id, id: result.id });

  } catch (err) {
    console.error('Notify mover error:', err);
    return res.status(200).json({ sent: false, error: err.message });
  }
};
