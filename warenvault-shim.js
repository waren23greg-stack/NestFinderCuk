// warenvault-shim.js
// Drop-in replacement for Firestore that routes all collection calls
// to the WarenVault REST API. No changes to existing app code needed.

(function() {
  const API = 'https://media-storage-advanced.onrender.com';

  // Helper: fetch from WarenVault
  async function apiGet(collection, filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const url = `${API}/nest/${collection}${params ? '?' + params : ''}`;
    const r = await fetch(url);
    return r.json();
  }

  async function apiPost(collection, data) {
    const r = await fetch(`${API}/nest/${collection}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return r.json();
  }

  async function apiDelete(collection, id) {
    await fetch(`${API}/nest/${collection}/${id}`, { method: 'DELETE' });
  }

  // Fake QuerySnapshot
  function makeSnap(docs) {
    const docList = docs.map(d => ({
      id: d.id,
      data: () => d,
      exists: true,
      get: (field) => d[field]
    }));
    return {
      docs: docList,
      empty: docList.length === 0,
      size: docList.length,
      forEach: (fn) => docList.forEach(fn)
    };
  }

  // Fake DocumentSnapshot
  function makeDocSnap(doc) {
    return {
      id: doc ? doc.id : null,
      exists: !!doc,
      data: () => doc || {},
      get: (field) => doc ? doc[field] : undefined
    };
  }

  // Query builder
  function makeQuery(collection, filters = {}, orderField = null) {
    return {
      _collection: collection,
      _filters: filters,
      _order: orderField,
      where(field, op, value) {
        const newFilters = { ...filters, [field]: value };
        return makeQuery(collection, newFilters, orderField);
      },
      orderBy(field) {
        return makeQuery(collection, filters, field);
      },
      limit(n) {
        return this; // WarenVault returns all; client can slice
      },
      async get() {
        const docs = await apiGet(collection, filters);
        return makeSnap(Array.isArray(docs) ? docs : []);
      },
      async add(data) {
        const doc = await apiPost(collection, data);
        return { id: doc.id };
      }
    };
  }

  // Fake DocumentReference
  function makeDocRef(collection, id) {
    return {
      id,
      async get() {
        try {
          const r = await fetch(`${API}/nest/${collection}/${id}`);
          if (!r.ok) return makeDocSnap(null);
          const doc = await r.json();
          return makeDocSnap(doc);
        } catch {
          return makeDocSnap(null);
        }
      },
      async set(data) {
        await fetch(`${API}/nest/${collection}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...data })
        });
      },
      async update(data) {
        await fetch(`${API}/nest/${collection}/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      },
      async delete() {
        await apiDelete(collection, id);
      },
      collection(sub) {
        return makeQuery(`${collection}_${sub}`);
      }
    };
  }

  // Fake CollectionReference
  function makeCollectionRef(collection) {
    return {
      _collection: collection,
      doc(id) {
        return makeDocRef(collection, id);
      },
      where(field, op, value) {
        return makeQuery(collection, { [field]: value });
      },
      orderBy(field) {
        return makeQuery(collection, {}, field);
      },
      limit(n) {
        return makeQuery(collection);
      },
      async get() {
        const docs = await apiGet(collection);
        return makeSnap(Array.isArray(docs) ? docs : []);
      },
      async add(data) {
        const doc = await apiPost(collection, data);
        return { id: doc.id };
      }
    };
  }

  // Fake Firestore instance
  const fakeFirestore = {
    collection(name) {
      return makeCollectionRef(name);
    },
    FieldValue: {
      serverTimestamp: () => new Date().toISOString(),
      arrayUnion: (...items) => items,
      arrayRemove: (...items) => items,
      increment: (n) => n
    }
  };

  // Override firebase.firestore()
  // Wait for firebase to be defined first
  function installShim() {
    if (typeof firebase !== 'undefined') {
      firebase.firestore = () => fakeFirestore;
      // Also patch the static FieldValue
      if (firebase.firestore) {
        firebase.firestore.FieldValue = fakeFirestore.FieldValue;
      }
      console.log('[WarenVault Shim] Firestore redirected to', API);
    } else {
      setTimeout(installShim, 100);
    }
  }

  installShim();
})();
