
const _reqMap = {};
function rateLimit(ip, max=10, windowMs=60000){
  const now = Date.now();
  _reqMap[ip] = (_reqMap[ip] || []).filter(t => now - t < windowMs);
  if(_reqMap[ip].length >= max) return false;
  _reqMap[ip].push(now);
  return true;
}

// api/mpesa-check.js
// Frontend polls this to check if payment was confirmed

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!rateLimit(ip)) return res.status(429).json({ error: 'Too many requests.' });

  const { payment_id } = req.query;
  if (!payment_id) return res.status(400).json({ error: 'Missing payment_id' });

  try {
    const sb = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data, error } = await sb
      .from('payments')
      .select('status, mpesa_ref')
      .eq('id', payment_id)
      .single();

    if (error) return res.status(404).json({ error: 'Payment not found' });

    return res.status(200).json({ status: data.status, mpesa_ref: data.mpesa_ref });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
