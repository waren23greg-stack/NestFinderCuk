// import-to-firestore.js  (fixed)
// Run: node import-to-firestore.js

const admin = require("firebase-admin");
const fs    = require("fs");

// ── Robust CSV parser (handles quoted fields with embedded commas/newlines) ──
function parseCSV(text) {
  const rows = [];
  let headers = null;
  let cur = "", inQ = false, fields = [];

  const flush = () => { fields.push(cur); cur = ""; };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQ && text[i+1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === ',' && !inQ) {
      flush();
    } else if ((c === '\n' || c === '\r') && !inQ) {
      if (c === '\r' && text[i+1] === '\n') i++;
      flush();
      if (fields.some(f => f !== "")) {
        if (!headers) { headers = fields; }
        else {
          const obj = {};
          headers.forEach((h, idx) => { obj[h] = fields[idx] ?? ""; });
          rows.push(obj);
        }
      }
      fields = [];
    } else {
      cur += c;
    }
  }
  // last line
  flush();
  if (fields.some(f => f !== "") && headers) {
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = fields[idx] ?? ""; });
    rows.push(obj);
  }
  return rows;
}

function coerce(val) {
  if (val === "null" || val === "") return null;
  if (val === "true")  return true;
  if (val === "false") return false;
  if (!isNaN(val) && val.trim() !== "") return Number(val);
  try {
    const p = JSON.parse(val);
    if (Array.isArray(p) || (typeof p === "object" && p !== null)) return p;
  } catch(e) {}
  return val;
}

function coerceRow(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) out[k] = coerce(v);
  return out;
}

// ── Firebase Admin init ──────────────────────────────────────────────────────
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: serviceAccount.project_id, databaseURL: "https://nestfinder-cuk-default-rtdb.firebaseio.com" });
const db = admin.firestore();
db.settings({ databaseId: "(default)", ignoreUndefinedProperties: true });

async function importCollection(colName, rows, idField = "id") {
  // Filter rows with invalid IDs
  const valid = rows.filter(r => r[idField] && String(r[idField]).trim() !== "" && !String(r[idField]).includes("/"));
  const skipped = rows.length - valid.length;
  if (skipped) console.log(`  ⚠ Skipped ${skipped} rows with invalid IDs`);
  console.log(`\nImporting ${valid.length} docs into [${colName}]...`);

  // Batch in groups of 400 (Firestore limit is 500)
  for (let i = 0; i < valid.length; i += 400) {
    const batch = db.batch();
    valid.slice(i, i + 400).forEach(row => {
      const data   = coerceRow(row);
      const docId  = String(data[idField] || db.collection(colName).doc().id).trim();
      delete data[idField];
      batch.set(db.collection(colName).doc(docId), data, { merge: true });
    });
    await batch.commit();
  }
  console.log(`  ✓ ${valid.length} docs written to [${colName}]`);
}

async function main() {
  console.log("\n🔥 NestFinder CUK — Supabase → Firestore import\n");

  // listings
  const listingsRaw  = parseCSV(fs.readFileSync("listings.csv", "utf8"));
  console.log("Parsed listing rows:", listingsRaw.length);
  const listings = listingsRaw.map(l => ({
    id:              l.id,
    title:           l.title,
    room_type:       l.type,
    price_ksh:       l.price,
    location:        l.location,
    description:     l.description,
    water_included:  l.water_included,
    wifi_available:  l.wifi_available,
    is_available:    l.available,
    is_verified:     "true",
    photos:          l.photos,
    contact_fee:     l.contact_fee,
    listing_type:    l.listing_type,
    price_per_night: l.price_per_night,
    max_guests:      l.max_guests,
    amenities:       l.amenities,
    min_nights:      l.min_nights,
    latitude:        l.latitude,
    longitude:       l.longitude,
    created_at:      l.created_at,
    avg_rating:      "0",
    review_count:    "0",
  }));
  await importCollection("listings", listings);

  // caretaker_contacts
  if (fs.existsSync("caretaker_contacts.csv")) {
    const ccRaw = parseCSV(fs.readFileSync("caretaker_contacts.csv", "utf8"));
    console.log("Parsed caretaker rows:", ccRaw.length);
    const cc = ccRaw.map(c => ({
      id:             c.id,
      listing_id:     c.listing_id,
      caretaker_name: c.caretaker_name,
      phone:          c.phone,
    }));
    await importCollection("caretaker_contacts", cc);
  }

  console.log("\n✅ Import complete! Check Firebase Console → Firestore.\n");
  process.exit(0);
}

main().catch(err => {
  console.error("\n❌ Error:", err.message, err.stack);
  process.exit(1);
});
