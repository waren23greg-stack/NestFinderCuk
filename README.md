<div align="center">

<img src="https://img.shields.io/badge/Live-nest--finder--cuk.vercel.app-10b981?style=for-the-badge&logo=vercel&logoColor=white" />
<img src="https://img.shields.io/badge/SSL-A%2B-10b981?style=for-the-badge&logo=letsencrypt&logoColor=white" />
<img src="https://img.shields.io/badge/Security%20Headers-Grade%20A-10b981?style=for-the-badge&logo=springsecurity&logoColor=white" />
<img src="https://img.shields.io/badge/PWA-Installable-6366f1?style=for-the-badge&logo=pwa&logoColor=white" />
<img src="https://img.shields.io/badge/M--Pesa-Integrated-00a651?style=for-the-badge" />

---

# 🏠 NestFinder CUK

### *The Anti-Scam Student Housing Platform*

**Find verified student housing near The Cooperative University of Kenya — securely, instantly, and for just Ksh 250.**

[**🌐 View Live Site**](https://nest-finder-cuk.vercel.app) · [**📁 Browse Code**](https://github.com/waren23greg-stack/NestFinderCuk) · [**🐛 Report Issue**](https://github.com/waren23greg-stack/NestFinderCuk/issues)

</div>

---

## 🎯 The Problem We Solve

Every semester, thousands of CUK students fall victim to fake housing listings — paying deposits to scammers, making wasted trips to non-existent rooms, and navigating a chaotic, unverified rental market with zero protection.

**NestFinder CUK fixes this.** It is a full-stack, production-grade marketplace that:

- Shows **real photos** of verified listings — free for any student to browse
- Charges **Ksh 250 once** (via M-Pesa) to unlock the caretaker's direct contact
- Uses **cryptographic API security + Row-Level Security** so payment data can never be forged or leaked
- Sends **instant email confirmations** to both student and admin the moment a payment clears

> *"No more scammers. No more wasted trips."*

---

## 📊 Business Metrics & Market Opportunity

| Metric | Data |
|---|---|
| 🎓 Target Users | ~8,000+ CUK enrolled students |
| 💰 Revenue per conversion | Ksh 250 (~$1.90 USD) |
| 📈 Expansion potential | JKUAT, KU, UoN — 100,000+ students combined |
| 🏘️ Current listings | Admin-verified, photo-backed |
| 💳 Payment method | M-Pesa (95%+ mobile money adoption in Kenya) |
| 🌍 Market | Kenya PropTech — underserved, high-growth |

**The unit economics are simple:** at just 1% monthly conversion of the CUK student body, NestFinder generates Ksh 20,000+/month with zero physical infrastructure.

---

## ✨ Feature Showcase

### For Students
| Feature | Description |
|---|---|
| 🔍 **Browse & Filter** | Search by location, room type, price range, WiFi, water availability |
| 📸 **Real Photos Free** | View verified, watermarked listing photos before committing |
| 💳 **M-Pesa Unlock** | Pay Ksh 250 to reveal the caretaker's contact — no hidden fees |
| ❤️ **Favourites** | Save listings, synced to your account across all devices |
| ⭐ **Reviews** | Read and write honest student reviews (1–5 stars) |
| 📱 **Install as App** | PWA — works offline, installs on Android, iPhone, or desktop |

### For Admins
| Feature | Description |
|---|---|
| 🖼️ **Drag & Drop Uploads** | Add listing photos with instant Supabase Storage upload |
| ✅ **Payment Management** | Confirm pending M-Pesa payments, unlock contacts for students |
| 📊 **Dashboard** | View all listings, payments, students, and reports in one panel |
| 📧 **Auto Notifications** | Email fired to admin on payment; email fired to student on confirmation |
| 🚨 **Report Handling** | Students can flag listings; admin resolves from the dashboard |

---

## 🛡️ Security Architecture

This is not a demo project. NestFinder CUK was built to **production security standards** from day one.

### Independent Security Audit Results (OWASP ZAP · securityheaders.com · Mozilla Observatory · Qualys SSL Labs — March 2026)

| Test | Result |
|---|---|
| XSS vulnerabilities | ✅ None detected |
| SQL injection vectors | ✅ None found |
| Clickjacking (X-Frame-Options) | ✅ Fully blocked |
| HTTPS / HSTS Preloading | ✅ Enforced |
| API input sanitisation | ✅ All inputs sanitised |
| Brute force protection | ✅ Rate limiting active |
| M-Pesa callback spoofing | ✅ Safaricom IP whitelist enforced |

### Security Scorecard

| Tool | Grade |
|---|---|
| 🔐 Security Headers | **A** — X-Frame-Options, HSTS, XSS Protection, Referrer Policy, Permissions Policy |
| 🦊 Mozilla Observatory | **B (75/100)** — 9/10 tests pass; CSP nonce is next milestone |
| 🔒 Qualys SSL Labs | **A+** — via Vercel shared SNI certificates |
| 🗄️ Supabase RLS | **Active** — Row-Level Security on all 7 database tables |
| ⏱️ API Rate Limiting | **Active** — Sliding window per IP, 10–30 req/min per endpoint |

### API Security Layers (`api/security.js`)

```
Request Signing      → HMAC-SHA256 prevents forged API calls
Timing-Safe Comparison → crypto.timingSafeEqual prevents timing attacks
Replay Protection    → Timestamp validation rejects requests older than 5 min
M-Pesa IP Whitelist  → Only Safaricom servers hit the callback endpoint
Payment Token Signing → HMAC-SHA256 so payment IDs cannot be forged
Input Sanitisation   → Regex + recursion strips XSS and SQL injection
Rate Limiting        → Sliding window per IP, per endpoint
CORS Lockdown        → Origin header check — only production domain allowed
```

### HTTP Security Headers (`vercel.json`)

```http
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'
```

### Database Security (Supabase RLS)

- Caretaker contacts are **locked at the database level** — visible only after a confirmed payment
- Users can only read/write **their own** profiles, payments, and favourites
- Listings are readable by all but **writable only by admin role**
- Reports are insertable by anyone, manageable only by admin

---

## 🏗️ Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│                    NestFinder CUK                       │
│                                                         │
│  Frontend        HTML · CSS · Vanilla JS · PWA          │
│  Backend         Supabase (PostgreSQL + Auth + Storage) │
│  Serverless API  Vercel Functions (Node.js)             │
│  Payments        M-Pesa Daraja API (Safaricom)          │
│  Email           Resend API                             │
│  Desktop App     Electron (Win · Mac · Linux builds)    │
│  Hosting         Vercel (global CDN, auto SSL)          │
│  Version Control GitHub                                 │
└─────────────────────────────────────────────────────────┘
```

**Why this stack?**

- **Zero server costs** — Vercel + Supabase free tiers handle full production load
- **No framework lock-in** — Vanilla JS frontend means instant load, no hydration lag
- **Real-time capable** — Supabase WebSockets available for future live features
- **Desktop-ready** — Electron config exists for distributable Windows/Mac/Linux app
- **M-Pesa native** — Daraja STK Push means students pay without leaving the page

---

## 📁 Project Structure

```
nestfinder-cuk/
│
├── index.html              # Main listings feed
├── login.html              # Student auth (sign in / sign up)
├── admin.html              # Admin dashboard (listings, payments, students, reports)
├── payments.html           # Student payment history
├── privacy.html            # Privacy policy
├── terms.html              # Terms & conditions
│
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker (offline caching)
├── favicon.svg             # Trinity T+house favicon
├── trinity-logo.svg        # Full NestFinder CUK brand logo
│
├── sb-client.js            # Custom Supabase fetch client (no CDN dependency)
├── supabase-bundle.js      # Bundled Supabase JS (self-hosted, no external calls)
│
├── robots.txt              # SEO crawler rules
├── sitemap.xml             # SEO sitemap
├── vercel.json             # Deployment config + all security headers
├── package.json            # Node deps + Electron build config
│
└── api/                    # Vercel Serverless Functions
    ├── security.js         # 🔐 Cryptographic security middleware (shared)
    ├── mpesa-stk.js        # Initiate M-Pesa STK push to student's phone
    ├── mpesa-callback.js   # Receive M-Pesa result (IP-whitelisted)
    ├── mpesa-check.js      # Poll payment status
    ├── notify.js           # Email admin on new payment
    ├── notify-student.js   # Email student on payment confirmation
    └── report.js           # Handle listing reports from students
```

---

## 🗄️ Database Schema

```sql
profiles           -- Student accounts (extends Supabase auth.users)
listings           -- House listings: photos, amenities, distance from CUK
caretaker_contacts -- Hidden behind RLS until admin confirms payment
payments           -- M-Pesa payment records (amount, status, timestamps)
favourites         -- Student saved listings, synced across devices
reviews            -- Student ratings (1–5 stars) and written reviews
reports            -- Listing flags from students, triaged by admin
```

---

## 💳 M-Pesa Payment Flow

```
Student clicks "Get Contact"
         │
         ▼
Enters their M-Pesa phone number
         │
         ▼
STK push sent to student's phone via Daraja API
         │
         ▼
Payment saved as "pending" in Supabase
         │
         ▼
Admin receives instant email notification (Resend)
         │
         ▼
Admin confirms in the dashboard
         │
         ▼
Caretaker contact unlocks for student
Student receives confirmation email
```

> **Going fully automatic:** Register a Safaricom Till number (free at any Safaricom shop with National ID + KRA PIN), set `MPESA_ENV=live` — payments then confirm without any manual admin step.

---

## 🚀 API Endpoints

| Endpoint | Method | Description | Rate Limit |
|---|---|---|---|
| `/api/mpesa-stk` | POST | Initiate STK push to student phone | 10/min |
| `/api/mpesa-callback` | POST | Receive M-Pesa result (Safaricom IPs only) | 50/min |
| `/api/mpesa-check` | POST | Poll payment confirmation status | 30/min |
| `/api/notify` | POST | Email admin on new payment | 30/min |
| `/api/notify-student` | POST | Email student on payment confirmed | 30/min |
| `/api/report` | POST | Submit a listing report | 10/min |

---

## ⚡ Getting Started

### Prerequisites

- Node.js 18+
- [Supabase](https://supabase.com) account (free)
- [Vercel](https://vercel.com) account (free)
- [Safaricom Daraja](https://developer.safaricom.co.ke) account
- [Resend](https://resend.com) account (free — 100 emails/day)

### 1. Clone

```bash
git clone https://github.com/waren23greg-stack/NestFinderCuk.git
cd NestFinderCuk
npm install
```

### 2. Configure Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase/migrations/`
3. Create a `house-photos` storage bucket (set to **Public**)
4. Go to **Authentication → Sessions** → set JWT expiry to `604800` (7 days)
5. Copy your Project URL and anon key into `sb-client.js`

### 3. Set Environment Variables

| Variable | Description |
|---|---|
| `MPESA_CONSUMER_KEY` | Daraja app consumer key |
| `MPESA_CONSUMER_SECRET` | Daraja app consumer secret |
| `MPESA_SHORTCODE` | Till/Paybill (`174379` for sandbox) |
| `MPESA_PASSKEY` | Daraja passkey |
| `MPESA_ENV` | `sandbox` or `live` |
| `MPESA_CALLBACK_URL` | `https://your-site.vercel.app/api/mpesa-callback` |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase `service_role` key |
| `RESEND_API_KEY` | Resend API key |
| `ADMIN_EMAIL` | Your email for payment alerts |
| `API_SECRET` | Long random string for HMAC signing |
| `ALLOWED_ORIGIN` | `https://your-site.vercel.app` |

### 4. Deploy to Vercel

```bash
# Push to GitHub, then:
# 1. Import repo at vercel.com
# 2. Add all environment variables
# 3. Deploy — done.
```

### 5. Grant Yourself Admin

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
```

---

## 🗺️ Roadmap

- [ ] Safaricom Till registration → fully automatic payment confirmation
- [ ] Custom domain `nestfinder.co.ke`
- [ ] Email verification on signup
- [ ] Google Maps distance-from-campus calculation
- [ ] Mozilla Observatory **A** grade (CSP nonce implementation)
- [ ] Multi-university expansion: JKUAT, KU, UoN
- [ ] Landlord self-listing portal with document verification
- [ ] AI-powered listing fraud detection

---

## 🤝 Contributing

Contributions are welcome — especially from CUK students and Kenyan developers.

```bash
# 1. Fork the repo
# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Commit your changes
git commit -m "Add: your feature description"

# 4. Push and open a Pull Request
git push origin feature/your-feature-name
```

Please open an issue first to discuss major changes.

---

## 👤 About the Developer

**Grege Warren (Trinity)** — CUK Student · Full-Stack Developer · Nairobi, Kenya 🇰🇪

Built NestFinder CUK from scratch — no templates, no boilerplates — with real Supabase, real M-Pesa payments, real cryptographic security, and real OWASP penetration testing. Every line of code in this repository was written to solve an actual problem faced by actual CUK students.

**Skills demonstrated in this project:**

`Full-Stack Development` · `PostgreSQL / Supabase` · `REST API Design` · `Payment Integration (M-Pesa Daraja)` · `Cryptographic Security (HMAC-SHA256)` · `OWASP Security Testing` · `PWA / Service Workers` · `Electron Desktop Apps` · `Email Automation (Resend)` · `Vercel Serverless Functions` · `SEO (sitemap, robots.txt)` · `Row-Level Security` · `Rate Limiting` · `UI/UX Design`

---

## 📄 License

MIT License — free to fork and adapt for your university.

---

<div align="center">

**NestFinder CUK** · Built by Trinity · Nairobi, Kenya 🇰🇪

[🌐 Live Site](https://nest-finder-cuk.vercel.app) · [⭐ Star this repo](https://github.com/waren23greg-stack/NestFinderCuk)

*© 2026 NestFinder CUK · All listings verified · The Cooperative University of Kenya*

</div>
