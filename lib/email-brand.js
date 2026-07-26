// lib/email-brand.js
const COLORS = {
  ink:'#0E0B07',ink2:'#1C1810',gold:'#C09A5A',goldLight:'#D8B97A',
  sand:'#F7F2EA',pale:'#FAF8F4',muted:'#9C8E78',white:'#FFFFFF'
};

function wrapEmail({preheader,headline,headlineAccent,bodyHtml,ctaLabel,ctaUrl,footerNote}){
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>NestFinder CUK</title></head>
<body style="margin:0;padding:0;background:${COLORS.sand};font-family:'DM Sans',Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader||''}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.sand};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" style="max-width:520px;background:${COLORS.white};border-radius:6px;overflow:hidden;">
<tr><td style="background:linear-gradient(165deg,#1A1408 0%,${COLORS.ink} 40%,#1C160A 100%);padding:36px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="font-family:Georgia,'Playfair Display',serif;font-size:20px;color:${COLORS.white};letter-spacing:.02em;">
🏠 <span style="font-weight:400;">NestFinder</span> <span style="font-weight:700;">CUK</span>
</td></tr></table></td></tr>
<tr><td style="padding:40px 40px 8px 40px;">
<div style="font-family:Georgia,'Playfair Display',serif;font-size:28px;line-height:1.25;color:${COLORS.ink};">
${headline}${headlineAccent?` <span style="font-style:italic;color:${COLORS.gold};">${headlineAccent}</span>`:''}
</div></td></tr>
<tr><td style="padding:12px 40px 8px 40px;font-size:15px;line-height:1.65;color:${COLORS.ink2};">${bodyHtml}</td></tr>
${ctaUrl?`<tr><td style="padding:24px 40px 8px 40px;">
<a href="${ctaUrl}" style="display:inline-block;background:${COLORS.ink};color:${COLORS.white};text-decoration:none;font-size:13px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;padding:16px 28px;border-radius:2px;">${ctaLabel||'Open NestFinder'}</a>
</td></tr>`:''}
<tr><td style="padding:32px 40px 0 40px;"><div style="border-top:1px solid #EDE6D8;"></div></td></tr>
<tr><td style="padding:20px 40px 36px 40px;font-size:12px;line-height:1.6;color:${COLORS.muted};">
${footerNote||'NestFinder CUK — safe, verified student housing near The Cooperative University of Kenya.'}
</td></tr>
</table></td></tr></table>
</body></html>`;
}

function welcomeEmailHtml({name}){
  const first=(name||'').trim().split(' ')[0]||'there';
  return wrapEmail({
    preheader:`Welcome to NestFinder CUK, ${first} — your account is ready.`,
    headline:'Welcome home,',headlineAccent:`${first}.`,
    bodyHtml:`<p style="margin:0 0 16px 0;">Your NestFinder CUK account is ready. Browse verified listings near CUK and unlock a caretaker's contact for Ksh 250 via M-Pesa.</p>
<ul style="margin:0 0 16px 0;padding-left:18px;">
<li style="margin-bottom:6px;">Every listing is verified — real photos, real contacts, real houses.</li>
<li style="margin-bottom:6px;">You only pay the Ksh 250 unlock fee once per listing, not a subscription.</li>
<li style="margin-bottom:6px;">Keep the email and password you signed up with — you'll need them to log back in.</li>
</ul><p style="margin:0;">If you didn't create this account, ignore this email.</p>`,
    ctaLabel:'Browse Listings',ctaUrl:'https://nestfindercuk.rocks/index.html'
  });
}

function resetEmailHtml({resetLink}){
  return wrapEmail({
    preheader:'Reset your NestFinder CUK password — link expires in 1 hour.',
    headline:'Reset your',headlineAccent:'password.',
    bodyHtml:`<p style="margin:0 0 16px 0;">We received a request to reset the password on your NestFinder CUK account. Click below to choose a new one.</p>
<p style="margin:0 0 16px 0;">This link expires in <strong>1 hour</strong>. If you didn't request this, ignore this email — your password won't change.</p>`,
    ctaLabel:'Reset Password',ctaUrl:resetLink,
    footerNote:`If the button doesn't work, copy this into your browser:<br><span style="word-break:break-all;color:#9C8E78;">${resetLink}</span><br><br>NestFinder CUK — safe, verified student housing near The Cooperative University of Kenya.`
  });
}

module.exports={welcomeEmailHtml,resetEmailHtml};
