# NestFinder CUK — Security Audit

> Last reviewed: March 2026
> Stack: Supabase + Vercel Serverless + Vanilla JS + M-Pesa Daraja API

---

## 1. Already In Place

- SUPABASE_SERVICE_KEY server-side only
- Full CSP in vercel.json
- Promo codes generated server-side after DB-verified payment
- Payment duplicates checked before insert
- Admin panel role-gated
- HTTPS + HSTS enforced
- Service worker intercepts same-origin only

---

## 2. Critical — Fix Immediately

### 2.1 Row Level Security
Run in Supabase SQL Editor:
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

All tables must show rowsecurity = true. Minimum policies:
```sql
CREATE POLICY "Public read listings" ON listings FOR SELECT USING (true);
CREATE POLICY "Admin insert listings" ON listings FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin update listings" ON listings FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin delete listings" ON listings FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Users see own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin manage payments" ON payments FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "User sees own contacts" ON caretaker_contacts FOR SELECT USING (
  EXISTS (SELECT 1 FROM payments WHERE payments.listing_id = caretaker_contacts.listing_id AND payments.user_id = auth.uid() AND payments.status = 'confirmed')
);
CREATE POLICY "Users see own promos" ON promo_codes FOR SELECT USING (auth.uid() = owner_user_id);
CREATE POLICY "Users manage own profile" ON profiles FOR ALL USING (auth.uid() = id);
```

### 2.2 M-Pesa Callback IP Whitelist
```javascript
const SAFARICOM_IPS = [
  '196.201.214.200','196.201.214.206','196.201.213.114',
  '196.201.214.207','196.201.214.208','196.201.213.44',
  '196.201.212.127','196.201.212.138','196.201.212.129',
  '196.201.212.136','196.201.212.74','196.201.212.69'
];
const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim();
if (!SAFARICOM_IPS.includes(clientIP)) return res.status(403).json({ error: 'Forbidden' });
```

### 2.3 Server-Side Admin Role Check
```javascript
const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', userId).single();
if (profile?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
```

---

## 3. Medium Priority

### 3.1 Rate Limiting
```javascript
const rateMap = new Map();
function rateLimit(ip, max = 10) {
  const now = Date.now();
  const recent = (rateMap.get(ip) || []).filter(t => now - t < 60000);
  if (recent.length >= max) return false;
  rateMap.set(ip, [...recent, now]);
  return true;
}
```

### 3.2 M-Pesa Code Validation
```javascript
const MPESA_CODE_REGEX = /^[A-Z]{2}[A-Z0-9]{8}$/;
if (!MPESA_CODE_REGEX.test(ref)) return res.status(400).json({ error: 'Invalid code' });
```

### 3.3 CORS Lockdown
```javascript
const ALLOWED = ['https://nestfindercuk.rocks'];
const origin = req.headers.origin;
res.setHeader('Access-Control-Allow-Origin', ALLOWED.includes(origin) ? origin : ALLOWED[0]);
```

---

## 4. Monthly Checklist

- [ ] All Supabase tables have RLS enabled
- [ ] M-Pesa callback IP whitelist active
- [ ] No service role key in any frontend file
- [ ] Rate limiting active on payment endpoints
- [ ] Storage bucket restricted to image types only
- [ ] CORS restricted to nestfindercuk.rocks
- [ ] Admin role enforced server-side
- [ ] npm audit run and clean
- [ ] Supabase auth logs reviewed

---

## 5. Incident Response

1. Rotate Supabase anon + service role keys
2. Rotate M-Pesa credentials in Daraja portal
3. Rotate Resend API key
4. Check payments table for fake confirmed payments
5. Check promo_codes for codes without payments
6. Force logout all users via Supabase dashboard
7. Update all Vercel environment variables
