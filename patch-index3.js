const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Old initAuth body — find by sb-token localStorage check (different from new one)
const oldIA = `async function initAuth(){
  const t=localStorage.getItem('sb-token');if(!t)return;
  try{
    const ur=await fetch(_SB_URL+'/auth/v1/user',{headers:_SBH(t)});
    const u=await ur.json();
    if(!u.id){localStorage.removeItem('sb-token');return;}
    user=u;
    const pr=await fetch(_SB_URL+'/rest/v1/profiles?select=full_name,role&id=eq.'+u.id,{headers:_SBH(t)});
    const pd=await pr.json();
    const prof=Array.isArray(pd)&&pd.length>0?pd[0]:null;
    const name=prof?.full_name?.split(' ')[0]||'Student';
    const isAdmin=prof?.role==='admin';
    document.getElementById('nav-hello').textContent='Hi, '+name;
    document.getElementById('nav-in').style.display='none';
    document.getElementById('nav-out').style.display='';
    document.getElementById('drawer-in').style.display='none';
    document.getElementById('drawer-out').style.display='';
    document.getElementById('drawer-user').textContent='Signed in as '+name;`;

// Find it by unique fragment
const ia_anchor = "const t=localStorage.getItem('sb-token');if(!t)return;\n  try{\n    const ur=await fetch(_SB_URL";
const ia_end_anchor = "document.getElementById('drawer-user').textContent='Signed in as '+name;";

let s = html.indexOf(ia_anchor);
if (s === -1) { console.error('initAuth anchor not found'); }
else {
  // Walk back to find the function start
  s = html.lastIndexOf('async function initAuth(){', s);
  const e = html.indexOf(ia_end_anchor, s) + ia_end_anchor.length;
  const newIA = `async function initAuth(){
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
      document.getElementById('drawer-user').textContent='Signed in as '+name;`;
  html = html.slice(0, s) + newIA + html.slice(e);
  console.log('initAuth replaced');
}

// 2. _ce payment duplicate check
const ce_anchor = "const _ce=await fetch(_SB_URL+'/rest/v1/payments?select=id,status&mpesa_ref=eq.'";
const ce_end    = "const existing=Array.isArray(_ced)&&_ced.length>0?_ced[0]:null;";
s = html.indexOf(ce_anchor);
if (s === -1) { console.error('_ce anchor not found'); }
else {
  const e = html.indexOf(ce_end, s) + ce_end.length;
  html = html.slice(0, s) +
    `const _ceSnap=await firebase.firestore().collection('payments').where('mpesa_ref','==',ref).get();
  const existing=!_ceSnap.empty?{...(_ceSnap.docs[0].data()),id:_ceSnap.docs[0].id}:null;` +
    html.slice(e);
  console.log('_ce replaced');
}

// 3. Promise.all profiles+listings fetch (notify block)
const pa_anchor = "const [{data:prof},{data:lst}]=await Promise.all([\n      fetch(_SB_URL+'/rest/v1/profiles";
const pa_end    = "fetch('/api/notify',";
s = html.indexOf(pa_anchor);
if (s === -1) { console.error('Promise.all anchor not found'); }
else {
  const e = html.indexOf(pa_end, s);
  html = html.slice(0, s) +
    `const [{data:prof},{data:lst}]=await Promise.all([
      firebase.firestore().collection('users').doc(user.uid||user.id).get().then(d=>({data:d.exists?d.data():{}})),
      firebase.firestore().collection('listings').doc(cur.id).get().then(d=>({data:d.exists?d.data():{}}))
    ]);
    ` +
    html.slice(e);
  console.log('Promise.all replaced');
}

fs.writeFileSync('index.html', html);
console.log('\nRemaining hits:');
const rem = (html.match(/mtycapgbtvpczvswpjpo|_SB_URL|_SBH\(/g)||[]);
console.log(rem.length, rem.slice(0,5));
