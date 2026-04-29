const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// Fix all markdown corruption
h = h.replace(/\[([a-zA-Z0-9_.]+)\]\(http:\/\/[^)]+\)/g, '$1');

// Replace the entire initAuth function with one that works offline
const OLD = `async function initAuth(){
  firebase.auth().onAuthStateChanged(async function(fbUser){
    if(!fbUser){return;}
    user=fbUser;
    try{
      const doc=await firebase.firestore().collection("users").doc(fbUser.uid).get();
      const prof=doc.exists?doc.data():{};
      const name=(prof.display_name||fbUser.email||"Student").split(" ")[0];
      const isAdmin=prof.role==="admin";
      document.getElementById("nav-hello").textContent="Hi, "+name;
      document.getElementById("nav-in").style.display="none";
      document.getElementById("nav-out").style.display="";
      document.getElementById("drawer-in").style.display="none";
      document.getElementById("drawer-out").style.display="";
      document.getElementById("drawer-user").textContent="Signed in as "+name;
      ["nav-payments","drawer-payments","bot-payments"].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display="";});
      if(isAdmin){
        ["nav-admin","drawer-admin"].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display="";});
        const ba=document.getElementById("bot-admin");if(ba)ba.style.display="";
      }
      user.display_name=prof.display_name||"";
      user.role=prof.role||"student";
    }catch(e){console.warn("initAuth err",e);}
    refreshListings();
  });
}`;

const NEW = `async function initAuth(){
  firebase.auth().onAuthStateChanged(async function(fbUser){
    if(!fbUser){return;}
    user=fbUser;
    // Show UI immediately from Auth data (no Firestore needed)
    const name=(fbUser.displayName||fbUser.email||"Student").split(" ")[0];
    document.getElementById("nav-hello").textContent="Hi, "+name;
    document.getElementById("nav-in").style.display="none";
    document.getElementById("nav-out").style.display="";
    document.getElementById("drawer-in").style.display="none";
    document.getElementById("drawer-out").style.display="";
    document.getElementById("drawer-user").textContent="Signed in as "+name;
    ["nav-payments","drawer-payments","bot-payments"].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display="";});
    user.display_name=name;
    user.role="student";
    // Try Firestore for admin check (non-blocking)
    try{
      const doc=await firebase.firestore().collection("users").doc(fbUser.uid).get();
      const prof=doc.exists?doc.data():{};
      if(prof.display_name){
        const n=prof.display_name.split(" ")[0];
        document.getElementById("nav-hello").textContent="Hi, "+n;
        document.getElementById("drawer-user").textContent="Signed in as "+n;
        user.display_name=prof.display_name;
      }
      user.role=prof.role||"student";
      if(prof.role==="admin"){
        ["nav-admin","drawer-admin"].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display="";});
        const ba=document.getElementById("bot-admin");if(ba)ba.style.display="";
      }
    }catch(e){console.warn("Firestore profile load failed (offline?)",e);}
    refreshListings();
  });
}`;

if (h.includes(OLD)) {
  h = h.replace(OLD, NEW);
  console.log('initAuth replaced successfully');
} else {
  console.log('Pattern not found — trying partial match');
  // Fallback: just fix the catch block to update UI
  h = h.replace(
    `}catch(e){console.warn("initAuth err",e);}`,
    `}catch(e){
      console.warn("Firestore offline, showing auth-only UI",e);
      const n=(fbUser.displayName||fbUser.email||"Student").split(" ")[0];
      document.getElementById("nav-hello").textContent="Hi, "+n;
      document.getElementById("nav-in").style.display="none";
      document.getElementById("nav-out").style.display="";
      document.getElementById("drawer-in").style.display="none";
      document.getElementById("drawer-out").style.display="";
      document.getElementById("drawer-user").textContent="Signed in as "+n;
      ["nav-payments","drawer-payments","bot-payments"].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display="";});
    }`
  );
  console.log('Catch block patched');
}

fs.writeFileSync('index.html', h);
console.log('done');
