// firebase-init.js
// Run once: node firebase-init.js
// Initializes all Firestore collections for NestFinder CUK
// Requires: serviceAccountKey.json in project root

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
db.settings({ databaseId: '(default)' });

// ─── helpers ────────────────────────────────────────────────────────────────

const now = admin.firestore.FieldValue.serverTimestamp();

async function seedCollection(collectionName, docId, data) {
  const ref = db.collection(collectionName).doc(docId);
  const snap = await ref.get();
  if (snap.exists) {
    console.log(`  ⚠  ${collectionName}/${docId} already exists — skipped`);
    return;
  }
  await ref.set(data);
  console.log(`  ✓  ${collectionName}/${docId}`);
}

// ─── run ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🔥 NestFinder CUK — Firebase init\n");

  // ── 1. users ──────────────────────────────────────────────────────────────
  // Mirrors: profiles table in Supabase
  // Created automatically on first sign-in via Firebase Auth trigger.
  // Seed a schema-doc so the collection is visible in the console.
  console.log("users");
  await seedCollection("users", "_schema", {
    _note: "Schema reference — delete after review",
    uid: "firebase-auth-uid",
    email: "student@cuk.ac.ke",
    display_name: "Jane Mwangi",
    role: "student",             // "student" | "admin"
    phone: "+254700000000",
    created_at: now,
    updated_at: now,
  });

  // ── 2. listings ───────────────────────────────────────────────────────────
  // Mirrors: listings table in Supabase
  console.log("listings");
  await seedCollection("listings", "_schema", {
    _note: "Schema reference — delete after review",
    title: "Spacious bedsitter near CUK gate",
    description: "Clean, secure, walking distance from CUK main gate.",
    price_ksh: 5000,
    location: "Ongata Rongai",
    distance_from_cuk_km: 0.4,
    room_type: "bedsitter",      // "bedsitter" | "single" | "double" | "studio"
    amenities: ["wifi", "water", "security"],
    photos: [
      "https://firebasestorage.googleapis.com/..."
    ],
    caretaker_id: "caretaker-doc-id",
    is_verified: false,
    is_available: true,
    avg_rating: 0,
    review_count: 0,
    created_by: "admin-uid",
    created_at: now,
    updated_at: now,
  });

  // ── 3. caretaker_contacts ─────────────────────────────────────────────────
  // Mirrors: caretaker_contacts table in Supabase
  // Protected by Firestore rules — only readable after confirmed payment
  console.log("caretaker_contacts");
  await seedCollection("caretaker_contacts", "_schema", {
    _note: "Schema reference — delete after review",
    listing_id: "listing-doc-id",
    caretaker_name: "Mr. Kamau",
    phone: "+254711000000",
    whatsapp: "+254711000000",
    extra_notes: "Call after 8am",
    created_at: now,
  });

  // ── 4. payments ───────────────────────────────────────────────────────────
  // Mirrors: payments table in Supabase
  // Written by Vercel M-Pesa callback function using Admin SDK
  console.log("payments");
  await seedCollection("payments", "_schema", {
    _note: "Schema reference — delete after review",
    uid: "student-uid",
    listing_id: "listing-doc-id",
    amount_ksh: 250,
    mpesa_code: "QHX4Y3Z1AB",
    phone: "+254712345678",
    status: "pending",           // "pending" | "confirmed" | "rejected"
    payment_type: "listing",     // "listing" | "storage"
    confirmed_by: null,          // admin uid, set on confirmation
    confirmed_at: null,
    created_at: now,
  });

  // ── 5. favourites ─────────────────────────────────────────────────────────
  // Mirrors: favourites table in Supabase
  console.log("favourites");
  await seedCollection("favourites", "_schema", {
    _note: "Schema reference — delete after review",
    uid: "student-uid",
    listing_id: "listing-doc-id",
    created_at: now,
  });

  // ── 6. reviews ────────────────────────────────────────────────────────────
  // Mirrors: reviews table in Supabase
  console.log("reviews");
  await seedCollection("reviews", "_schema", {
    _note: "Schema reference — delete after review",
    uid: "student-uid",
    listing_id: "listing-doc-id",
    rating: 4,                   // 1–5
    comment: "Great place, very clean.",
    created_at: now,
  });

  // ── 7. reports ────────────────────────────────────────────────────────────
  // Mirrors: reports table in Supabase
  console.log("reports");
  await seedCollection("reports", "_schema", {
    _note: "Schema reference — delete after review",
    uid: "student-uid",
    listing_id: "listing-doc-id",
    reason: "Fake photos",
    details: "The photos don't match the actual room.",
    status: "open",              // "open" | "resolved" | "dismissed"
    created_at: now,
  });

  // ── 8. storage_hosts ──────────────────────────────────────────────────────
  // NEW: People offering to host students' belongings during holidays
  console.log("storage_hosts");
  await seedCollection("storage_hosts", "_schema", {
    _note: "Schema reference — delete after review",
    uid: "host-uid",
    display_name: "Alice Njeri",
    phone: "+254722000000",
    location: "Ongata Rongai",
    area_description: "Near Tumaini Mall, 2nd floor flat",
    price_per_bag_ksh: 200,
    price_per_box_ksh: 150,
    available_from: "2025-04-01",
    available_until: "2025-09-30",
    capacity_bags: 10,
    capacity_boxes: 5,
    item_types_accepted: ["clothes", "books", "electronics", "kitchenware"],
    storage_photos: [],
    is_active: true,
    verification_status: "approved",  // must be approved to list
    avg_rating: 0,
    review_count: 0,
    created_at: now,
    updated_at: now,
  });

  // ── 9. storage_seekers ────────────────────────────────────────────────────
  // NEW: Students looking for someone to host their belongings
  console.log("storage_seekers");
  await seedCollection("storage_seekers", "_schema", {
    _note: "Schema reference — delete after review",
    uid: "seeker-uid",
    display_name: "Brian Omondi",
    phone: "+254733000000",
    location: "Ongata Rongai",
    move_out_date: "2025-04-15",
    move_back_date: "2025-09-01",
    bag_count: 3,
    box_count: 2,
    item_description: "Clothes, textbooks, small TV",
    budget_ksh: 1500,
    status: "open",              // "open" | "matched" | "closed"
    matched_host_id: null,
    created_at: now,
    updated_at: now,
  });

  // ── 10. storage_bookings ──────────────────────────────────────────────────
  // NEW: Confirmed storage arrangements between host and seeker
  console.log("storage_bookings");
  await seedCollection("storage_bookings", "_schema", {
    _note: "Schema reference — delete after review",
    host_id: "storage-host-doc-id",
    seeker_uid: "student-uid",
    payment_id: "payment-doc-id",
    agreed_price_ksh: 1200,
    move_out_date: "2025-04-15",
    move_back_date: "2025-09-01",
    bag_count: 3,
    box_count: 2,
    status: "active",            // "active" | "completed" | "disputed"
    host_contact_unlocked: false,
    created_at: now,
  });

  // ── 11. host_verifications ────────────────────────────────────────────────
  // NEW: Identity verification for anyone wanting to host for payment
  console.log("host_verifications");
  await seedCollection("host_verifications", "_schema", {
    _note: "Schema reference — delete after review",
    uid: "applicant-uid",
    full_name: "Alice Njeri Kamau",
    national_id_number: "12345678",
    phone: "+254722000000",
    face_photo_url: "gs://your-bucket/verifications/uid/face.jpg",
    id_front_url: "gs://your-bucket/verifications/uid/id_front.jpg",
    id_back_url: "gs://your-bucket/verifications/uid/id_back.jpg",
    status: "pending",           // "pending" | "approved" | "rejected"
    submitted_at: now,
    reviewed_at: null,
    reviewed_by: null,           // admin uid
    rejection_reason: null,
  });

  console.log("\n✅ Done. Check your Firebase console.\n");
  console.log(
    "Next steps:\n" +
    "  1. Confirm all 11 collections are visible in the console\n" +
    "  2. Delete the _schema documents (they're just for reference)\n" +
    "  3. Run: node firebase-init.js  (safe to re-run — won't overwrite)\n"
  );

  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ Full error:", JSON.stringify(err, null, 2));
  console.error("\n❌ Message:", err.message);
  console.error("\n❌ Code:", err.code);
  process.exit(1);
});