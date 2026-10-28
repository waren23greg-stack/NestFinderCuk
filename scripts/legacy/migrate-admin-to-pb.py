#!/usr/bin/env python3
"""Migrates admin.html from Supabase to PocketBase. Run from ~/NestFinderCuk/"""

PB = 'https://pocketbase-production-f91f.up.railway.app'

with open('admin.html','r') as f: c=f.read()

# ── 1. CDN ─────────────────────────────────────────────────────────────────
c = c.replace(
    '<script src="https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js"></script>\n',
    ''
)
print("1. CDN removed")

# ── 2. Init ────────────────────────────────────────────────────────────────
old2 = ("const sb = supabase.createClient('https://mtycapgbtvpczvswpjpo.supabase.co',"
        " 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
        ".eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eWNhcGdidHZwY3p2c3dwanBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjQxNDgsImV4cCI6MjA4OTYwMDE0OH0"
        ".owJeYO2kHs1F82kPQeML6uHUarchKT_ybe79OBBV6wM');")
new2 = ("const PB='"+PB+"';\n"
        "async function pbFetch(path,opts){\n"
        "  opts=opts||{};\n"
        "  const token=localStorage.getItem('pb-token');\n"
        "  const headers=Object.assign({'Content-Type':'application/json'},token?{Authorization:'Bearer '+token}:{},opts.headers||{});\n"
        "  const res=await fetch(PB+path,Object.assign({},opts,{headers}));\n"
        "  if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e.message||'Request failed');}\n"
        "  return res.json();\n"
        "}\n"
        "async function pbGet(col,params){\n"
        "  params=params||{};\n"
        "  const q=new URLSearchParams(params).toString();\n"
        "  return pbFetch('/api/collections/'+col+'/records'+(q?'?'+q:''));\n"
        "}\n"
        "async function pbPost(col,data){return pbFetch('/api/collections/'+col+'/records',{method:'POST',body:JSON.stringify(data)});}\n"
        "async function pbPatch(col,id,data){return pbFetch('/api/collections/'+col+'/records/'+id,{method:'PATCH',body:JSON.stringify(data)});}\n"
        "async function pbDelete(col,id){return pbFetch('/api/collections/'+col+'/records/'+id,{method:'DELETE'});}")
if old2 in c: c=c.replace(old2,new2,1); print("2. Init replaced")
else: print("2. WARN: init not found")

# ── 3. Auth gate ───────────────────────────────────────────────────────────
old3 = ("  const { data: { session } } = await sb.auth.getSession();\n"
        "  if (!session) { window.location.href = 'login.html'; return; }\n"
        "  try {\n"
        "    const { data: profile } = await sb.from('profiles').select('role,full_name').eq('id', session.user.id).single();\n"
        "    document.getElementById('loading').classList.add('hide');\n"
        "    if (!profile || profile.role !== 'admin') { document.getElementById('denied').classList.add('show'); return; }\n"
        "    document.getElementById('adminName').textContent = (profile.full_name || 'Admin').split(' ')[0];\n"
        "    loadDashboard();\n"
        "  } catch(e) { console.error(e); window.location.href = 'login.html'; }")
new3 = ("  const token=localStorage.getItem('pb-token');\n"
        "  const stored=localStorage.getItem('pb-user');\n"
        "  if(!token||!stored){window.location.href='login.html';return;}\n"
        "  const pbUser=JSON.parse(stored);\n"
        "  try{\n"
        "    const profile=await pbFetch('/api/collections/users/records/'+pbUser.id);\n"
        "    document.getElementById('loading').classList.add('hide');\n"
        "    if(!profile||profile.role!=='admin'){document.getElementById('denied').classList.add('show');return;}\n"
        "    document.getElementById('adminName').textContent=(profile.full_name||'Admin').split(' ')[0];\n"
        "    loadDashboard();\n"
        "  }catch(e){console.error(e);window.location.href='login.html';}")
if old3 in c: c=c.replace(old3,new3,1); print("3. Auth gate replaced")
else: print("3. WARN: auth gate not found")

# ── 4. Sign out ────────────────────────────────────────────────────────────
c=c.replace(
    "  await sb.auth.signOut();\n  window.location.href = 'login.html';",
    "  localStorage.removeItem('pb-token');localStorage.removeItem('pb-user');\n  window.location.href='login.html';"
)
print("4. Sign out replaced")

