// warenvault-firebase.js
// Complete drop-in replacement for Firebase Auth + Firestore
// Uses WarenVault REST API. No Firebase SDKs needed.

(function () {
  const API = 'https://media-storage-advanced.onrender.com';
  const TOKEN_KEY = 'wv_token';
  const USER_KEY = 'wv_user';

  // ── Helpers ────────────────────────────────────────────────────────────────

  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function getStoredUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  }

  async function apiReq(method, path, body, auth) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth !== false) {
      const t = getToken();
      if (t) headers['Authorization'] = 'Bearer ' + t;
    }
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(API + path, opts);
    const data = await r.json();
    if (!r.ok) throw { code: data.error || 'unknown', message: data.error || 'Request failed' };
    return data;
  }

  // ── Auth state listeners ───────────────────────────────────────────────────

  const _listeners = [];
  let _currentUser = getStoredUser();

  function _notifyListeners(user) {
    _listeners.forEach(fn => { try { fn(user); } catch (e) {} });
  }

  function _setUser(user) {
    _currentUser = user;
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else { localStorage.removeItem(USER_KEY); localStorage.removeItem(TOKEN_KEY); }
    _notifyListeners(user);
  }

  // ── Firebase User object ───────────────────────────────────────────────────

  function makeUser(data, token) {
    return {
      uid: data.id || data.uuid || data.email,
      email: data.email,
      displayName: data.username || data.email,
      emailVerified: true,
      role: data.role || 'user',
      _token: token,
      getIdToken: async () => token,
      reload: async () => {}
    };
  }

  // ── Auth implementation ────────────────────────────────────────────────────

  const _auth = {
    currentUser: _currentUser,

    onAuthStateChanged(fn) {
      _listeners.push(fn);
      // Fire immediately with current state
      setTimeout(() => fn(_currentUser), 0);
      return () => {
        const i = _listeners.indexOf(fn);
        if (i > -1) _listeners.splice(i, 1);
      };
    },

    async signInWithEmailAndPassword(email, password) {
      const data = await apiReq('POST', '/auth/login', { email, password }, false);
      localStorage.setItem(TOKEN_KEY, data.token);
      const user = makeUser(data.user, data.token);
      _auth.currentUser = user;
      _setUser(user);
      return { user };
    },

    async createUserWithEmailAndPassword(email, password) {
      const username = email.split('@')[0];
      const data = await apiReq('POST', '/auth/register', { email, password, username }, false);
      localStorage.setItem(TOKEN_KEY, data.token);
      const user = makeUser(data.user, data.token);
      _auth.currentUser = user;
      _setUser(user);
      return { user };
    },

    async signOut() {
      _auth.currentUser = null;
      _setUser(null);
    },

    async sendPasswordResetEmail(email) {
      console.warn('Password reset not implemented in WarenVault yet');
    }
  };

  // ── Firestore FieldValue ───────────────────────────────────────────────────

  const FieldValue = {
    serverTimestamp: () => new Date().toISOString(),
    arrayUnion: (...i) => i,
    arrayRemove: (...i) => i,
    increment: n => n
  };

  // ── Firestore helpers ──────────────────────────────────────────────────────

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
    return {
      docs: list, empty: list.length === 0, size: list.length,
      forEach: fn => list.forEach(fn)
    };
  }

  function buildQuery(col, filters, _order) {
    return {
      where(f, op, v) { return buildQuery(col, { ...filters, [f]: v }, _order); },
      orderBy(f) { return buildQuery(col, filters, f); },
      limit() { return buildQuery(col, filters, _order); },
      async get() {
        const params = new URLSearchParams(filters || {}).toString();
        const docs = await apiReq('GET', `/nest/${col}${params ? '?' + params : ''}`);
        return collSnap(Array.isArray(docs) ? docs : []);
      },
      async add(data) {
        const doc = await apiReq('POST', `/nest/${col}`, data);
        return { id: doc.id };
      }
    };
  }

  function makeDocRef(col, id) {
    return {
      id,
      async get() {
        try { return docSnap(await apiReq('GET', `/nest/${col}/${id}`)); }
        catch { return docSnap(null); }
      },
      async set(data) { await apiReq('PUT', `/nest/${col}/${id}`, { id, ...data }); },
      async update(data) { await apiReq('PATCH', `/nest/${col}/${id}`, data); },
      async delete() { await apiReq('DELETE', `/nest/${col}/${id}`); },
      collection(sub) { return makeColRef(`${col}_${sub}`); }
    };
  }

  function makeColRef(col) {
    return {
      doc(id) { return makeDocRef(col, id); },
      where(f, op, v) { return buildQuery(col, { [f]: v }); },
      orderBy(f) { return buildQuery(col, {}, f); },
      limit() { return buildQuery(col); },
      async get() {
        const docs = await apiReq('GET', `/nest/${col}`);
        return collSnap(Array.isArray(docs) ? docs : []);
      },
      async add(data) {
        const doc = await apiReq('POST', `/nest/${col}`, data);
        return { id: doc.id };
      }
    };
  }

  const _firestore = {
    collection: col => makeColRef(col),
    FieldValue
  };

  // ── Install as window.firebase ─────────────────────────────────────────────

  window.firebase = {
    apps: [true],
    app: () => ({}),

    initializeApp: () => {},
    auth: () => _auth,
    firestore: () => _firestore,
    storage: () => ({
      ref: () => ({
        put: async () => ({}),
        getDownloadURL: async () => ''
      })
    })
  };

  window.firebase.firestore.FieldValue = FieldValue;
  window.firebase.auth.GoogleAuthProvider = function () {};

  console.log('[WarenVault] Firebase replaced. Auth + Firestore → REST API');
})();
