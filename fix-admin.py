#!/usr/bin/env python3
"""
Rewrites admin.html:
  - Keeps only section 1's HTML (lines 1–436) — the one clean copy
  - Replaces Firebase shim loading with real Supabase CDN client
  - Replaces all 4 broken duplicate script sections with one clean Supabase-only script
Run from inside ~/NestFinderCuk/
"""

import re

with open('admin.html', 'r') as f:
    lines = f.readlines()

# ── 1. Extract clean HTML head + body (lines 1–436, 0-indexed 0–435) ─────────
# Replace the broken script loading block in the head (lines 213–216):
#   <script src="sb-client.js"></script>
#   <script>const sb=window.sb;</script>
#   <script src="warenvault-firebase.js"></script>
# with the real Supabase CDN script tag.

head_and_body = []
for i, line in enumerate(lines[:436]):  # lines 1-436
    ln = i + 1
    if ln in (214, 215, 216):  # skip old script tags
        continue
    if ln == 213 and '<script src="sb-client.js">' in line:
        # Replace with Supabase CDN
        head_and_body.append('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n')
        continue
    head_and_body.append(line)

# ── 2. The clean script ───────────────────────────────────────────────────────
SUPABASE_URL = 'https://mtycapgbtvpczvswpjpo.supabase.co'
SUPABASE_KEY = ('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.'
                'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eWNhcGdidHZwY3p2c3dwanBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjQxNDgsImV4cCI6MjA4OTYwMDE0OH0.'
                'owJeYO2kHs1F82kPQeML6uHUarchKT_ybe79OBBV6wM')

