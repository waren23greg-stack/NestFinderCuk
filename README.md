# NestFinder CUK 🏠

> **Safe, verified student housing near the Cooperative University of Kenya — and Airbnb-style short stays.**

Live at → **[nestfindercuk.rocks](https://nestfindercuk.rocks)**

---

## What It Does

NestFinder CUK is a full-stack housing platform built specifically for CUK students. It solves the problem of students arriving in Gataka and Rongai with nowhere to stay — by listing verified, photo-verified rooms with real caretaker contacts unlocked through a one-time M-Pesa payment.

It also supports **Airbnb-style short-stay listings** for guests, visitors, and students who need temporary accommodation.

---

## Features

### For Students / Guests
- Browse verified listings with real photos — free, no sign-in required
- Filter by room type, price, amenities (water, WiFi), availability
- Filter by listing type — Student Rental or Airbnb / Short Stay
- View approximate location map per listing
- Save favourites (persisted locally)
- Pay via M-Pesa to unlock caretaker contact (one-time fee)
- Promo/referral code system — refer a friend, they unlock contact free
- Rate and review listings after moving in
- Report suspicious listings
- Submit and track M-Pesa payment status in real time

### For Airbnb Listings
- Per-night pricing, max guests, minimum nights
- Date picker (check-in / check-out) at booking
- Short Stay badge on listing cards
- Booking fee: Ksh 150

### For Admin
- Secure admin panel (role-based access)
- Add, edit, delete listings with photo upload
- Set listing type: Student Rental or Airbnb / Short Stay
- Search and pin location (Nominatim geocoding saves lat/lng)
- Confirm or deny M-Pesa payments
- View all student profiles and payment history
- Generate referral promo codes on payment confirmation
- Receive email notification on new payment submission
- M-Pesa STK push integration (Safaricom Daraja API)
- Report management

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML, CSS, JS |
| Backend DB | Supabase (PostgreSQL + Auth + Storage) |
| API Routes | Vercel Serverless Functions (Node.js) |
| Payments | M-Pesa Daraja API (STK Push + Callback) |
| Email | Resend |
| Maps | Leaflet + OpenStreetMap |
| Hosting | Vercel |
| Assets | Supabase Storage |

---

## Project StructureNestFinder-CUK/
├── index.html
├── admin.html
├── login.html
├── api/
│   ├── mpesa-stk.js
│   ├── mpesa-callback.js
│   ├── mpesa-check.js
│   ├── notify.js
│   ├── notify-student.js
│   ├── generate-promo.js
│   ├── redeem-promo.js
│   ├── report.js
│   └── security.js
├── sw.js
├── vercel.json
└── README.md

---

## Environment VariablesSUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=
RESEND_API_KEY=
ADMIN_EMAIL=

---

## Local Development
```bashgit clone https://github.com/waren23greg-stack/NestFinderCuk.git
cd NestFinderCuk
npm i -g vercel
vercel dev

---

## License

Private — © 2025 NestFinder CUK. All rights reserved.
