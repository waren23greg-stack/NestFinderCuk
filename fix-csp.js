const fs = require('fs');
['index.html','login.html','admin.html','verify.html'].forEach(f => {
  if(!fs.existsSync(f)) return;
  let h = fs.readFileSync(f,'utf8');
  if(!h.includes('onrender.com')){
    h = h.replace(/https:\/\/api\.cloudinary\.com/g,'https://api.cloudinary.com https://media-storage-advanced.onrender.com');
    fs.writeFileSync(f,h);
    console.log('Patched:',f);
  } else console.log('Already done:',f);
});