SCRIPT = f'''
<script>
/* ── Supabase client ── */
const sb = supabase.createClient('{SUPABASE_URL}', '{SUPABASE_KEY}');

let pendingPhotos = [], existingPhotos = [];

/* ── AUTH GATE ── */
async function init() {{
  const {{ data: {{ session }} }} = await sb.auth.getSession();
  if (!session) {{ window.location.href = 'login.html'; return; }}
  try {{
    const {{ data: profile }} = await sb.from('profiles').select('role,full_name').eq('id', session.user.id).single();
    document.getElementById('loading').classList.add('hide');
    if (!profile || profile.role !== 'admin') {{ document.getElementById('denied').classList.add('show'); return; }}
    document.getElementById('adminName').textContent = (profile.full_name || 'Admin').split(' ')[0];
    loadDashboard();
  }} catch(e) {{ console.error(e); window.location.href = 'login.html'; }}
}}

async function doSignOut() {{
  await sb.auth.signOut();
  window.location.href = 'login.html';
}}

/* ── SIDEBAR (mobile) ── */
function toggleSidebar() {{
  const s = document.getElementById('sidebar');
  const o = document.getElementById('sidebarOverlay');
  const open = s.classList.toggle('open');
  o.classList.toggle('show', open);
}}
function closeSidebar() {{
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');
}}

/* ── NAVIGATION ── */
const titles = {{ dashboard:'Dashboard', listings:'Listings', payments:'Payments', students:'Students', reports:'Reports', movers:'Trinity Movers', submissions:'Submissions', referrals:'Referrals' }};
const actions = {{
  listings: `<button class="topbar-btn tbtn-gold" onclick="openModal()"><svg viewBox="0 0 24 24" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add Listing</button>`,
  payments: `<button class="topbar-btn tbtn-ghost" onclick="exportCSV()"><svg viewBox="0 0 24 24" width="13" height="13"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Export CSV</button>`,
  dashboard:'', students:'', reports:'', movers:'', submissions:'', referrals:''
}};
function goto(name, btn) {{
  document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.sb-item').forEach(b => b.classList.remove('on'));
  document.getElementById('page-'+name).classList.add('on');
  if (btn) btn.classList.add('on');
  document.getElementById('pageTitle').textContent = titles[name] || name;
  document.getElementById('topbarActions').innerHTML = actions[name] || '';
  closeSidebar();
  if (name==='listings')    loadListings();
  if (name==='payments')    loadPayments();
  if (name==='students')    loadStudents();
  if (name==='reports')     loadReports();
  if (name==='movers')      loadMovers();
  if (name==='submissions') loadSubmissions();
  if (name==='referrals')   loadReferrals();
}}

/* ── TOAST ── */
let toastTimer;
function toast(msg, err=false) {{
  const t = document.getElementById('toast');
  t.className = 'toast show' + (err ? ' err' : '');
  document.getElementById('toastTxt').textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.className = 'toast', 3200);
}}

/* ── DASHBOARD ── */
async function loadDashboard() {{
  const [l, p, u, mv] = await Promise.all([
    sb.from('listings').select('id,available', {{count:'exact'}}),
    sb.from('payments').select('id,status,amount,created_at', {{count:'exact'}}),
    sb.from('profiles').select('id', {{count:'exact'}}).eq('role','student'),
    sb.from('moving_requests').select('price,status,created_at').catch(() => ({{data:[]}}))
  ]);
  const avail = (l.data||[]).filter(x => x.available).length;
  const confirmed = (p.data||[]).filter(x => x.status==='confirmed');
  const listingsRev = confirmed.reduce((s,x) => s+(x.amount||250), 0);
  const moverData = mv.data||[];
  const moverConfirmed = moverData.filter(x => x.status==='confirmed'||x.status==='done');
  const moversRev = moverConfirmed.reduce((s,x) => s+(parseInt(x.price)||0), 0);
  document.getElementById('s-listings').textContent = l.count ?? 0;
  document.getElementById('s-avail').textContent = avail;
  document.getElementById('s-students').textContent = u.count ?? 0;
  document.getElementById('s-revenue').textContent = 'Ksh '+(listingsRev+moversRev).toLocaleString();
  if (document.getElementById('s-movers')) document.getElementById('s-movers').textContent = moverConfirmed.length;
  buildChart(confirmed, moverConfirmed);
  const {{data:rp}} = await sb.from('payments').select('*,profiles(full_name),listings(title)').order('created_at',{{ascending:false}}).limit(8);
  const rb = document.getElementById('recentBody');
  if (!rp?.length) {{ rb.innerHTML='<tr class="empty-row"><td colspan="6">No payments yet.</td></tr>'; return; }}
  rb.innerHTML = rp.map(p => `<tr>
    <td>${{p.profiles?.full_name||'—'}}</td>
    <td style="max-width:160px;font-size:.78rem;">${{p.listings?.title||'—'}}</td>
    <td>Ksh ${{(p.amount||250).toLocaleString()}}</td>
    <td style="font-family:monospace;font-size:.72rem;">${{p.mpesa_ref||'—'}}</td>
    <td><span class="badge badge-${{p.status==='confirmed'?'ok':p.status==='denied'?'denied':p.status==='pending'?'pending':'failed'}}">${{p.status}}</span></td>
    <td style="font-size:.75rem;">${{new Date(p.created_at).toLocaleDateString('en-KE',{{day:'numeric',month:'short'}})}}</td>
  </tr>`).join('');
}}

function buildChart(confirmed, moverConfirmed) {{
  const bars = document.getElementById('chartBars');
  const days = []; for(let i=6;i>=0;i--){{const d=new Date();d.setDate(d.getDate()-i);days.push(d);}}
  const totals = days.map(d => {{
    const ds = d.toDateString();
    const lRev = confirmed.filter(p=>new Date(p.created_at).toDateString()===ds).reduce((s,p)=>s+(p.amount||250),0);
    const mRev = (moverConfirmed||[]).filter(p=>new Date(p.created_at).toDateString()===ds).reduce((s,p)=>s+(parseInt(p.price)||0),0);
    return {{total:lRev+mRev,listings:lRev,movers:mRev}};
  }});
  const max = Math.max(...totals.map(t=>t.total), 250);
  bars.innerHTML = days.map((d,i) => `<div class="bar-col">
    <div class="bar-amt">${{totals[i].total?'Ksh'+totals[i].total.toLocaleString():''}}</div>
    <div style="display:flex;flex-direction:column;justify-content:flex-end;height:72px;gap:1px">
      ${{totals[i].movers?`<div style="width:100%;background:rgba(37,211,102,.5);height:${{Math.round((totals[i].movers/max)*70)+1}}px"></div>`:''}}
      ${{totals[i].listings?`<div class="bar" style="height:${{Math.round((totals[i].listings/max)*70)+1}}px"></div>`:'<div class="bar" style="height:2px"></div>'}}
    </div>
    <div class="bar-day">${{d.toLocaleDateString('en-KE',{{weekday:'short'}})}}</div>
  </div>`).join('');
}}

/* ── LISTINGS ── */
async function loadListings() {{
  const {{data}} = await sb.from('listings').select('*').order('created_at',{{ascending:false}});
  document.getElementById('listingCount').textContent = (data?.length||0)+' total listings';
  const tb = document.getElementById('listingsBody');
  if (!data?.length) {{ tb.innerHTML='<tr class="empty-row"><td colspan="7">No listings yet. Add your first one.</td></tr>'; return; }}
  tb.innerHTML = data.map(h => `<tr>
    <td><div class="thumbs">${{(h.photos||[]).slice(0,3).map(u=>`<div class="thumb-sm"><img src="${{u}}" onerror="this.style.display='none'"/></div>`).join('')}}${{!(h.photos||[]).length?`<div class="thumb-sm"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`:''}}</div></td>
    <td><div style="font-family:'Cormorant Garamond',serif;font-size:1rem;color:var(--dark);margin-bottom:.15rem;">${{h.title}}</div><div style="font-size:.72rem;color:var(--muted);">${{h.location}}</div></td>
    <td><span class="badge badge-${{h.type==='one-bedroom'?'one':h.type}}">${{h.type.replace('-',' ')}}</span></td>
    <td style="font-family:'Cormorant Garamond',serif;font-size:1rem;">Ksh ${{(h.price||0).toLocaleString()}}</td>
    <td><span style="font-family:'Cormorant Garamond',serif;font-size:1rem;">Ksh ${{(h.contact_fee||250).toLocaleString()}}</span></td>
    <td><label class="avail-toggle" onclick="toggleAvail('${{h.id}}',${{!h.available}},this)"><div class="toggle-track${{h.available?' on':''}}"><div class="toggle-knob"></div></div><span>${{h.available?'Available':'Taken'}}</span></label></td>
    <td><div class="actions-cell">
      <button class="act act-edit" onclick="editListing('${{h.id}}')"><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Edit</button>
      <button class="act act-del" onclick="delListing('${{h.id}}','${{h.title.replace(/'/g,'')}}')"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>Del</button>
    </div></td>
  </tr>`).join('');
}}

async function toggleAvail(id, newVal, label) {{
  await sb.from('listings').update({{available:newVal}}).eq('id',id);
  label.querySelector('.toggle-track').classList.toggle('on',newVal);
  label.querySelector('span').textContent = newVal ? 'Available' : 'Taken';
  toast(newVal ? 'Marked as available' : 'Marked as taken');
}}

async function delListing(id, title) {{
  if (!confirm(`Delete "${{title}}"? This cannot be undone.`)) return;
  await sb.from('payments').delete().eq('listing_id',id);
  const {{error}} = await sb.from('listings').delete().eq('id',id);
  if (error) {{ toast('Delete failed: '+error.message, true); return; }}
  toast('Listing deleted'); loadListings();
}}

/* ── PAYMENTS ── */
async function loadPayments() {{
  const {{data}} = await sb.from('payments').select('*,profiles(full_name),listings(title)').order('created_at',{{ascending:false}});
  const tb = document.getElementById('paymentsBody');
  if (!data?.length) {{ tb.innerHTML='<tr class="empty-row"><td colspan="8">No payments yet.</td></tr>'; return; }}
  tb.innerHTML = data.map(p => `<tr>
    <td style="font-weight:500;">${{p.profiles?.full_name||'—'}}</td>
    <td>${{p.phone||'—'}}</td>
    <td style="font-size:.78rem;max-width:140px;">${{p.listings?.title||'—'}}</td>
    <td>Ksh ${{(p.amount||250).toLocaleString()}}</td>
    <td style="font-family:monospace;font-size:.72rem;">${{p.mpesa_ref||'—'}}</td>
    <td><span class="badge badge-${{p.status==='confirmed'?'ok':p.status==='denied'?'denied':p.status==='pending'?'pending':'failed'}}">${{p.status}}</span></td>
    <td style="font-size:.75rem;">${{new Date(p.created_at).toLocaleDateString('en-KE',{{day:'numeric',month:'short',year:'numeric'}})}}</td>
    <td><div class="actions-cell">
      ${{p.status==='pending'?`<button class="act act-confirm" onclick="confirmPay('${{p.id}}')"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>Confirm</button>`:''}}
      ${{p.status==='pending'||p.status==='confirmed'?`<button class="act act-deny" onclick="denyPay('${{p.id}}','${{(p.profiles?.full_name||'').replace(/'/g,'')}}','${{(p.listings?.title||'').replace(/'/g,'')}}')"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Deny</button>`:''}}
      ${{p.status==='denied'?`<button class="act act-restore" onclick="restorePay('${{p.id}}')"><svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>Restore</button>`:''}}
      ${{p.status==='confirmed'?'<span style="font-size:.7rem;color:var(--green-d);">✓ Access granted</span>':''}}
      ${{p.status==='denied'?'<span style="font-size:.7rem;color:var(--red);">✕ Access revoked</span>':''}}
    </div></td>
  </tr>`).join('');
}}

async function confirmPay(id) {{
  await sb.from('payments').update({{status:'confirmed'}}).eq('id',id);
  toast('Payment confirmed — contact access granted ✓'); loadPayments();
}}
async function denyPay(id, studentName, listingTitle) {{
  const reason = studentName ? `Mark payment by ${{studentName}} for "${{listingTitle}}" as FAKE and revoke their contact access?` : 'Mark this payment as fake and revoke contact access?';
  if (!confirm(reason+'\\n\\nThis will prevent the student from viewing caretaker contacts.')) return;
  await sb.from('payments').update({{status:'denied'}}).eq('id',id);
  toast('Payment denied — contact access revoked', true); loadPayments();
}}
async function restorePay(id) {{
  if (!confirm('Restore this payment and re-grant contact access?')) return;
  await sb.from('payments').update({{status:'confirmed'}}).eq('id',id);
  toast('Payment restored — contact access re-granted ✓'); loadPayments();
}}

function exportCSV() {{
  const rows = [['Student','Phone','Listing','Amount','M-Pesa Ref','Status','Date']];
  document.querySelectorAll('#paymentsBody tr:not(.empty-row)').forEach(tr => {{
    rows.push([...tr.querySelectorAll('td')].slice(0,7).map(td => '"'+td.textContent.trim()+'"'));
  }});
  const blob = new Blob([rows.map(r=>r.join(',')).join('\\n')], {{type:'text/csv'}});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'nestfinder-payments-'+new Date().toISOString().slice(0,10)+'.csv'; a.click();
}}

/* ── STUDENTS ── */
async function loadStudents() {{
  const {{data}} = await sb.from('profiles').select('*').order('created_at',{{ascending:false}});
  const tb = document.getElementById('studentsBody');
  if (!data?.length) {{ tb.innerHTML='<tr class="empty-row"><td colspan="5">No students yet.</td></tr>'; return; }}
  tb.innerHTML = data.map(u => `<tr>
    <td style="font-family:'Cormorant Garamond',serif;font-size:1rem;">${{u.full_name||'—'}}</td>
    <td>${{u.phone||'—'}}</td>
    <td><span class="badge badge-${{u.role==='admin'?'admin':'student'}}">${{u.role}}</span></td>
    <td style="font-size:.75rem;">${{new Date(u.created_at).toLocaleDateString('en-KE',{{day:'numeric',month:'short',year:'numeric'}})}}</td>
    <td>${{u.role!=='admin'?`<button class="act act-edit" onclick="makeAdmin('${{u.id}}')">Make Admin</button>`:'<span style="font-size:.72rem;color:var(--muted);">Admin</span>'}}</td>
  </tr>`).join('');
}}
async function makeAdmin(id) {{
  if (!confirm('Grant admin access to this user?')) return;
  await sb.from('profiles').update({{role:'admin'}}).eq('id',id);
  toast('User is now an admin'); loadStudents();
}}

/* ── REPORTS ── */
async function loadReports() {{
  const {{data}} = await sb.from('reports').select('*,listings(title)').order('created_at',{{ascending:false}});
  const tb = document.getElementById('reportsBody');
  if (!data?.length) {{ tb.innerHTML='<tr class="empty-row"><td colspan="6">No reports yet.</td></tr>'; return; }}
  tb.innerHTML = data.map(r => `<tr>
    <td style="font-family:'Cormorant Garamond',serif;font-size:1rem;max-width:180px;">${{r.listings?.title||r.listing_title||'—'}}</td>
    <td><span class="badge ${{r.reason.includes('Scam')||r.reason.includes('fraud')?'badge-failed':'badge-pending'}}">${{r.reason}}</span></td>
    <td style="font-size:.78rem;color:var(--muted);max-width:200px;">${{r.details||'—'}}</td>
    <td><span class="badge ${{r.status==='resolved'?'badge-ok':r.status==='reviewed'?'badge-pending':'badge-failed'}}">${{r.status}}</span></td>
    <td style="font-size:.75rem;">${{new Date(r.created_at).toLocaleDateString('en-KE',{{day:'numeric',month:'short'}})}}</td>
    <td><div class="actions-cell">
      ${{r.status==='open'?`<button class="act act-edit" onclick="updateReport('${{r.id}}','reviewed')">Review</button>`:''}}
      ${{r.status!=='resolved'?`<button class="act act-confirm" onclick="updateReport('${{r.id}}','resolved')">Resolve</button>`:''}}
      ${{r.status==='resolved'?'<span style="font-size:.72rem;color:var(--muted);">Done</span>':''}}
    </div></td>
  </tr>`).join('');
}}
async function updateReport(id, status) {{
  await sb.from('reports').update({{status}}).eq('id',id);
  toast(status==='resolved'?'Report resolved ✓':'Marked as reviewed'); loadReports();
}}

/* ── MOVERS ── */
async function loadMovers() {{
  const tbody = document.getElementById('movers-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:2rem">Loading...</td></tr>';
  const {{data, error}} = await sb.from('moving_requests').select('*').order('created_at',{{ascending:false}});
  if (error || !data?.length) {{
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:2rem">No bookings yet</td></tr>';
    return;
  }}
  tbody.innerHTML = data.map(m => `<tr>
    <td><strong>${{m.name||'—'}}</strong></td>
    <td><a href="tel:${{m.phone}}" style="color:var(--gold)">${{m.phone||'—'}}</a></td>
    <td>${{m.pickup||'—'}}<br><small style="color:var(--muted)">${{m.pickup_zone||''}}</small></td>
    <td>${{m.dropoff||'—'}}<br><small style="color:var(--muted)">${{m.dropoff_zone||''}}</small></td>
    <td>${{m.move_date||'—'}}</td>
    <td>${{m.tier||'—'}}</td>
    <td style="color:var(--gold);font-weight:500">Ksh ${{m.price||'—'}}</td>
    <td><span style="font-size:.68rem;padding:3px 8px;border-radius:2px;background:${{m.status==='confirmed'?'rgba(39,174,96,.15)':m.status==='done'?'rgba(184,149,90,.15)':'rgba(140,126,110,.1)'}};color:${{m.status==='confirmed'?'#27ae60':m.status==='done'?'var(--gold)':'var(--muted)'}}">${{m.status||'pending'}}</span></td>
    <td style="display:flex;gap:.4rem;flex-wrap:wrap">
      <button onclick="updateMover('${{m.id}}','confirmed')" style="font-size:.65rem;padding:4px 10px;background:rgba(39,174,96,.12);color:#27ae60;border:1px solid rgba(39,174,96,.3);cursor:pointer;font-family:Jost,sans-serif">Confirm</button>
      <button onclick="updateMover('${{m.id}}','done')" style="font-size:.65rem;padding:4px 10px;background:rgba(184,149,90,.1);color:var(--gold);border:1px solid rgba(184,149,90,.3);cursor:pointer;font-family:Jost,sans-serif">Done</button>
      <button onclick="updateMover('${{m.id}}','cancelled')" style="font-size:.65rem;padding:4px 10px;background:rgba(192,57,43,.08);color:#c0392b;border:1px solid rgba(192,57,43,.2);cursor:pointer;font-family:Jost,sans-serif">Cancel</button>
    </td>
  </tr>`).join('');
}}
async function updateMover(id, status) {{
  await sb.from('moving_requests').update({{status}}).eq('id',id);
  toast(status==='confirmed'?'Booking confirmed':status==='done'?'Marked as done':'Booking cancelled');
  loadMovers();
}}

/* ── LISTING MODAL ── */
function openModal() {{
  ['fTitle','fPrice','fLoc','fDesc','fCtName','fCtPhone','fLat','fLng'].forEach(id=>{{const el=document.getElementById(id);if(el)el.value='';}});
  document.getElementById('pin-coords').textContent='No pin placed yet — click the map to set location';
  document.getElementById('fContactFee').value='250';
  document.getElementById('fType').value='single';
  document.getElementById('fWater').checked=false;
  document.getElementById('fWifi').checked=false;
  document.getElementById('fAvail').checked=true;
  document.getElementById('editId').value='';
  document.getElementById('modalTitle').textContent='Add Listing';
  document.getElementById('saveTxt').textContent='Save Listing';
  pendingPhotos=[]; existingPhotos=[]; renderPreviews();
  document.getElementById('fErr').className='f-err';
  document.getElementById('listingOverlay').classList.add('open');
  setTimeout(()=>initAdminMap(),400);
  document.body.style.overflow='hidden';
}}

async function editListing(id) {{
  const {{data:h}} = await sb.from('listings').select('*').eq('id',id).single();
  if (!h) {{ toast('Could not load listing',true); return; }}
  const {{data:ctList}} = await sb.from('caretaker_contacts').select('*').eq('listing_id',id).limit(1);
  const ct = ctList && ctList.length ? ctList[0] : null;
  document.getElementById('editId').value=id;
  document.getElementById('fTitle').value=h.title||'';
  document.getElementById('fType').value=h.type||'single';
  document.getElementById('fPrice').value=h.price||'';
  document.getElementById('fContactFee').value=h.contact_fee||250;
  document.getElementById('fLoc').value=h.location||'';
  document.getElementById('fDesc').value=h.description||'';
  const _la=document.getElementById('fLat'); if(_la) _la.value=h.latitude||'';
  const _ln=document.getElementById('fLng'); if(_ln) _ln.value=h.longitude||'';
  if(h.latitude&&h.longitude) document.getElementById('pin-coords').textContent='📍 '+parseFloat(h.latitude).toFixed(5)+', '+parseFloat(h.longitude).toFixed(5);
  document.getElementById('fWater').checked=!!h.water_included;
  document.getElementById('fWifi').checked=!!h.wifi_available;
  document.getElementById('fAvail').checked=h.available!==false;
  populateAirbnbFields(h);
  document.getElementById('fCtName').value=ct?.caretaker_name||'';
  document.getElementById('fCtPhone').value=ct?.phone||'';
  document.getElementById('modalTitle').textContent='Edit Listing';
  document.getElementById('saveTxt').textContent='Update Listing';
  pendingPhotos=[]; existingPhotos=h.photos||[]; renderPreviews();
  document.getElementById('fErr').className='f-err';
  document.getElementById('listingOverlay').classList.add('open');
  document.body.style.overflow='hidden';
  setTimeout(()=>initAdminMap(h.latitude,h.longitude),400);
}}

function handlePhotos(e) {{
  const files=Array.from(e.target.files);
  if(existingPhotos.length+pendingPhotos.length+files.length>6){{showFErr('Max 6 photos allowed.');return;}}
  pendingPhotos.push(...files); renderPreviews();
}}
function handleDrop(e) {{
  e.preventDefault(); document.getElementById('uploadZone').classList.remove('drag');
  const files=Array.from(e.dataTransfer.files).filter(f=>f.type.startsWith('image/'));
  if(existingPhotos.length+pendingPhotos.length+files.length>6){{showFErr('Max 6 photos.');return;}}
  pendingPhotos.push(...files); renderPreviews();
}}
function renderPreviews() {{
  const c=document.getElementById('previews');
  c.innerHTML=
    existingPhotos.map((u,i)=>`<div class="prev-item"><img src="${{u}}"/><button class="prev-rm" onclick="existingPhotos.splice(${{i}},1);renderPreviews()">✕</button></div>`).join('')+
    pendingPhotos.map((f,i)=>`<div class="prev-item"><img src="${{URL.createObjectURL(f)}}"/><button class="prev-rm" onclick="pendingPhotos.splice(${{i}},1);renderPreviews()">✕</button></div>`).join('');
}}
function showFErr(msg) {{ const e=document.getElementById('fErr'); e.textContent=msg; e.className='f-err show'; }}

async function saveListing() {{
  const title=document.getElementById('fTitle').value.trim();
  const isAirbnb=document.getElementById('fListingType').value==='airbnb';
  const price=isAirbnb?0:parseInt(document.getElementById('fPrice').value);
  const priceNight=isAirbnb?parseInt(document.getElementById('fPriceNight').value)||0:null;
  const location=document.getElementById('fLoc').value.trim();
  const contactFee=parseInt(document.getElementById('fContactFee').value)||250;
  const ctName=document.getElementById('fCtName').value.trim();
  const ctPhone=document.getElementById('fCtPhone').value.trim();
  if(!title||(!isAirbnb&&!price)||(isAirbnb&&!priceNight)||!location){{showFErr('Title, price and location are required.');return;}}
  if(!ctName||!ctPhone){{showFErr('Caretaker name and phone are required.');return;}}

  const btn=document.getElementById('saveBtn');
  btn.disabled=true;
  document.getElementById('saveSpin').style.display='block';
  document.getElementById('saveIco').style.display='none';
  document.getElementById('saveTxt').textContent='Saving…';
  document.getElementById('fErr').className='f-err';

  const urls=[...existingPhotos];
  for(const f of pendingPhotos){{
    const fd=new FormData(); fd.append('file',f); fd.append('upload_preset','nestfinder_unsigned'); fd.append('folder','nestfinder');
    const ur=await fetch('https://api.cloudinary.com/v1_1/dlms1aqkv/image/upload',{{method:'POST',body:fd}});
    const cd=await ur.json();
    if(!cd.secure_url){{showFErr('Photo upload failed.');resetSave();return;}}
    urls.push(cd.secure_url);
  }}

  const payload={{
    title, type:document.getElementById('fType').value, price, contact_fee:contactFee, location,
    description:document.getElementById('fDesc').value.trim(),
    water_included:document.getElementById('fWater').checked,
    wifi_available:document.getElementById('fWifi').checked,
    available:document.getElementById('fAvail').checked,
    photos:urls,
    latitude:document.getElementById('fLat').value?parseFloat(document.getElementById('fLat').value):null,
    longitude:document.getElementById('fLng').value?parseFloat(document.getElementById('fLng').value):null,
    listing_type:document.getElementById('fListingType').value,
    price_per_night:isAirbnb?parseInt(document.getElementById('fPriceNight').value)||null:null,
    max_guests:isAirbnb?parseInt(document.getElementById('fMaxGuests').value)||null:null,
    min_nights:isAirbnb?parseInt(document.getElementById('fMinNights').value)||1:null
  }};

  const editId=document.getElementById('editId').value;
  let lid=editId;

  if(editId){{
    const {{error:ue}}=await sb.from('listings').update(payload).eq('id',editId);
    if(ue){{showFErr('Update failed: '+ue.message);resetSave();return;}}
  }} else {{
    const {{data:nd,error:ie}}=await sb.from('listings').insert(payload).select().single();
    if(ie){{showFErr('Insert failed: '+ie.message);resetSave();return;}}
    lid=nd.id;
  }}

  // Caretaker upsert
  const {{data:crList}}=await sb.from('caretaker_contacts').select('id').eq('listing_id',lid).limit(1);
  if(crList&&crList.length){{
    await sb.from('caretaker_contacts').update({{caretaker_name:ctName,phone:ctPhone}}).eq('id',crList[0].id);
  }} else {{
    await sb.from('caretaker_contacts').insert({{listing_id:lid,caretaker_name:ctName,phone:ctPhone}});
  }}

  resetSave();
  closeModal('listingOverlay');
  toast(editId?'Listing updated ✓':'Listing added ✓');
  loadListings();
}}

function toggleAirbnbFields() {{
  const isAirbnb=document.getElementById('fListingType').value==='airbnb';
  document.getElementById('airbnb-fields').style.display=isAirbnb?'':'none';
  document.getElementById('fPrice').closest('.form-row').style.display=isAirbnb?'none':'';
}}
function populateAirbnbFields(l) {{
  document.getElementById('fListingType').value=l.listing_type||'rental';
  toggleAirbnbFields();
  if(l.listing_type==='airbnb'){{
    document.getElementById('fPriceNight').value=l.price_per_night||'';
    document.getElementById('fMaxGuests').value=l.max_guests||'';
    document.getElementById('fMinNights').value=l.min_nights||1;
  }}
}}
function resetSave() {{
  document.getElementById('saveBtn').disabled=false;
  document.getElementById('saveSpin').style.display='none';
  document.getElementById('saveIco').style.display='block';
  document.getElementById('saveTxt').textContent=document.getElementById('editId').value?'Update Listing':'Save Listing';
}}
function closeModal(id) {{ document.getElementById(id).classList.remove('open'); document.body.style.overflow=''; }}
function bgClose(e,id) {{ if(e.target===document.getElementById(id)) closeModal(id); }}

/* ── LOCATION / MAP ── */
function searchLocation() {{
  const q=document.getElementById('loc-search-inp').value.trim();
  if(!q){{alert('Enter a location to search');return;}}
  const res=document.getElementById('loc-results');
  res.innerHTML=`<div style="padding:.6rem 1rem;font-size:.75rem;color:var(--muted)">Searching...</div>`;
  res.style.display='';
  fetch('https://nominatim.openstreetmap.org/search?format=json&limit=5&q='+encodeURIComponent(q+', Kenya'))
    .then(r=>r.json())
    .then(data=>{{
      if(!data.length){{res.innerHTML=`<div style="padding:.6rem 1rem;font-size:.75rem;color:var(--muted)">No results found.</div>`;return;}}
      res.innerHTML=data.map(d=>`<div onclick="pickLocation(${{parseFloat(d.lat).toFixed(6)}},${{parseFloat(d.lon).toFixed(6)}},'${{d.display_name.replace(/'/,'').substring(0,60)}}')" style="padding:.6rem 1rem;font-size:.75rem;color:var(--ink);cursor:pointer;border-bottom:1px solid var(--border);transition:background .15s" onmouseover="this.style.background='var(--linen)'" onmouseout="this.style.background=''"><strong>${{d.display_name.substring(0,60)}}</strong><br><span style="color:var(--muted);font-size:.68rem">${{parseFloat(d.lat).toFixed(5)}}, ${{parseFloat(d.lon).toFixed(5)}}</span></div>`).join('');
    }}).catch(()=>{{res.innerHTML=`<div style="padding:.6rem 1rem;font-size:.75rem;color:#c0392b">Search failed.</div>`;}});
}}
function pickLocation(lat,lng,name) {{
  document.getElementById('fLat').value=lat;
  document.getElementById('fLng').value=lng;
  document.getElementById('pin-coords').textContent='📍 '+name+' ('+lat+', '+lng+')';
  document.getElementById('loc-results').style.display='none';
  document.getElementById('loc-search-inp').value='';
  const prev=document.getElementById('loc-map-preview');
  const iframe=document.getElementById('loc-map-iframe');
  if(prev&&iframe){{iframe.src='https://maps.google.com/maps?q='+lat+','+lng+'&z=17&output=embed';prev.style.display='';}}
}}
function manualCoords() {{
  const lat=document.getElementById('fLatManual').value.trim();
  const lng=document.getElementById('fLngManual').value.trim();
  if(!lat||!lng) return;
  document.getElementById('fLat').value=lat;
  document.getElementById('fLng').value=lng;
  document.getElementById('pin-coords').textContent='📍 Manual pin: '+lat+', '+lng;
  const prev=document.getElementById('loc-map-preview');
  const iframe=document.getElementById('loc-map-iframe');
  if(prev&&iframe){{iframe.src='https://maps.google.com/maps?q='+lat+','+lng+'&z=17&output=embed';prev.style.display='';}}
}}
function initAdminMap(lat,lng) {{
  if(lat&&lng){{
    document.getElementById('fLat').value=lat;
    document.getElementById('fLng').value=lng;
    document.getElementById('pin-coords').textContent='📍 Saved: '+parseFloat(lat).toFixed(5)+', '+parseFloat(lng).toFixed(5);
  }}
}}

/* ── SUBMISSIONS ── */
async function loadSubmissions() {{
  const {{data:subs,error}}=await sb.from('listing_submissions').select('*').order('created_at',{{ascending:false}});
  const list=document.getElementById('submissions-list');
  const empty=document.getElementById('submissions-empty');
  if(error||!subs?.length){{empty.style.display='block';list.innerHTML='';return;}}
  empty.style.display='none';
  const pending=subs.filter(s=>s.status==='pending').length;
  const badge=document.getElementById('sub-badge');
  if(badge){{badge.textContent=pending;badge.style.display=pending?'inline':'none';}}
  list.innerHTML=subs.map(s=>{{
    const photos=(s.photos||[]);
    const amens=(s.amenities||[]).join(', ')||'None listed';
    const sc=s.status==='approved'?'#1D9E75':s.status==='rejected'?'#C0392B':'#B8955A';
    const dt=new Date(s.created_at).toLocaleDateString('en-KE',{{day:'numeric',month:'short',year:'numeric'}});
    const rawPhone=(s.owner_phone||'').replace(/[^0-9]/g,'').replace(/^0/,'254');
    const waAdmin='https://wa.me/'+rawPhone+'?text='+encodeURIComponent('Hi '+s.owner_name+', NestFinder CUK admin here regarding your listing: '+s.title+'. ');
    const approveMsg='Hello '+s.owner_name+' ✅\\n\\nYour listing *\\"'+s.title+'\\"* has been reviewed and is now *LIVE* on NestFinder CUK.\\n\\nStudents can now find and contact you after a small verification fee.\\n\\nView it at: https://nestfindercuk.rocks\\n\\nThank you!\\n- NestFinder CUK Admin';
    const waApprove='https://wa.me/'+rawPhone+'?text='+encodeURIComponent(approveMsg);
    return '<div style="background:#fff;border:1px solid rgba(184,149,90,.18);overflow:hidden" id="sub-'+s.id+'">'
      +'<div style="padding:1rem 1.5rem;border-bottom:1px solid rgba(184,149,90,.1);display:flex;justify-content:space-between;align-items:flex-start;gap:.75rem;flex-wrap:wrap">'
      +'<div><div style="font-family:Cormorant Garamond,serif;font-size:1.2rem;color:#16130E">'+s.title+'</div>'
      +'<div style="font-size:.68rem;color:#8A8070;margin-top:.2rem">'+(s.room_type||'')+(s.location?' · '+s.location:'')+' · '+dt+'</div></div>'
      +'<span style="font-size:.58rem;letter-spacing:.12em;text-transform:uppercase;color:'+sc+';border:1px solid '+sc+';padding:2px 8px">'+s.status+'</span></div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid rgba(184,149,90,.08)">'
      +'<div style="padding:1rem 1.5rem;border-right:1px solid rgba(184,149,90,.08)">'
      +'<div style="font-size:.55rem;letter-spacing:.16em;text-transform:uppercase;color:#B8955A;margin-bottom:.5rem">Owner</div>'
      +'<div style="font-size:.85rem;font-weight:500;color:#16130E">'+s.owner_name+'</div>'
      +'<div style="font-size:.75rem;color:#4A4438;margin-top:.15rem">'+(s.owner_phone||'')+(s.owner_role?' · '+s.owner_role:'')+'</div>'
      +(s.owner_email?'<div style="font-size:.7rem;color:#8A8070;margin-top:.1rem">'+s.owner_email+'</div>':'')+'</div>'
      +'<div style="padding:1rem 1.5rem">'
      +'<div style="font-size:.55rem;letter-spacing:.16em;text-transform:uppercase;color:#B8955A;margin-bottom:.5rem">Rent &amp; Contact Fee</div>'
      +'<div style="font-family:Cormorant Garamond,serif;font-size:1.5rem;color:#16130E;font-weight:300">Ksh '+(s.price||0).toLocaleString()+'/mo</div>'
      +(s.night_price?'<div style="font-size:.7rem;color:#8A8070">Short stay: Ksh '+s.night_price+'/night</div>':'')
      +'<div style="margin-top:.6rem;display:flex;align-items:center;gap:.5rem">'
      +'<input id="fee-'+s.id+'" type="number" value="'+(s.contact_fee||250)+'" min="100" max="1000" step="50" '
      +'style="width:90px;padding:.35rem .5rem;border:1px solid rgba(184,149,90,.35);font-family:Jost,sans-serif;font-size:.82rem;background:#F8F4EE;color:#16130E;outline:none"/>'
      +'<span style="font-size:.65rem;color:#8A8070">Ksh students pay</span></div></div></div>'
      +(s.description?'<div style="padding:.85rem 1.5rem;border-bottom:1px solid rgba(184,149,90,.08);font-size:.78rem;color:#4A4438;line-height:1.75">'+s.description+'</div>':'')
      +'<div style="padding:.6rem 1.5rem;border-bottom:1px solid rgba(184,149,90,.08);font-size:.68rem;color:#8A8070"><strong style="color:#B8955A">Amenities:</strong> '+amens+'</div>'
      +'<div style="padding:.6rem 1.5rem;border-bottom:1px solid rgba(184,149,90,.08);display:flex;gap:2rem;flex-wrap:wrap">'
      +'<span style="font-size:.68rem;color:#8A8070"><strong style="color:#B8955A">Vacants:</strong> '+(s.vacants||1)+' unit(s)</span>'
      +(s.contact_number?'<span style="font-size:.72rem;background:rgba(29,158,117,.08);border:1px solid rgba(29,158,117,.25);padding:3px 10px;color:#1D9E75"><strong style="color:#B8955A">Student Contact (private):</strong> '+s.contact_number+'</span>':'')+'</div>'
      +(s.landmark?'<div style="padding:.5rem 1.5rem;border-bottom:1px solid rgba(184,149,90,.08);font-size:.68rem;color:#8A8070"><strong style="color:#B8955A">Landmark:</strong> '+s.landmark+'</div>':'')
      +(s.notes?'<div style="padding:.6rem 1.5rem;border-bottom:1px solid rgba(184,149,90,.08);font-size:.72rem;color:#8A8070;font-style:italic">\\"'+s.notes+'\\"</div>':'')
      +(photos.length?'<div style="padding:.75rem 1.5rem;border-bottom:1px solid rgba(184,149,90,.08);display:flex;gap:.5rem;flex-wrap:wrap">'+photos.map(p=>'<img src="'+p+'" style="width:76px;height:76px;object-fit:cover;border:1px solid rgba(184,149,90,.2);cursor:pointer" onclick="window.open(\\''+p+'\\',\\'_blank\\')"/>').join('')+'</div>':'')
      +'<div style="padding:.85rem 1.5rem;background:#F8F4EE;display:flex;gap:.6rem;flex-wrap:wrap">'
      +(s.status!=='approved'?'<button onclick="approveSubmission(\\''+s.id+'\\',\\''+waApprove+'\\\')" style="background:#16130E;color:#fff;border:none;font-family:Jost,sans-serif;font-size:.62rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:.6rem 1.25rem;cursor:pointer">Approve &amp; Go Live</button>':'')
      +(s.status==='pending'?'<button onclick="rejectSubmission(\\''+s.id+'\\\')" style="background:transparent;color:#C0392B;border:1px solid #C0392B;font-family:Jost,sans-serif;font-size:.62rem;font-weight:500;letter-spacing:.08em;text-transform:uppercase;padding:.6rem 1rem;cursor:pointer">Reject</button>':'')
      +'<a href="'+waAdmin+'" target="_blank" style="background:transparent;color:#25D366;border:1px solid #25D366;font-family:Jost,sans-serif;font-size:.62rem;font-weight:500;letter-spacing:.08em;text-transform:uppercase;padding:.6rem 1rem;text-decoration:none">WhatsApp Owner</a>'
      +'</div></div>';
  }}).join('');
}}

async function approveSubmission(id, waUrl) {{
  const fee=parseInt(document.getElementById('fee-'+id)?.value||250);
  const {{error}}=await sb.from('listing_submissions').update({{status:'approved',contact_fee:fee}}).eq('id',id);
  if(!error){{window.open(waUrl,'_blank');setTimeout(loadSubmissions,1000);}}
  else{{toast('Update failed: '+error.message,true);}}
}}
async function rejectSubmission(id) {{
  if(!confirm('Reject this submission?')) return;
  await sb.from('listing_submissions').update({{status:'rejected'}}).eq('id',id);
  setTimeout(loadSubmissions,600);
}}

/* ── REFERRALS ── */
async function loadReferrals() {{
  const {{data:rows,error}}=await sb.from('referral_earnings').select('*,profiles(full_name)').order('created_at',{{ascending:false}});
  const stats=document.getElementById('ref-stats');
  const list=document.getElementById('ref-list');
  const empty=document.getElementById('ref-empty');
  if(error||!rows?.length){{empty.style.display='block';list.innerHTML='';stats.innerHTML='';return;}}
  empty.style.display='none';
  const total=rows.reduce((s,r)=>s+(r.amount||50),0);
  const pending=rows.filter(r=>r.status==='pending');
  const paid=rows.filter(r=>r.status==='paid');
  stats.innerHTML=`
    <div style="background:#fff;border:1px solid rgba(184,149,90,.15);padding:1rem 1.25rem">
      <div style="font-size:.52rem;letter-spacing:.16em;text-transform:uppercase;color:#B8955A;margin-bottom:.3rem">Total Earned</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:1.8rem;color:#16130E;font-weight:300">Ksh ${{total.toLocaleString()}}</div>
    </div>
    <div style="background:#fff;border:1px solid rgba(184,149,90,.15);padding:1rem 1.25rem">
      <div style="font-size:.52rem;letter-spacing:.16em;text-transform:uppercase;color:#B8955A;margin-bottom:.3rem">Pending Payout</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:1.8rem;color:#C0392B;font-weight:300">Ksh ${{(pending.length*50).toLocaleString()}}</div>
    </div>
    <div style="background:#fff;border:1px solid rgba(184,149,90,.15);padding:1rem 1.25rem">
      <div style="font-size:.52rem;letter-spacing:.16em;text-transform:uppercase;color:#B8955A;margin-bottom:.3rem">Paid Out</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:1.8rem;color:#1D9E75;font-weight:300">Ksh ${{(paid.length*50).toLocaleString()}}</div>
    </div>`;
  list.innerHTML=rows.map(row=>{{
    const name=row.profiles?.full_name||'Student';
    const dt=new Date(row.created_at).toLocaleDateString('en-KE',{{day:'numeric',month:'short',year:'numeric'}});
    const sc=row.status==='paid'?'#1D9E75':'#B8955A';
    return `<div style="background:#fff;border:1px solid rgba(184,149,90,.12);padding:.85rem 1.25rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
      <div style="flex:1;min-width:120px">
        <div style="font-size:.82rem;font-weight:500;color:#16130E">${{name}}</div>
        <div style="font-size:.65rem;color:#8A8070;margin-top:.15rem">${{dt}} · Code: ${{row.promo_code||'—'}}</div>
      </div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:1.2rem;color:#16130E">Ksh ${{row.amount||50}}</div>
      <span style="font-size:.55rem;letter-spacing:.12em;text-transform:uppercase;color:${{sc}};border:1px solid ${{sc}};padding:2px 8px">${{row.status}}</span>
      ${{row.status==='pending'?`<button onclick="markRefPaid('${{row.id}}')" style="background:#16130E;color:#D4B483;border:none;font-family:Jost,sans-serif;font-size:.6rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:.5rem 1rem;cursor:pointer">Mark Paid</button>`:''}}
    </div>`;
  }}).join('');
}}
async function markRefPaid(id) {{
  await sb.from('referral_earnings').update({{status:'paid'}}).eq('id',id);
  loadReferrals();
}}

/* ── BOOT ── */
init();
document.addEventListener('keydown', e => {{
  if(e.key==='Escape') document.querySelectorAll('.overlay.open').forEach(o=>o.classList.remove('open'));
}});
</script>
</body>
</html>
'''

# ── 3. Write new file ─────────────────────────────────────────────────────────
output = ''.join(head_and_body) + SCRIPT

with open('admin.html', 'w') as f:
    f.write(output)

# Verify
with open('admin.html', 'r') as f:
    content = f.read()

lines_out = content.count('\n')
has_supabase_cdn = 'cdn.jsdelivr.net/npm/@supabase/supabase-js' in content
has_firebase = 'firebase.firestore()' in content or 'firebase.auth()' in content
has_window_sb = 'window.sb' in content
sb_client_ref = 'sb-client.js' in content

print(f"Lines: {lines_out}")
print(f"Supabase CDN: {has_supabase_cdn}")
print(f"Firebase remaining: {has_firebase}")
print(f"window.sb reference: {has_window_sb}")
print(f"sb-client.js reference: {sb_client_ref}")
print("Done.")
