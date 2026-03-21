// api/report.js
// Saves a listing report to Supabase and notifies admin

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { listing_id, listing_title, reason, details, reporter_id } = req.body;
    if (!listing_id || !reason) {
      return res.status(400).json({ error: 'Missing listing_id or reason' });
    }

    const sb = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Save report to database
    const { data, error } = await sb.from('reports').insert({
      listing_id,
      listing_title: listing_title || 'Unknown',
      reason,
      details: details || '',
      reporter_id: reporter_id || null,
      status: 'open'
    }).select().single();

    if (error) {
      console.error('Report save error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Send email notification to admin via Resend
    const RESEND_KEY = process.env.RESEND_API_KEY;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'waren23greg@gmail.com';

    if (RESEND_KEY) {
      const waUrl = `https://wa.me/254704285315?text=${encodeURIComponent(
        `NestFinder Report: Listing "${listing_title}" was reported for "${reason}". Details: ${details || 'None'}. Admin panel: https://nest-finder-cuk.vercel.app/admin.html`
      )}`;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'NestFinder CUK <notifications@nestfinder.co.ke>',
          to: [ADMIN_EMAIL],
          subject: `🚩 Listing Reported — "${listing_title}" (${reason})`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:500px;margin:2rem auto;background:#fff;border:1px solid #e5e7eb;padding:2rem;">
              <h2 style="color:#16130E;margin:0 0 1rem;">Listing Reported</h2>
              <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <tr><td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Listing</td><td style="padding:8px 0;font-weight:500;border-bottom:1px solid #f3f4f6;">${listing_title}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;">Reason</td><td style="padding:8px 0;font-weight:500;border-bottom:1px solid #f3f4f6;">${reason}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;">Details</td><td style="padding:8px 0;">${details || '—'}</td></tr>
              </table>
              <a href="https://nest-finder-cuk.vercel.app/admin.html" style="display:block;margin-top:1.5rem;padding:12px;background:#16130E;color:#fff;text-align:center;text-decoration:none;font-size:13px;letter-spacing:.08em;text-transform:uppercase;">Review in Admin Panel</a>
            </div>`
        })
      }).catch(() => {});
    }

    return res.status(200).json({ success: true, report_id: data.id });

  } catch (err) {
    console.error('Report error:', err);
    return res.status(500).json({ error: err.message });
  }
};