# ── 5. Dashboard Promise.all ───────────────────────────────────────────────
old5 = ("    sb.from('listings').select('id,available', {count:'exact'}),\n"
        "    sb.from('payments').select('id,status,amount,created_at', {count:'exact'}),\n"
        "    sb.from('profiles').select('id', {count:'exact'}).eq('role','student'),\n"
        "    sb.from('moving_requests').select('price,status,created_at').catch(() => ({data:[]}))")
new5 = ("    pbGet('listings',{perPage:200}),\n"
        "    pbGet('payments',{perPage:200}),\n"
        "    pbGet('users',{filter:'role=\"student\"',perPage:1}),\n"
        "    pbGet('moving_requests',{perPage:200}).catch(function(){return {items:[]};")  + "})"
if old5 in c: c=c.replace(old5,new5,1); print("5. Dashboard Promise.all replaced")
else: print("5. WARN: dashboard Promise.all not found")

# ── 6. Dashboard count variables ──────────────────────────────────────────
old6 = ("  const avail = (l.data||[]).filter(x => x.available).length;\n"
        "  const confirmed = (p.data||[]).filter(x => x.status==='confirmed');\n"
        "  const listingsRev = confirmed.reduce((s,x) => s+(x.amount||250), 0);\n"
        "  const moverData = mv.data||[];\n"
        "  const moverConfirmed = moverData.filter(x => x.status==='confirmed'||x.status==='done');\n"
        "  const moversRev = moverConfirmed.reduce((s,x) => s+(parseInt(x.price)||0), 0);\n"
        "  document.getElementById('s-listings').textContent = l.count ?? 0;\n"
        "  document.getElementById('s-avail').textContent = avail;\n"
        "  document.getElementById('s-students').textContent = u.count ?? 0;")
new6 = ("  const avail = (l.items||[]).filter(x => x.available).length;\n"
        "  const confirmed = (p.items||[]).filter(x => x.status==='confirmed');\n"
        "  const listingsRev = confirmed.reduce((s,x) => s+(x.amount||250), 0);\n"
        "  const moverData = mv.items||[];\n"
        "  const moverConfirmed = moverData.filter(x => x.status==='confirmed'||x.status==='done');\n"
        "  const moversRev = moverConfirmed.reduce((s,x) => s+(parseInt(x.price)||0), 0);\n"
        "  document.getElementById('s-listings').textContent = l.totalItems ?? 0;\n"
        "  document.getElementById('s-avail').textContent = avail;\n"
        "  document.getElementById('s-students').textContent = u.totalItems ?? 0;")
if old6 in c: c=c.replace(old6,new6,1); print("6. Dashboard counts replaced")
else: print("6. WARN: dashboard counts not found")

# ── 7. Recent payments fetch ───────────────────────────────────────────────
old7 = "  const {data:rp} = await sb.from('payments').select('*,profiles(full_name),listings(title)').order('created_at',{ascending:false}).limit(8);"
new7 = ("  const _rp=await pbGet('payments',{sort:'-created',perPage:8}).catch(function(){return{items:[]};});\n"
        "  const rp=_rp.items||[];\n"
        "  // Enrich with user/listing names\n"
        "  const _allU=await pbGet('users',{perPage:200}).catch(function(){return{items:[]};});\n"
        "  const _allL=await pbGet('listings',{perPage:200}).catch(function(){return{items:[]};});\n"
        "  const _uMap={}; (_allU.items||[]).forEach(function(u){_uMap[u.id]=u;});\n"
        "  const _lMap={}; (_allL.items||[]).forEach(function(l){_lMap[l.id]=l;});\n"
        "  rp.forEach(function(p){p.profiles={full_name:(_uMap[p.user_id]||{}).full_name||p.user_id};p.listings={title:(_lMap[p.listing_id]||{}).title||p.listing_id};});")
if old7 in c: c=c.replace(old7,new7,1); print("7. Recent payments replaced")
else: print("7. WARN: recent payments not found")

# ── 8. buildChart moverConfirmed arg ──────────────────────────────────────
c=c.replace("  buildChart(confirmed, moverConfirmed);","  buildChart(confirmed,moverConfirmed);")

