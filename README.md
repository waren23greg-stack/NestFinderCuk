# NestFinder CUK

> **Find Your Perfect Student Home Near The Cooperative University of Kenya**

A luxury student housing platform built for CUK students. Browse verified listings, view real photos for free, and pay Ksh 250 once to unlock the caretaker's contact. No scammers. No wasted trips.

🌐 **Live Site:** [nest-finder-cuk.vercel.app](https://nest-finder-cuk.vercel.app)  
👤 **Built by:** Trinity (Grege Warren) — CUK Student  
📍 **Location:** Nairobi, Kenya 🇰🇪

---

## Features

- **Browse listings** — Real photos, room types, amenities, distance from CUK
- **M-Pesa payments** — Students pay Ksh 250 to unlock caretaker contact
- **Admin panel** — Add, edit, delete listings with drag & drop photo uploads
- **Favourites** — Save listings, synced to Supabase across devices
- **Reviews** — Students rate and review listings (1–5 stars)
- **Search & filter** — By location, room type, price range, water, WiFi
- **PWA** — Installable on Android, iPhone, and desktop
- **Email notifications** — Admin notified on payment, student notified on confirmation
- **Trinity Property watermark** — Tiled across all listing photos
- **Cryptographic API security** — HMAC-SHA256, IP whitelist, replay protection

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend & Database | Supabase (PostgreSQL + Auth + Storage) |
| Serverless API | Vercel Functions (Node.js) |
| Payments | M-Pesa Daraja API |
| Email | Resend API |
| Hosting | Vercel |
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
    ├── security.js         # Cryptographic security middleware
    ├── mpesa-stk.js        # M-Pesa STK push
    ├── mpesa-callback.js   # M-Pesa payment callback (IP whitelisted)
    ├── mpesa-check.js      # Payment status checker
    ├── notify.js           # Email admin on payment submission
    ├── notify-student.js   # Email student on payment confirmation
    └── report.js           # Listing report handler
```

---

## Database Schema

```sql
profiles           -- Student accounts (extends Supabase auth)
listings           -- House listings with photos, amenities
caretaker_contacts -- Hidden until payment confirmed (RLS protected)
payments           -- M-Pesa payment records
favourites         -- Student saved listings
reviews            -- Student ratings and comments
reports            -- Listing reports from students
```

---

## Security Architecture

### API Security (`api/security.js`)

| Layer | Method | Protection |
|-------|--------|-----------|
| Request signing | HMAC-SHA256 | Prevents forged API requests |
| Timing-safe comparison | `crypto.timingSafeEqual` | Prevents timing attacks |
| Replay protection | Timestamp validation | Rejects requests older than 5 min |
| M-Pesa IP whitelist | IP allowlist | Only Safaricom servers hit callback |
| Payment token signing | HMAC-SHA256 | Payment IDs cannot be forged |
| Input sanitization | Regex + recursion | Strips XSS, SQL injection attempts |
| Rate limiting | Sliding window per IP | 10–30 req/min per endpoint |
| CORS lockdown | Origin header check | Only Vercel domain can call APIs |

### HTTP Security Headers

```
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Database Security (Supabase RLS)

- Caretaker contacts only readable after confirmed payment
- Users can only read/write their own profiles, payments, favourites
- Listings readable by all, writable only by admin role
- Reports insertable by anyone, manageable only by admin

---

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account (free)
- Vercel account (free)
- Safaricom Daraja account
- Resend account (free, 100 emails/day)

### 1. Clone the repo
```bash
git clone https://github.com/waren23greg-stack/NestFinderCuk.git
cd NestFinderCuk
npm install
```

### 2. Set up Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema
3. Create a `house-photos` storage bucket (set to Public)
4. Go to Authentication → Sessions → set JWT expiry to `604800` (7 days)
5. Copy your Project URL and anon key into `sb-client.js`

### 3. Deploy to Vercel
1. Push repo to GitHub
2. Import at [vercel.com](https://vercel.com)
3. Add all environment variables
4. Deploy

### Environment Variables

| Variable | Description |
|----------|-------------|
| `MPESA_CONSUMER_KEY` | Daraja app consumer key |
| `MPESA_CONSUMER_SECRET` | Daraja app consumer secret |
| `MPESA_SHORTCODE` | Till/Paybill number (`174379` for sandbox) |
| `MPESA_PASSKEY` | Daraja passkey |
| `MPESA_ENV` | `sandbox` or `live` |
| `MPESA_CALLBACK_URL` | `https://your-site.vercel.app/api/mpesa-callback` |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase `service_role` key |
| `RESEND_API_KEY` | Resend API key for emails |
| `ADMIN_EMAIL` | Your email for payment notifications |
| `API_SECRET` | Long random string for HMAC signing |
| `ALLOWED_ORIGIN` | `https://your-site.vercel.app` |

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
Admin receives email notification (Resend)
        ↓
Admin confirms in admin panel
        ↓
Caretaker contact unlocks for student
Student receives confirmation email
```

> **Going live:** Visit any Safaricom shop with National ID + KRA PIN for a free Till number. Update `MPESA_SHORTCODE` and `MPESA_ENV=live` — payments confirm automatically.

---

## API Endpoints

| Endpoint | Method | Description | Rate Limit |
|----------|--------|-------------|-----------|
| `/api/mpesa-stk` | POST | Initiate M-Pesa STK push | 10/min |
| `/api/mpesa-callback` | POST | Receive M-Pesa result (IP whitelisted) | 50/min |
| `/api/mpesa-check` | POST | Poll payment status | 30/min |
| `/api/notify` | POST | Email admin on payment | 30/min |
| `/api/notify-student` | POST | Email student on confirmation | 30/min |
| `/api/report` | POST | Submit listing report | 10/min |

---

## Roadmap

- [ ] Safaricom Till number for automatic payment confirmation
- [ ] Custom domain (`nestfinder.co.ke`)
- [ ] Email verification on signup
- [ ] Google Maps distance calculation
- [ ] Multi-university support (JKUAT, KU, UoN)
- [ ] Landlord self-listing portal with verification

---

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit and push
4. Open a Pull Request

---

## Built By

**Trinity · Grege Warren** — CUK Student, Nairobi Kenya

> *"No more scammers. No more wasted trips."*

---

## License

MIT License — free to fork and adapt for your university.

---

<p align="center">
  <strong>NestFinder CUK</strong> &nbsp;·&nbsp; Trinity &nbsp;·&nbsp; Nairobi 🇰🇪
  <br/>
  <sub>© 2026 NestFinder CUK · All listings verified · The Cooperative University of Kenya</sub>
</p>
