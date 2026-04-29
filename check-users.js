const admin = require('firebase-admin');
const sa = require('./serviceAccountKey.json');
admin.initializeApp({credential: admin.credential.cert(sa)});
admin.firestore().collection('users').get().then(snap => {
  console.log('Total user docs:', snap.size);
  snap.forEach(d => console.log('ID:', d.id, '| role:', d.data().role, '| email:', d.data().email));
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
