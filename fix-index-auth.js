const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// Find initAuth and replace the whole function to not call Firestore
const oldInit = `async function initAuth(){
  firebase.auth().onAuthStateChanged(async function(fbUser){
    if(!fbUser){return;}
    user=fbUser;
    try{
      const doc=await firebase.firestore().collection("users").doc(fbUser.uid).get();`;

const newInit = `async function initAuth(){
  firebase.auth().onAuthStateChanged(async function(fbUser){
    if(!fbUser){return;}
    user=fbUser;
    try{
      // Skip Firestore — just use auth user
      const prof={};`;

h = h.replace(oldInit, newInit);

// Also simplify the rest of initAuth to not need the doc
h = h.replace(
  /const prof=\{\};[\s\S]*?const name=\(prof\.display_name\|\|fbUser\.email\|\|"Student"\)\.split\(" "\)\[0\];/,
  `const prof={};
      const name=(fbUser.displayName||fbUser.email||'Student').split(' ')[0];`
);

fs.writeFileSync('index.html', h);
console.log('initAuth Firestore dependency removed');
