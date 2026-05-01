// import-firestore.js
// Run: node import-firestore.js
// Requires: npm install firebase-admin csv-parse

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Load service account key from same folder
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount), projectId: 'nestfinder-cuk'
});

const db = admin.firestore();

function parsePhotos(raw) {
  if (!raw) return [];
  try {
    // Remove outer quotes and parse JSON array
    const cleaned = raw.replace(/^"+|"+$/g, '').replace(/""/g, '"');
    const arr = JSON.parse(cleaned);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function parseBool(val) {
  if (val === 'true') return true;
  if (val === 'false') return false;
  return null;
}

function parseNum(val) {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

async function importListings() {
  const raw = fs.readFileSync(path.join(__dirname, 'listings.csv'), 'utf8');
  const records = parse(raw, { columns: true, skip_empty_lines: true, relax_quotes: true });

  console.log(`Importing ${records.length} listings...`);
  const batch = db.batch();

  for (const r of records) {
    const ref = db.collection('listings').doc(r.id);
    batch.set(ref, {
      id: r.id,
      title: r.title || '',
      type: r.type || '',
      price: parseNum(r.price),
      location: r.location || '',
      description: r.description || '',
      water_included: parseBool(r.water_included),
      wifi_available: parseBool(r.wifi_available),
      available: parseBool(r.available) !== false,
      photos: parsePhotos(r.photos),
      created_at: r.created_at || '',
      contact_fee: parseNum(r.contact_fee),
      listing_type: r.listing_type || 'rental',
      price_per_night: parseNum(r.price_per_night),
      max_guests: parseNum(r.max_guests),
      amenities: r.amenities || '',
      min_nights: parseNum(r.min_nights),
      latitude: parseNum(r.latitude),
      longitude: parseNum(r.longitude),
    });
  }

  await batch.commit();
  console.log('Listings imported successfully.');
}

async function importCaretakers() {
  const raw = fs.readFileSync(path.join(__dirname, 'caretaker_contacts.csv'), 'utf8');
  const records = parse(raw, { columns: true, skip_empty_lines: true });

  console.log(`Importing ${records.length} caretaker contacts...`);
  const batch = db.batch();

  for (const r of records) {
    const ref = db.collection('caretaker_contacts').doc(r.id);
    batch.set(ref, {
      id: r.id,
      listing_id: r.listing_id || '',
      caretaker_name: r.caretaker_name || '',
      phone: r.phone || '',
      user_id: r.user_id || null,
    });
  }

  await batch.commit();
  console.log('Caretaker contacts imported successfully.');
}

(async () => {
  try {
    await importListings();
    await importCaretakers();
    console.log('All done!');
    process.exit(0);
  } catch (err) {
    console.error('Import failed:', err);
    process.exit(1);
  }
})();
