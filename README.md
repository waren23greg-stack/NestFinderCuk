# NestFinder CUK

> **Find Your Perfect Student Home Near The Cooperative University of Kenya**

A luxury student housing platform built for CUK students. Browse verified listings, view real photos for free, and pay Ksh 250 once to unlock the caretaker's contact. No scammers. No wasted trips.

🌐 **Live Site:** [nest-finder-cuk.vercel.app](https://nest-finder-cuk.vercel.app)

---

## Screenshots

| Home | Listings | Admin Panel |
|------|----------|-------------|
| Dark luxury hero with Nairobi skyline | Real photos with Trinity Property watermark | Full CRUD listings management |

---

## Features

- **Browse listings** — Real photos, room types, amenities, distance from CUK
- **M-Pesa payments** — Students pay Ksh 250 to unlock caretaker contact
- **Admin panel** — Add, edit, delete listings with photo uploads
- **Favourites** — Save listings, synced to Supabase across devices
- **Reviews** — Students rate and review listings
- **Search & filter** — By location, room type, price, water, WiFi
- **PWA** — Installable on Android, iPhone, and desktop
- **Email notifications** — Admin notified on payment, student notified on confirmation
- **Security** — XSS sanitization, security headers, rate limiting on APIs
- **Trinity Property watermark** — Tiled across all listing photos

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend & Database | Supabase (PostgreSQL + Auth + Storage) |
| Payments | M-Pesa Daraja API (manual flow) |
| Email | Resend API |
| Hosting | Vercel (with Serverless Functions) |
| Version Control | GitHub |

---

## Project Structure

```
nestfinder-cuk/
├── index.html              # Main listings page
├── login.html              # Student auth (sign in / sign up)
├── admin.html              # Admin panel (listings, payments, students, reports)
├── payments.html           # Student payment history
├── privacy.html            # Privacy policy
├── terms.html              # Terms & conditions
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker (offline support)
├── favicon.svg             # Trinity T+house favicon
├── trinity-logo.svg        # Full NestFinder CUK logo
├── sb-client.js            # Custom Supabase fetch client (no CDN)
├── robots.txt              # SEO robots
├── sitemap.xml             # SEO sitemap
├── vercel.json             # Vercel config + security headers
├── package.json            # Node dependencies
└── api/
    ├── mpesa-stk.js        # M-Pesa STK push
    ├── mpesa-callback.js   # M-Pesa payment callback
    ├── mpesa-check.js      # Payment status checker
    ├── notify.js           # Email admin on payment submission
    ├── notify-student.js   # Email student on payment confirmation
    └── report.js           # Listing report handler
```

---

## Database Schema

```sql
profiles          -- Student accounts (extends Supabase auth)
listings          -- House listings with photos, amenities
caretaker_contacts -- Hidden until payment confirmed
payments          -- M-Pesa payment records
favourites        -- Student saved listings
reviews           -- Student ratings and comments
reports           -- Listing reports from students
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account (free)
- Vercel account (free)
- Safaricom Daraja account (sandbox or live)
- Resend account (free, 100 emails/day)

### 1. Clone the repo
```bash
git clone https://github.com/waren23greg-stack/NestFinderCuk.git
cd NestFinderCuk
```

### 2. Set up Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema from the setup guide
3. Create a `house-photos` storage bucket (public)
4. Copy your Project URL and anon key

### 3. Deploy to Vercel
1. Push to GitHub
2. Import repo at [vercel.com](https://vercel.com)
3. Add environment variables:

| Variable | Description |
|----------|-------------|
| `MPESA_CONSUMER_KEY` | Daraja app consumer key |
| `MPESA_CONSUMER_SECRET` | Daraja app consumer secret |
| `MPESA_SHORTCODE` | Till/Paybill number (174379 for sandbox) |
| `MPESA_PASSKEY` | Daraja passkey |
| `MPESA_ENV` | `sandbox` or `live` |
| `MPESA_CALLBACK_URL` | `https://your-site.vercel.app/api/mpesa-callback` |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service_role key |
| `RESEND_API_KEY` | Resend API key for emails |
| `ADMIN_EMAIL` | Your email for payment notifications |

### 4. Make yourself admin
```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'your@email.com');
```

---

## M-Pesa Payment Flow

```
Student clicks "Get Contact"
        ↓
Enters M-Pesa confirmation code
        ↓
Payment saved as "pending" in Supabase
        ↓
Admin receives email notification
        ↓
Admin confirms in admin panel
        ↓
Caretaker contact unlocks for student
Student receives confirmation email
```

> **Going live:** Visit any Safaricom shop with your National ID + KRA PIN to get a free Till number. Update `MPESA_SHORTCODE` in Vercel env variables and payments confirm automatically.

---

## Security

- **X-Frame-Options: DENY** — prevents clickjacking
- **X-XSS-Protection** — browser-level XSS filter
- **Strict-Transport-Security** — enforces HTTPS
- **Referrer-Policy** — strict origin control
- **Input sanitization** — all user data escaped before rendering
- **Rate limiting** — 20 requests/minute per IP on API routes
- **Supabase RLS** — row-level security on all tables

---

## Roadmap

- [ ] Safaricom Till number for automatic payment confirmation
- [ ] Custom domain (nestfinder.co.ke)
- [ ] Email verification on signup
- [ ] Google Maps integration
- [ ] Listing expiry notifications
- [ ] Multi-university support

---

## Built By

**Trinity (Grege Warren)** — CUK Student, Class of 2025  
Built with ❤️ for CUK students in Nairobi, Kenya.

> *"No more scammers. No more wasted trips."*

---

## License

MIT License — feel free to fork and adapt for your university.

---

<p align="center">
  <strong>NestFinder CUK</strong> · Trinity · Nairobi 🇰🇪
</p>
