// api/mpesa-check.js
// Frontend polls this to check if payment was confirmed

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { payment_id } = req.query;
  if (!payment_id) return res.status(400).json({ error: 'Missing payment_id' });

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
}
