const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Helper: replace first occurrence of a pattern between two unique anchors
function replaceFn(html, startAnchor, endAnchor, replacement) {
  const s = html.indexOf(startAnchor);
  if (s === -1) { console.error('Anchor not found: ' + startAnchor.slice(0,40)); return html; }
  const e = html.indexOf(endAnchor, s) + endAnchor.length;
  console.log('  replaced: ' + startAnchor.slice(0,40));
  return html.slice(0, s) + replacement + html.slice(e);
}

// 1. refreshToken — Firebase handles this automatically
html = replaceFn(html,
  'async function refreshToken(){',
  'refreshToken();setInterval(refreshToken,50*60*1000);',
  '// Firebase handles token refresh automatically\n'
);

// 2. initAuth — replace with Firebase Auth
html = replaceFn(html,
  'async function initAuth(){',
  '}initAuth();',
`async function initAuth(){
  firebase.auth().onAuthStateChanged(async function(fbUser){
    if(!fbUser){return;}
    user=fbUser;
    try{
      const doc=await firebase.firestore().collection('users').doc(fbUser.uid).get();
      const prof=doc.exists?doc.data():{};
      const name=(prof.display_name||fbUser.email||'Student').split(' ')[0];
      const isAdmin=prof.role==='admin';
      document.getElementById('nav-hello').textContent='Hi, '+name;
      document.getElementById('nav-in').style.display='none';
      document.getElementById('nav-out').style.display='';
      document.getElementById('drawer-in').style.display='none';
      document.getElementById('drawer-out').style.display='';
      document.getElementById('drawer-user').textContent='Signed in as '+name;
      ['nav-payments','drawer-payments','bot-payments'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='';});
      if(isAdmin){
        ['nav-admin','drawer-admin'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='';});
        const ba=document.getElementById('bot-admin');if(ba)ba.style.display='';
      }
      user.display_name=prof.display_name||'';
      user.role=prof.role||'student';
    }catch(e){console.warn('initAuth error',e);}
  });
}initAuth();`
);

// 3. Check duplicate payment ref
html = replaceFn(html,
  '// Check duplicate ref\n  const _ce=await fetch(_SB_URL',
  'const existing=Array.isArray(_ced)&&_ced.length>0?_ced[0]:null;',
`// Check duplicate ref
  const _ceSnap=await firebase.firestore().collection('payments').where('mpesa_ref','==',ref).get();
  const existing=!_ceSnap.empty?_ceSnap.docs[0].data():null;if(existing)existing.id=_ceSnap.docs[0].id;`
);

// 4. Submit payment POST
html = replaceFn(html,
  'const _pr=await fetch(_SB_URL+\'/rest/v1/payments\',{',
  'const pmnt=Array.isArray(_pd)&&_pd.length>0?_pd[0]:_pd;',
`const _prRef=await firebase.firestore().collection('payments').add({uid:user.uid||user.id,listing_id:cur.id,phone:user.phone||"",amount:fee,status:"pending",mpesa_ref:ref,checkin_date:checkin||null,checkout_date:checkout||null,created_at:firebase.firestore.FieldValue.serverTimestamp()});
  const _pd={id:_prRef.id};
  const pmnt={id:_prRef.id};`
);

// 5. Profile + listing fetch before notify
html = replaceFn(html,
  'const [{data:prof},{data:lst}]=await Promise.all([\n      fetch(_SB_URL',
  'fetch(\'/api/notify\',',
`const [{data:prof},{data:lst}]=await Promise.all([
      firebase.firestore().collection('users').doc(user.uid||user.id).get().then(d=>({data:d.exists?d.data():{}})),
      firebase.firestore().collection('listings').doc(cur.id).get().then(d=>({data:d.exists?d.data():{}}))
    ]);
    fetch('/api/notify',`
);

// 6. Poll payment status
html = replaceFn(html,
  'const _pr2=await fetch(_SB_URL+\'/rest/v1/payments?select=status&id=eq.\'',
  'if(data?.status===\'denied\')',
`const _pr2snap=await firebase.firestore().collection('payments').doc(pmnt.id).get();
    const data=_pr2snap.exists?_pr2snap.data():null;
    if(data?.status==='denied')`
);

// 7. showContact — caretaker_contacts fetch
html = replaceFn(html,
  'const _r=await fetch(_SB_URL+\'/rest/v1/caretaker_contacts',
  'const data=Array.isArray(_d)&&_d.length>0?_d[0]:null;',
`const _cSnap=await firebase.firestore().collection('caretaker_contacts').where('listing_id','==',lid).get();
  const data=!_cSnap.empty?_cSnap.docs[0].data():null;`
);

// 8. showContact inner listing fetch
html = replaceFn(html,
  'const _rl=await fetch(_SB_URL+\'/rest/v1/listings',
  'await fetch(\'/api/notify-student\',',
`const _lstDoc=await firebase.firestore().collection('listings').doc(lid).get();
      const lst=_lstDoc.exists?_lstDoc.data():null;
      await fetch('/api/notify-student',`
);

// 9. generateAndShowPromo_banner — promo codes fetch
html = replaceFn(html,
  'const r=await fetch(_SB_URL+\'/rest/v1/promo_codes',
  'const d=await r.json();',
`const _promoSnap=await firebase.firestore().collection('promo_codes').where('owner_id','==',user.uid||user.id).where('used_by','==',null).limit(1).get().catch(()=>({empty:true,docs:[]}));
    const d=!_promoSnap.empty?[_promoSnap.docs[0].data()]:[];`
);

// 10. loadRatings — reviews fetch
html = replaceFn(html,
  'const _rrat=await fetch(_SB_URL+\'/rest/v1/reviews?select=listing_id,rating\'',
  'const data=await _rrat.json().catch(()=>[]);if(!data)return;',
`const _rratSnap=await firebase.firestore().collection('reviews').get();
  const data=_rratSnap.docs.map(d=>d.data());if(!data)return;`
);

// 11. loadReviews — reviews fetch
html = replaceFn(html,
  'const _rr=await fetch(_SB_URL+\'/rest/v1/reviews',
  'const list=document.getElementById(\'review-list\');',
`const _rrSnap=await firebase.firestore().collection('reviews').where('listing_id','==',lid).orderBy('created_at','desc').get();
  const data=_rrSnap.docs.map(d=>({...d.data(),id:d.id}));
  const list=document.getElementById('review-list');`
);

// 12. submitReview — POST review
html = replaceFn(html,
  'const _rs=await fetch(_SB_URL+\'/rest/v1/reviews\',{',
  'if(!_rs.ok){toast(\'Review failed',
`await firebase.firestore().collection('reviews').add({listing_id:cur.id,uid:user.uid||user.id,rating:pickedStar,comment,created_at:firebase.firestore.FieldValue.serverTimestamp()});
  const _rs={ok:true};
  if(!_rs.ok){toast('Review failed`
);

fs.writeFileSync('index.html', html);
console.log('\nDone. Checking for remaining Supabase refs...');
const remaining = (html.match(/mtycapgbtvpczvswpjpo|_SB_URL|_SBH\(/g) || []);
console.log('Remaining hits:', remaining.length, remaining.slice(0,5));