# ── 9. loadListings ────────────────────────────────────────────────────────
old9 = "  const {data} = await sb.from('listings').select('*').order('created_at',{ascending:false});"
new9 = "  const _lr=await pbGet('listings',{sort:'-created',perPage:200});\n  const data=_lr.items||[];"
if old9 in c: c=c.replace(old9,new9,1); print("9. loadListings replaced")
else: print("9. WARN: loadListings not found")

# ── 10. toggleAvail ────────────────────────────────────────────────────────
c=c.replace(
    "  await sb.from('listings').update({available:newVal}).eq('id',id);",
    "  await pbPatch('listings',id,{available:newVal});"
)
print("10. toggleAvail replaced")

# ── 11. delListing ─────────────────────────────────────────────────────────
old11 = ("  await sb.from('payments').delete().eq('listing_id',id);\n"
         "  const {error} = await sb.from('listings').delete().eq('id',id);")
new11 = ("  await pbFetch('/api/collections/payments/records?filter=listing_id=\"'+id+'\"',{method:'GET'}).catch(function(){});\n"
         "  let error=null;\n"
         "  try{await pbDelete('listings',id);}catch(e){error=e;}")
if old11 in c: c=c.replace(old11,new11,1); print("11. delListing replaced")
else: print("11. WARN: delListing not found")

# ── 12. loadPayments ──────────────────────────────────────────────────────
old12 = "  const {data} = await sb.from('payments').select('*,profiles(full_name),listings(title)').order('created_at',{ascending:false});"
new12 = ("  const _pRes=await pbGet('payments',{sort:'-created',perPage:200}).catch(function(){return{items:[]};});\n"
         "  const _pAllU=await pbGet('users',{perPage:200}).catch(function(){return{items:[]};});\n"
         "  const _pAllL=await pbGet('listings',{perPage:200}).catch(function(){return{items:[]};});\n"
         "  const _puMap={}; (_pAllU.items||[]).forEach(function(u){_puMap[u.id]=u;});\n"
         "  const _plMap={}; (_pAllL.items||[]).forEach(function(l){_plMap[l.id]=l;});\n"
         "  const data=(_pRes.items||[]);\n"
         "  data.forEach(function(p){p.profiles={full_name:(_puMap[p.user_id]||{}).full_name||'—'};p.listings={title:(_plMap[p.listing_id]||{}).title||'—'};});")
if old12 in c: c=c.replace(old12,new12,1); print("12. loadPayments replaced")
else: print("12. WARN: loadPayments not found")

# ── 13. Payment status updates ────────────────────────────────────────────
c=c.replace("  await sb.from('payments').update({status:'confirmed'}).eq('id',id);\n  toast('Payment confirmed", "  await pbPatch('payments',id,{status:'confirmed'});\n  toast('Payment confirmed")
c=c.replace("  await sb.from('payments').update({status:'denied'}).eq('id',id);","  await pbPatch('payments',id,{status:'denied'});")
c=c.replace("  await sb.from('payments').update({status:'confirmed'}).eq('id',id);\n  toast('Payment restored","  await pbPatch('payments',id,{status:'confirmed'});\n  toast('Payment restored")
print("13. Payment updates replaced")

# ── 14. loadStudents ──────────────────────────────────────────────────────
old14 = "  const {data} = await sb.from('profiles').select('*').order('created_at',{ascending:false});"
new14 = "  const _sRes=await pbGet('users',{sort:'-created',perPage:200}).catch(function(){return{items:[]};});\n  const data=_sRes.items||[];"
if old14 in c: c=c.replace(old14,new14,1); print("14. loadStudents replaced")
else: print("14. WARN: loadStudents not found")

# ── 15. makeAdmin / removeStudent ─────────────────────────────────────────
c=c.replace(
    "  await sb.from('profiles').update({role:'admin'}).eq('id',id);",
    "  await pbPatch('users',id,{role:'admin'});"
)
old15b = "  const {error} = await sb.from('profiles').delete().eq('id',id);\n  if (error) { toast('Remove failed: '+error.message, true); return; }"
new15b = "  let error=null;\n  try{await pbDelete('users',id);}catch(e){error=e;}\n  if(error){toast('Remove failed: '+error.message,true);return;}"
if old15b in c: c=c.replace(old15b,new15b,1); print("15. makeAdmin/remove replaced")
else: print("15. WARN: makeAdmin/remove not found")

