// api/auth/reset-confirm.js
const crypto=require('crypto');

const SECRET=process.env.RESET_SECRET;
const BACKEND='https://media-storage-advanced.onrender.com';
const MAX_AGE=60*60*1000; // 1 hour

function verifyToken(token){
  if(!SECRET) throw new Error('RESET_SECRET not configured');
  const parts=(token||'').split('.');
  if(parts.length!==2) throw new Error('Malformed token');
  const[payload,sig]=parts;
  const expected=crypto.createHmac('sha256',SECRET).update(payload).digest('base64url');
  if(!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))
    throw new Error('Invalid reset link — please request a new one');
  let parsed;
  try{ parsed=JSON.parse(Buffer.from(payload,'base64url').toString('utf8')); }
  catch{ throw new Error('Malformed token payload'); }
  if(!parsed.email||!parsed.ts) throw new Error('Malformed token payload');
  if(Date.now()-parsed.ts>MAX_AGE) throw new Error('This reset link has expired — please request a new one');
  return parsed.email;
}

module.exports=async(req,res)=>{
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  if(!SECRET) return res.status(500).json({error:'Server misconfigured: RESET_SECRET missing'});

  const{token,newPassword}=req.body||{};
  if(!token||!newPassword) return res.status(400).json({error:'token and newPassword are required'});
  if(typeof newPassword!=='string'||newPassword.length<6)
    return res.status(400).json({error:'Password must be at least 6 characters'});

  let email;
  try{ email=verifyToken(token); }
  catch(e){ return res.status(400).json({error:e.message}); }

  let backendRes;
  try{
    backendRes=await fetch(`${BACKEND}/auth/reset-password`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email,newPassword})
    });
  }catch(e){
    console.error('[reset-confirm] backend unreachable:',e.message);
    return res.status(502).json({error:'Could not reach auth server — try again in a moment'});
  }

  let data={};
  try{ data=await backendRes.json(); }catch{}
  if(!backendRes.ok) return res.status(backendRes.status).json({error:data.error||data.message||'Reset failed — please try again'});
  return res.status(200).json({ok:true});
};
