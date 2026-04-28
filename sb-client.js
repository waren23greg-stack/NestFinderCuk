// fb-client.js — Firebase replacement for sb-client.js
// Drop-in wrapper: same API surface as the old Supabase client
// Requires Firebase SDK scripts loaded before this file in HTML:
//
//   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-storage-compat.js"></script>
//   <script src="sb-client.js"></script>

function createClient(firebaseConfig) {
  // ── init ──────────────────────────────────────────────────────────────────
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  var _app  = firebase.app();
  var _auth = firebase.auth();
  var _db   = firebase.firestore();
  var _stor = firebase.storage();

  // ── auth ──────────────────────────────────────────────────────────────────
  var auth = {

    getUser: function () {
      return new Promise(function (resolve) {
        var user = _auth.currentUser;
        if (user) {
          resolve({ data: { user: { id: user.uid, email: user.email } }, error: null });
        } else {
          _auth.onAuthStateChanged(function (u) {
            resolve({ data: { user: u ? { id: u.uid, email: u.email } : null }, error: null });
          });
        }
      });
    },

    signInWithPassword: function (opts) {
      return _auth.signInWithEmailAndPassword(opts.email, opts.password)
        .then(function (cred) {
          var u = cred.user;
          return { data: { user: { id: u.uid, email: u.email }, session: cred }, error: null };
        })
        .catch(function (err) {
          return { data: { user: null }, error: { message: err.message } };
        });
    },

    signUp: function (opts) {
      return _auth.createUserWithEmailAndPassword(opts.email, opts.password)
        .then(function (cred) {
          var u = cred.user;
          var displayName = (opts.options && opts.options.data && opts.options.data.full_name) || '';
          // create user doc in Firestore
          return _db.collection('users').doc(u.uid).set({
            uid: u.uid,
            email: u.email,
            display_name: displayName,
            role: 'student',
            created_at: firebase.firestore.FieldValue.serverTimestamp()
          }).then(function () {
            return { data: { user: { id: u.uid, email: u.email } }, error: null };
          });
        })
        .catch(function (err) {
          return { data: {}, error: { message: err.message } };
        });
    },

    signOut: function () {
      return _auth.signOut()
        .then(function () { return { error: null }; })
        .catch(function (err) { return { error: { message: err.message } }; });
    },

    onAuthStateChange: function (callback) {
      var unsubscribe = _auth.onAuthStateChanged(function (user) {
        if (user) {
          callback('SIGNED_IN', { user: { id: user.uid, email: user.email } });
        } else {
          callback('SIGNED_OUT', null);
        }
      });
      return { data: { subscription: { unsubscribe: unsubscribe } } };
    },

    updateUser: function (attrs) {
      var user = _auth.currentUser;
      if (!user) return Promise.resolve({ data: null, error: { message: 'Not logged in' } });
      var promises = [];
      if (attrs.password) {
        promises.push(user.updatePassword(attrs.password));
      }
      if (attrs.email) {
        promises.push(user.updateEmail(attrs.email));
      }
      return Promise.all(promises)
        .then(function () {
          return { data: { user: { id: user.uid, email: user.email } }, error: null };
        })
        .catch(function (err) {
          return { data: null, error: { message: err.message } };
        });
    }
  };

  // ── storage ───────────────────────────────────────────────────────────────
  var storage = {
    from: function (bucket) {
      return {
        upload: function (path, file) {
          var ref = _stor.ref(bucket + '/' + path);
          return ref.put(file)
            .then(function () {
              return { data: { path: path }, error: null };
            })
            .catch(function (err) {
              return { data: null, error: { message: err.message } };
            });
        },
        getPublicUrl: function (path) {
          var url = 'https://firebasestorage.googleapis.com/v0/b/' +
            _app.options.storageBucket + '/o/' +
            encodeURIComponent(bucket + '/' + path) + '?alt=media';
          return { data: { publicUrl: url } };
        }
      };
    }
  };

  // ── query builder (mirrors Supabase .from() API) ──────────────────────────
  function from(collection) {
    var _wheres  = [];   // [{field, op, value}]
    var _orderBy = null; // {field, dir}
    var _limitN  = null;
    var _single  = false;
    var _maybeSingle = false;

    // map Supabase operator names → Firestore operators
    var opMap = { eq: '==', neq: '!=', gt: '>', gte: '>=', lt: '<', lte: '<=' };

    var q = {
      select: function () { return q; }, // no-op — Firestore returns all fields

      eq: function (field, value) {
        _wheres.push({ field: field, op: '==', value: value });
        return q;
      },

      neq: function (field, value) {
        _wheres.push({ field: field, op: '!=', value: value });
        return q;
      },

      order: function (field, opts) {
        _orderBy = { field: field, dir: (opts && opts.ascending === false) ? 'desc' : 'asc' };
        return q;
      },

      limit: function (n) {
        _limitN = n;
        return q;
      },

      single: function () {
        _single = true;
        return q;
      },

      maybeSingle: function () {
        _maybeSingle = true;
        return q;
      },

      // ── INSERT ────────────────────────────────────────────────────────────
      insert: function (data) {
        var records = Array.isArray(data) ? data : [data];
        var promises = records.map(function (record) {
          var docRef = record.id
            ? _db.collection(collection).doc(String(record.id))
            : _db.collection(collection).doc();
          var payload = Object.assign({}, record, {
            created_at: record.created_at || firebase.firestore.FieldValue.serverTimestamp()
          });
          return docRef.set(payload).then(function () {
            return Object.assign({ _id: docRef.id }, payload);
          });
        });
        return Promise.all(promises)
          .then(function (docs) {
            return { data: docs, error: null };
          })
          .catch(function (err) {
            return { data: null, error: { message: err.message } };
          });
      },

      // ── UPDATE ────────────────────────────────────────────────────────────
      update: function (data) {
        return {
          eq: function (field, value) {
            var ref = _db.collection(collection);
            var query = ref.where(field, '==', value);
            return query.get()
              .then(function (snap) {
                var batch = _db.batch();
                snap.forEach(function (doc) {
                  batch.update(doc.ref, Object.assign({}, data, {
                    updated_at: firebase.firestore.FieldValue.serverTimestamp()
                  }));
                });
                return batch.commit();
              })
              .then(function () { return { data: null, error: null }; })
              .catch(function (err) { return { data: null, error: { message: err.message } }; });
          }
        };
      },

      // ── DELETE ────────────────────────────────────────────────────────────
      delete: function () {
        return {
          eq: function (field, value) {
            var ref = _db.collection(collection);
            var query = ref.where(field, '==', value);
            return query.get()
              .then(function (snap) {
                var batch = _db.batch();
                snap.forEach(function (doc) { batch.delete(doc.ref); });
                return batch.commit();
              })
              .then(function () { return { data: null, error: null }; })
              .catch(function (err) { return { data: null, error: { message: err.message } }; });
          }
        };
      },

      // ── SELECT (thenable) ─────────────────────────────────────────────────
      then: function (resolve, reject) {
        var ref = _db.collection(collection);

        // apply where filters
        _wheres.forEach(function (w) {
          ref = ref.where(w.field, w.op, w.value);
        });

        // apply orderBy
        if (_orderBy) {
          ref = ref.orderBy(_orderBy.field, _orderBy.dir);
        }

        // apply limit
        if (_limitN) {
          ref = ref.limit(_limitN);
        }

        return ref.get()
          .then(function (snap) {
            var docs = [];
            snap.forEach(function (doc) {
              docs.push(Object.assign({ _id: doc.id }, doc.data()));
            });

            if (_single || _maybeSingle) {
              resolve({ data: docs[0] || null, error: null });
            } else {
              resolve({ data: docs, error: null });
            }
          })
          .catch(function (err) {
            resolve({ data: null, error: { message: err.message } });
          });
      }
    };

    return q;
  }

  // ── public API ────────────────────────────────────────────────────────────
  return {
    auth: auth,
    storage: storage,
    from: function (collection) { return from(collection); }
  };
}