# ── 16. loadReports ───────────────────────────────────────────────────────
old16 = "  const {data} = await sb.from('reports').select('*,listings(title)').order('created_at',{ascending:false});"
new16 = ("  const _repRes=await pbGet('reports',{sort:'-created',perPage:200}).catch(function(){return{items:[]};});\n"
         "  const _repL=await pbGet('listings',{perPage:200}).catch(function(){return{items:[]};});\n"
         "  const _repLMap={}; (_repL.items||[]).forEach(function(l){_repLMap[l.id]=l;});\n"
         "  const data=(_repRes.items||[]);\n"
         "  data.forEach(function(r){r.listings={title:(_repLMap[r.listing_id]||{}).title||r.listing_title||'—'};});")
if old16 in c: c=c.replace(old16,new16,1); print("16. loadReports replaced")
else: print("16. WARN: loadReports not found")

# ── 17. updateReport ──────────────────────────────────────────────────────
c=c.replace(
    "  await sb.from('reports').update({status}).eq('id',id);",
    "  await pbPatch('reports',id,{status:status});"
)
print("17. updateReport replaced")

# ── 18. loadMovers ────────────────────────────────────────────────────────
old18 = "  const {data, error} = await sb.from('moving_requests').select('*').order('created_at',{ascending:false});"
new18 = "  const _mvRes=await pbGet('moving_requests',{sort:'-created',perPage:200}).catch(function(){return{items:[]};});\n  const data=_mvRes.items||[];\n  const error=null;"
if old18 in c: c=c.replace(old18,new18,1); print("18. loadMovers replaced")
else: print("18. WARN: loadMovers not found")

# ── 19. updateMover ───────────────────────────────────────────────────────
c=c.replace(
    "  await sb.from('moving_requests').update({status}).eq('id',id);",
    "  await pbPatch('moving_requests',id,{status:status});"
)
print("19. updateMover replaced")

# ── 20. editListing fetches ───────────────────────────────────────────────
c=c.replace(
    "  const {data:h} = await sb.from('listings').select('*').eq('id',id).single();",
    "  let h=null;\n  try{h=await pbFetch('/api/collections/listings/records/'+id);}catch(e){}"
)
c=c.replace(
    "  const {data:ctList} = await sb.from('caretaker_contacts').select('*').eq('listing_id',id).limit(1);",
    "  const _ctRes=await pbGet('caretaker_contacts',{filter:'listing_id=\"'+id+'\"',perPage:1}).catch(function(){return{items:[]};});\n  const ctList=_ctRes.items||[];"
)
print("20. editListing fetches replaced")

# ── 21. saveListing update/insert ─────────────────────────────────────────
old21a = "    const {error:ue}=await sb.from('listings').update(payload).eq('id',editId);\n    if(ue){showFErr('Update failed: '+ue.message);resetSave();return;}"
new21a = "    try{await pbPatch('listings',editId,payload);}catch(ue){showFErr('Update failed: '+ue.message);resetSave();return;}"
if old21a in c: c=c.replace(old21a,new21a,1); print("21a. listing update replaced")
else: print("21a. WARN: listing update not found")

old21b = "    const {data:nd,error:ie}=await sb.from('listings').insert(payload).select().single();\n    if(ie){showFErr('Insert failed: '+ie.message);resetSave();return;}\n    lid=nd.id;"
new21b = "    let nd=null;\n    try{nd=await pbPost('listings',payload);}catch(ie){showFErr('Insert failed: '+ie.message);resetSave();return;}\n    lid=nd.id;"
if old21b in c: c=c.replace(old21b,new21b,1); print("21b. listing insert replaced")
else: print("21b. WARN: listing insert not found")

# ── 22. Caretaker upsert ──────────────────────────────────────────────────
old22 = ("  const {data:crList}=await sb.from('caretaker_contacts').select('id').eq('listing_id',lid).limit(1);\n"
         "  if(crList&&crList.length){\n"
         "    await sb.from('caretaker_contacts').update({caretaker_name:ctName,phone:ctPhone}).eq('id',crList[0].id);\n"
         "  } else {\n"
         "    await sb.from('caretaker_contacts').insert({listing_id:lid,caretaker_name:ctName,phone:ctPhone});\n"
         "  }")
