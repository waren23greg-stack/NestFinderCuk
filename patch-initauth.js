const fs = require('fs');
const lines = fs.readFileSync('index.html', 'utf8').split('\n');

// Find initAuth start line
let start = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === 'async function initAuth(){') { start = i; break; }
}
if (start === -1) { console.error('not found'); process.exit(1); }
console.log('initAuth at line', start + 1);

// Find end: walk braces from start
let depth = 0, begun = false, end = -1;
for (let i = start; i < lines.length; i++) {
  for (const ch of lines[i]) {
    if (ch === '{') { depth++; begun = true; }
    else if (ch === '}') depth--;
  }
  if (begun && depth === 0) { end = i; break; }
}
console.log('initAuth ends at line', end + 1);

const newFn = [
'async function initAuth(){',
'  firebase.auth().onAuthStateChanged(async function(fbUser){',
'    if(!fbUser){return;}',
'    user=fbUser;',
'    try{',
'      const doc=await firebase.firestore().collection("users").doc(fbUser.uid).get();',
'      const prof=doc.exists?doc.data():{};',
'      const name=(prof.display_name||fbUser.email||"Student").split(" ")[0];',
'      const isAdmin=prof.role==="admin";',
'      document.getElementById("nav-hello").textContent="Hi, "+name;',
'      document.getElementById("nav-in").style.display="none";',
'      document.getElementById("nav-out").style.display="";',
'      document.getElementById("drawer-in").style.display="none";',
'      document.getElementById("drawer-out").style.display="";',
'      document.getElementById("drawer-user").textContent="Signed in as "+name;',
'      ["nav-payments","drawer-payments","bot-payments"].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display="";});',
'      if(isAdmin){',
'        ["nav-admin","drawer-admin"].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display="";});',
'        const ba=document.getElementById("bot-admin");if(ba)ba.style.display="";',
'      }',
'      user.display_name=prof.display_name||"";',
'      user.role=prof.role||"student";',
'    }catch(e){console.warn("initAuth err",e);}',
'    refreshListings();',
'  });',
'}',
'async function refreshListings(){',
'  try{',
'    const snap=await firebase.firestore().collection("listings").get();',
'    listings=snap.docs.map(d=>({id:d.id,...d.data()}));',
'    if(!listings.length){emptyState();return;}',
'    render(listings);',
'    if(typeof loadRatings==="function")loadRatings();',
'  }catch(e){console.error("refreshListings",e);emptyState();}',
'}',
'initAuth();'
];

const result = [
  ...lines.slice(0, start),
  ...newFn,
  ...lines.slice(end + 1)
];

// Fix doSignOut
const out = result.join('\n').replace(
  /async function doSignOut\(\)\{[^\}]*\}/,
  'async function doSignOut(){await firebase.auth().signOut();user=null;location.reload();}'
);

fs.writeFileSync('index.html', out);
console.log('Done. Lines:', out.split('\n').length);
