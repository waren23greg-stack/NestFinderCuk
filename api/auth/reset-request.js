// api/auth/reset-request.js
const crypto=require('crypto');
const {resetEmailHtml}=require('../../lib/email-brand');

const SECRET=process.env.RESET_SECRET;
const RESEND_KEY=process.env.RESEND_API_KEY;
const FROM=process.env.RESET_FROM_EMAIL||'noreply@nestfindercuk.rocks';

function siteOrigin(){
  if(process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/,'');
  if(process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://nestfindercuk.rocks';
}

function makeToken(email){
  if(!SECRET) throw new Error('RESET_SECRET not configured');
  const payload=Buffer.from(JSON.stringify({email,ts:Date.now()})).toString('base64url');
  const sig=crypto.createHmac('sha256',SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

module.exports=async(req,res)=>{
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  if(!SECRET) return res.status(500).json({error:'Server misconfigured: RESET_SECRET missing'});
  if(!RESEND_KEY) return res.status(500).json({error:'Server misconfigured: RESEND_API_KEY missing'});

  const{email}=req.body||{};
  if(!email||typeof email!=='string'||!email.includes('@'))
    return res.status(400).json({error:'A valid email address is required'});

  const normalised=email.toLowerCase().trim();
  let token;
  try{ token=makeToken(normalised); }
  catch(e){ return res.status(500).json({error:'Could not generate reset token'}); }

  const resetLink=`${siteOrigin()}/reset-confirm.html?token=${encodeURIComponent(token)}&email=${encodeURIComponent(normalised)}`;

  try{
    const r=await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{'Authorization':`Bearer ${RESEND_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({from:FROM,to:normalised,subject:'Reset your NestFinder CUK password',html:resetEmailHtml({resetLink})})
    });
    if(!r.ok) console.error('[reset-request] Resend error:',r.status,await r.text().catch(()=>''));
  }catch(e){ console.error('[reset-request] fetch error:',e.message); }

  // Always 200 — don't reveal whether the account exists
  return res.status(200).json({ok:true});
};