new22 = ("  const _ctCheck=await pbGet('caretaker_contacts',{filter:'listing_id=\"'+lid+'\"',perPage:1}).catch(function(){return{items:[]};});\n"
         "  const _ctExist=_ctCheck.items&&_ctCheck.items.length?_ctCheck.items[0]:null;\n"
         "  if(_ctExist){\n"
         "    await pbPatch('caretaker_contacts',_ctExist.id,{caretaker_name:ctName,phone:ctPhone});\n"
         "  } else {\n"
         "    await pbPost('caretaker_contacts',{listing_id:lid,caretaker_name:ctName,phone:ctPhone});\n"
         "  }")
if old22 in c: c=c.replace(old22,new22,1); print("22. Caretaker upsert replaced")
else: print("22. WARN: caretaker upsert not found")

# ── 23. loadSubmissions ───────────────────────────────────────────────────
c=c.replace(
    "  const {data:subs,error}=await sb.from('listing_submissions').select('*').order('created_at',{ascending:false});",
    "  const _subRes=await pbGet('listing_submissions',{sort:'-created',perPage:200}).catch(function(){return{items:[]};});\n  const subs=_subRes.items||[];\n  const error=null;"
)
print("23. loadSubmissions replaced")

# ── 24. approveSubmission ─────────────────────────────────────────────────
c=c.replace(
    "  const {error}=await sb.from('listing_submissions').update({status:'approved',contact_fee:fee}).eq('id',id);",
    "  let error=null;\n  try{await pbPatch('listing_submissions',id,{status:'approved',contact_fee:fee});}catch(e){error=e;}"
)
print("24. approveSubmission replaced")

# ── 25. rejectSubmission ──────────────────────────────────────────────────
c=c.replace(
    "  await sb.from('listing_submissions').update({status:'rejected'}).eq('id',id);",
    "  await pbPatch('listing_submissions',id,{status:'rejected'}).catch(function(){});"
)
print("25. rejectSubmission replaced")

# ── 26. loadReferrals ─────────────────────────────────────────────────────
old26 = "  const {data:rows,error}=await sb.from('referral_earnings').select('*,profiles(full_name)').order('created_at',{ascending:false});"
new26 = ("  const _refRes=await pbGet('referral_earnings',{sort:'-created',perPage:200}).catch(function(){return{items:[]};});\n"
         "  const _refU=await pbGet('users',{perPage:200}).catch(function(){return{items:[]};});\n"
         "  const _refUMap={}; (_refU.items||[]).forEach(function(u){_refUMap[u.id]=u;});\n"
         "  const rows=(_refRes.items||[]);\n"
         "  rows.forEach(function(r){r.profiles={full_name:(_refUMap[r.user_id]||{}).full_name||'Student'};});\n"
         "  const error=null;")
if old26 in c: c=c.replace(old26,new26,1); print("26. loadReferrals replaced")
else: print("26. WARN: loadReferrals not found")

# ── 27. markRefPaid ───────────────────────────────────────────────────────
c=c.replace(
    "  await sb.from('referral_earnings').update({status:'paid'}).eq('id',id);",
    "  await pbPatch('referral_earnings',id,{status:'paid'}).catch(function(){});"
)
print("27. markRefPaid replaced")

# ── 28. resetStudentPassword ──────────────────────────────────────────────
c=c.replace(
    "  const r = await fetch('/api/auth/reset-request', {\n    method:'POST', headers:{'Content-Type':'application/json'},\n    body: JSON.stringify({email})\n  });",
    "  const r = await fetch('/api/auth/reset-request', {\n    method:'POST', headers:{'Content-Type':'application/json'},\n    body: JSON.stringify({email:email})\n  });"
)
print("28. resetStudentPassword fetch kept as-is")

with open('admin.html','w') as f: f.write(c)

remaining = c.count('sb.from(') + c.count('sb.auth.') + c.count('supabase.createClient')
print(f"\nRemaining Supabase refs: {remaining}")
if remaining > 0:
    for i,line in enumerate(c.split('\n'),1):
        if 'sb.from(' in line or 'sb.auth.' in line or 'supabase.createClient' in line:
            print(f"  Line {i}: {line.strip()[:90]}")
print("Done.")
