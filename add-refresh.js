const fs = require('fs');

const refreshCode = `
async function refreshToken(){
  var rt=localStorage.getItem('sb-refresh');
  if(!rt) return;
  try{
    var r=await fetch('https://mtycapgbtvpczvswpjpo.supabase.co/auth/v1/token?grant_type=refresh_token',{
      method:'POST',
      headers:{'apikey':'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eWNhcGdidHZwY3p2c3dwanBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjQxNDgsImV4cCI6MjA4OTYwMDE0OH0.owJeYO2kHs1F82kPQeML6uHUarchKT_ybe79OBBV6wM','Content-Type':'application/json'},
      body:JSON.stringify({refresh_token:rt})
    });
    var d=await r.json();
    if(d.access_token){
      localStorage.setItem('sb-token',d.access_token);
      if(d.refresh_token) localStorage.setItem('sb-refresh',d.refresh_token);
    }
  }catch(e){}
}
refreshToken();
setInterval(refreshToken, 50*60*1000);
`;

// Add to index.html
let idx = fs.readFileSync('index.html','utf8');
if(idx.indexOf('refreshToken') === -1){
  idx = idx.replace('async function initAuth(){', refreshCode + '\nasync function initAuth(){');
  fs.writeFileSync('index.html', idx);
  console.log('index.html done');
} else {
  console.log('index.html already has refreshToken');
}

// Add to admin.html
let adm = fs.readFileSync('admin.html','utf8');
if(adm.indexOf('refreshToken') === -1){
  adm = adm.replace('async function init(){', refreshCode + '\nasync function init(){');
  fs.writeFileSync('admin.html', adm);
  console.log('admin.html done');
} else {
  console.log('admin.html already has refreshToken');
}

// Add to login.html  
let log = fs.readFileSync('login.html','utf8');
if(log.indexOf('refreshToken') === -1){
  log = log.replace('async function init(){', refreshCode + '\nasync function init(){');
  fs.writeFileSync('login.html', log);
  console.log('login.html done');
} else {
  console.log('login.html already has refreshToken');
}

console.log('All done!');
