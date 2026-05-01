// firebase-config.js — Firebase Auth kept, Firestore replaced with WarenVault
const firebaseConfig = {
  apiKey: 'AIzaSyB_9MvliXbsjsIh52kMSMlInkcTa0kXGOY',
  authDomain: 'nestfinder-cuk.firebaseapp.com',
  databaseURL: 'https://nestfinder-cuk-default-rtdb.firebaseio.com',
  projectId: 'nestfinder-cuk',
  storageBucket: 'nestfinder-cuk.firebasestorage.app',
  messagingSenderId: '508247387540',
  appId: '1:508247387540:web:473ceb9425182fa0fe3301',
  measurementId: 'G-VFLY44TEX1'
};
firebase.initializeApp(firebaseConfig);

// ── WarenVault Firestore Override ─────────────────────────────────────────────
// Replaces firebase.firestore() with REST calls to WarenVault.
// Firebase Auth is untouched — login/signup still work normally.
(function () {
  const API = 'https://media-storage-advanced.onrender.com';

  const FieldValue = {
    serverTimestamp: () => new Date().toISOString(),
    arrayUnion: (...i) => i,
    arrayRemove: (...i) => i,
    increment: n => n
  };

  async function req(method, path, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(API + path, opts);
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  function docSnap(doc) {
    return {
      id: doc ? doc.id : null,
      exists: !!doc,
      data: () => doc || {},
      get: f => doc ? doc[f] : undefined
    };
  }

  function collSnap(docs) {
    const list = (docs || []).map(d => ({
      id: d.id, exists: true, data: () => d, get: f => d[f]
    }));
    return { docs: list, empty: list.length === 0, size: list.length, forEach: fn => list.forEach(fn) };
  }

  function query(col, filters, orders) {
    filters = filters || {};
    return {
      where(f, op, v) { return query(col, { ...filters, [f]: v }, orders); },
      orderBy(f) { return query(col, filters, f); },
      limit() { return query(col, filters, orders); },
      async get() {
        const params = new URLSearchParams(filters).toString();
        const docs = await req('GET', `/nest/${col}${params ? '?' + params : ''}`);
        return collSnap(Array.isArray(docs) ? docs : []);
      },
      async add(data) {
        const doc = await req('POST', `/nest/${col}`, data);
        return { id: doc.id };
      }
    };
  }

  function docRef(col, id) {
    return {
      id,
      async get() {
        try { return docSnap(await req('GET', `/nest/${col}/${id}`)); }
        catch { return docSnap(null); }
      },
      async set(data) { await req('PUT', `/nest/${col}/${id}`, { id, ...data }); },
      async update(data) { await req('PATCH', `/nest/${col}/${id}`, data); },
      async delete() { await req('DELETE', `/nest/${col}/${id}`); },
      collection(sub) { return query(`${col}_${sub}`); }
    };
  }

  function colRef(col) {
    return {
      doc(id) { return docRef(col, id); },
      where(f, op, v) { return query(col, { [f]: v }); },
      orderBy(f) { return query(col, {}, f); },
      limit() { return query(col); },
      async get() {
        const docs = await req('GET', `/nest/${col}`);
        return collSnap(Array.isArray(docs) ? docs : []);
      },
      async add(data) {
        const doc = await req('POST', `/nest/${col}`, data);
        return { id: doc.id };
      }
    };
  }

  const vaultFirestore = {
    collection: col => colRef(col),
    FieldValue
  };

  firebase.firestore = () => vaultFirestore;
  firebase.firestore.FieldValue = FieldValue;

  console.log('[WarenVault] Firestore → REST API');
})();
