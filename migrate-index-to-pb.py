#!/usr/bin/env python3
PB = 'https://pocketbase-production-f91f.up.railway.app'

with open('index.html','r') as f: c=f.read()

# 1. Remove Supabase CDN
c = c.replace('<script src="https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js"></script>\n','')
print("1. CDN removed")

# 2. Replace Supabase init
old2 = ("const SUPABASE_URL='https://mtycapgbtvpczvswpjpo.supabase.co';\n"
        "const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
        ".eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eWNhcGdidHZwY3p2c3dwanBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjQxNDgsImV4cCI6MjA4OTYwMDE0OH0"
        ".owJeYO2kHs1F82kPQeML6uHUarchKT_ybe79OBBV6wM';\n"
        "const sb=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);")

new2 = (
    "const PB='" + PB + "';\n"
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
    "async function pbPost(col,data){\n"
    "  return pbFetch('/api/collections/'+col+'/records',{method:'POST',body:JSON.stringify(data)});\n"
    "}\n"
    "async function pbAuthCall(email,password){\n"
    "  return pbFetch('/api/collections/users/auth-with-password',{method:'POST',body:JSON.stringify({identity:email,password:password})});\n"
    "}"
)

if old2 in c: c=c.replace(old2,new2,1); print("2. Init replaced")
else: print("2. WARN: init not found - check manually")

# 3. Remove auth state change
old3 = ("// Bridge: keep legacy raw-REST pages (payments.html etc.) in sync with\n"
        "// the real SDK's session — covers sign-in, sign-out, and automatic\n"
        "// background token refresh, all in one place.\n"
        "sb.auth.onAuthStateChange(function(event,session){\n"
        "  if(session){\n"
        "    localStorage.setItem('sb-token',session.access_token);\n"
        "    if(session.refresh_token)localStorage.setItem('sb-refresh',session.refresh_token);\n"
        "  }else{\n"
        "    localStorage.removeItem('sb-token');\n"
        "    localStorage.removeItem('sb-refresh');\n"
        "  }\n"
        "});")
new3 = "// PocketBase: token stored in localStorage as 'pb-token'"
if old3 in c: c=c.replace(old3,new3,1); print("3. Auth state removed")
else: print("3. WARN: auth state not found")

# 4. Replace initAuth
old4 = (
    "async function initAuth(){\n"
    "  const {data:{session}}=await sb.auth.getSession();\n"
    "  const sbUser=session?session.user:null;\n"
    "  if(!sbUser){return;}\n"
    "  user=sbUser;\n"
    "  // Show UI immediately from Auth data (no profile fetch needed)\n"
    '  const name=(sbUser.user_metadata?.full_name||sbUser.email||"Student").split(" ")[0];\n'
    '  document.getElementById("nav-hello").textContent=name;\n'
    "  document.getElementById('nav-user-menu').style.display='';\n"
    "  document.getElementById('nav-in').style.display='none';\n"
    '  document.getElementById("nav-in").style.display="none";\n'
    '  document.getElementById("nav-out").style.display="";\n'
    "  document.getElementById(\"drawer-in\").style.display=\"none\";\n"
    "  document.getElementById(\"drawer-out\").style.display=\"\";\n"
    '  document.getElementById("drawer-user").textContent="Signed in as "+name;\n'
    '  ["nav-payments","drawer-payments","bot-payments"].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display=(id==="nav-admin"?"flex":"");});\n'
    '  user.display_name=name;\n'
    '  user.role="student";\n'
    '  // Try profiles table for admin check (non-blocking)\n'
    "  try{\n"
    '    const {data:prof}=await sb.from("profiles").select("*").eq("id",sbUser.id).single();\n'
    "    if(prof&&prof.full_name){\n"
    '      const n=prof.full_name.split(" ")[0];\n'
    '      document.getElementById("nav-hello").textContent="Hi, "+n;\n'
    '      document.getElementById("drawer-user").textContent="Signed in as "+n;\n'
    "      user.display_name=prof.full_name;\n"
    "    }\n"
    '    user.role=(prof&&prof.role)||"student";\n'
    '    if(prof&&prof.role==="admin"){\n'
    '      ["nav-admin","drawer-admin"].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display=(id==="nav-admin"?"flex":"");});\n'
    '      const ba=document.getElementById("bot-admin");if(ba)ba.style.display="";\n'
    "    }\n"
    "  }catch(e){console.warn(\"Profile load failed\",e);}\n"
    "  refreshListings();\n"
    "}"
)
new4 = (
    "async function initAuth(){\n"
    "  const token=localStorage.getItem('pb-token');\n"
    "  const stored=localStorage.getItem('pb-user');\n"
    "  if(!token||!stored){return;}\n"
    "  try{user=JSON.parse(stored);}catch{return;}\n"
    "  const name=(user.full_name||user.email||'Student').split(' ')[0];\n"
    "  document.getElementById('nav-hello').textContent=name;\n"
    "  document.getElementById('nav-user-menu').style.display='';\n"
    "  document.getElementById('nav-in').style.display='none';\n"
    "  document.getElementById('nav-out').style.display='';\n"
    "  document.getElementById('drawer-in').style.display='none';\n"
    "  document.getElementById('drawer-out').style.display='';\n"
    "  document.getElementById('drawer-user').textContent='Signed in as '+name;\n"
    "  ['nav-payments','drawer-payments','bot-payments'].forEach(function(id){\n"
    "    const el=document.getElementById(id);if(el)el.style.display='';\n"
    "  });\n"
    "  user.display_name=name;\n"
    "  user.role=user.role||'student';\n"
    "  if(user.role==='admin'){\n"
    "    ['nav-admin','drawer-admin'].forEach(function(id){const el=document.getElementById(id);if(el)el.style.display=(id==='nav-admin'?'flex':'');});\n"
    "    const ba=document.getElementById('bot-admin');if(ba)ba.style.display='';\n"
    "  }\n"
    "  try{\n"
    "    const fresh=await pbFetch('/api/collections/users/records/'+user.id);\n"
    "    user.role=fresh.role||'student';\n"
    "    if(fresh.role==='admin'){\n"
    "      ['nav-admin','drawer-admin'].forEach(function(id){const el=document.getElementById(id);if(el)el.style.display=(id==='nav-admin'?'flex':'');});\n"
    "      const ba=document.getElementById('bot-admin');if(ba)ba.style.display='';\n"
    "    }\n"
    "    localStorage.setItem('pb-user',JSON.stringify(Object.assign({},user,fresh)));\n"
    "  }catch(e){doSignOut();return;}\n"
    "  refreshListings();\n"
    "}"
)
if old4 in c: c=c.replace(old4,new4,1); print("4. initAuth replaced")
else: print("4. WARN: initAuth not found")

# 5. Replace refreshListings
old5 = (
    "async function refreshListings(){\n"
    "  try{\n"
    '    const {data,error}=await sb.from("listings").select("*").order("created_at",{ascending:false});\n'
    "    if(error)throw error;\n"
    "    listings=data||[];\n"
    "    if(!listings.length){emptyState();return;}\n"
    "    render(listings);\n"
    '    if(typeof loadRatings==="function")loadRatings();\n'
    "  }catch(e){console.error(\"refreshListings\",e);emptyState();}\n"
    "}"
)
new5 = (
    "async function refreshListings(){\n"
    "  try{\n"
    "    const res=await pbGet('listings',{sort:'-created',perPage:200});\n"
    "    listings=res.items||[];\n"
    "    if(!listings.length){emptyState();return;}\n"
    "    render(listings);\n"
    "    if(typeof loadRatings==='function')loadRatings();\n"
    "  }catch(e){console.error('refreshListings',e);emptyState();}\n"
    "}"
)
if old5 in c: c=c.replace(old5,new5,1); print("5. refreshListings replaced")
else: print("5. WARN: refreshListings not found")

# 6. Replace doSignOut
old6 = "async function doSignOut(){await sb.auth.signOut();user=null;location.reload();}"
new6 = "function doSignOut(){localStorage.removeItem('pb-token');localStorage.removeItem('pb-user');user=null;location.reload();}"
if old6 in c: c=c.replace(old6,new6,1); print("6. doSignOut replaced")
else: print("6. WARN: doSignOut not found")

# 7. Listings in filter/search (two variants)
c=c.replace(
    "    const {data,error}=await sb.from('listings').select('*').order('created_at',{ascending:false});\n    if(error)throw error;\n    listings=data||[];",
    "    const _res=await pbGet('listings',{sort:'-created',perPage:200});\n    listings=_res.items||[];"
)
c=c.replace(
    "    const {data:rows,error}=await sb.from('listings').select('*').order('created_at',{ascending:false});\n    if(!rows)return;\n    listings=rows;",
    "    const _r=await pbGet('listings',{sort:'-created',perPage:200});\n    if(!_r)return;\n    listings=_r.items||[];"
)
print("7. Listing filter calls replaced")

# 8. Payment dupe check
old8 = "  const {data:existingRows}=await sb.from('payments').select('*').eq('mpesa_ref',ref);\n  const existing=existingRows&&existingRows.length?existingRows[0]:null;"
new8 = "  const _payChk=await pbGet('payments',{filter:'mpesa_ref=\"'+ref+'\"'}).catch(function(){return {items:[]};});\n  const existing=_payChk.items&&_payChk.items.length?_payChk.items[0]:null;"
if old8 in c: c=c.replace(old8,new8,1); print("8. Payment dupe check replaced")
else: print("8. WARN: payment dupe check not found")

# 9. Payment insert
old9 = (
    "  const fee=cur.contact_fee||250;\n"
    "  const {data:pmnt,error:payErr}=await sb.from('payments').insert({user_id:user.id,listing_id:cur.id,phone:user.phone||\"\",amount:fee,status:\"pending\",mpesa_ref:ref,checkin_date:checkin||null,checkout_date:checkout||null}).select().single();\n"
    "  if(payErr){toast('Could not submit payment — try again','err');btn.disabled=false;btn.textContent=\"I've Paid — Submit Code\";sec('pay');return;}"
)
new9 = (
    "  const fee=cur.contact_fee||250;\n"
    "  let pmnt;\n"
    "  try{\n"
    "    pmnt=await pbPost('payments',{user_id:user.id,listing_id:cur.id,phone:user.phone||'',amount:fee,status:'pending',mpesa_ref:ref});\n"
    "  }catch(e){toast('Could not submit payment — try again','err');btn.disabled=false;btn.textContent=\"I've Paid — Submit Code\";sec('pay');return;}"
)
if old9 in c: c=c.replace(old9,new9,1); print("9. Payment insert replaced")
else: print("9. WARN: payment insert not found")

# 10. Profile+listing fetch in notify
old10 = (
    "  try{\n"
    "    const [{data:prof},{data:lst}]=await Promise.all([\n"
    "      sb.from('profiles').select('*').eq('id',user.id).single(),\n"
    "      sb.from('listings').select('*').eq('id',cur.id).single()\n"
    "    ]);"
)
new10 = (
    "  try{\n"
    "    const [prof,lst]=await Promise.all([\n"
    "      pbFetch('/api/collections/users/records/'+user.id).catch(function(){return {};}),\n"
    "      pbFetch('/api/collections/listings/records/'+cur.id).catch(function(){return {};})\n"
    "    ]);"
)
if old10 in c: c=c.replace(old10,new10,1); print("10. Notify fetch replaced")
else: print("10. WARN: notify fetch not found")

# 11. Payment polling
c=c.replace(
    "    const {data}=await sb.from('payments').select('*').eq('id',pmnt.id).single();\n    if(data?.status==='confirmed')",
    "    const _pd=await pbFetch('/api/collections/payments/records/'+pmnt.id).catch(function(){return {};});\n    if(_pd&&_pd.status==='confirmed')"
)
c=c.replace("    else if(data?.status==='denied')","    else if(_pd&&_pd.status==='denied')")
print("11. Payment polling replaced")

# 12. showContact
old12 = "  const {data:cRows}=await sb.from('caretaker_contacts').select('*').eq('listing_id',lid);\n  const data=cRows&&cRows.length?cRows[0]:null;"
new12 = "  const _cr=await pbGet('caretaker_contacts',{filter:'listing_id=\"'+lid+'\"'}).catch(function(){return {items:[]};});\n  const data=_cr.items&&_cr.items.length?_cr.items[0]:null;"
if old12 in c: c=c.replace(old12,new12,1); print("12. showContact replaced")
else: print("12. WARN: showContact not found")

# 13. loadRatings
old13 = (
    "async function loadRatings(){\n"
    "  const {data}=await sb.from('reviews').select('listing_id,rating');\n"
    "  if(!data)return;\n"
    "  ratings={};\n"
    "  data.forEach(r=>{if(!ratings[r.listing_id])ratings[r.listing_id]={sum:0,count:0};ratings[r.listing_id].sum+=r.rating;ratings[r.listing_id].count++;});\n"
    "  Object.keys(ratings).forEach(id=>{ratings[id].avg=ratings[id].sum/ratings[id].count;});\n"
    "}"
)
new13 = (
    "async function loadRatings(){\n"
    "  try{\n"
    "    const res=await pbGet('reviews',{fields:'listing_id,rating',perPage:500});\n"
    "    if(!res.items)return;\n"
    "    ratings={};\n"
    "    res.items.forEach(function(r){if(!ratings[r.listing_id])ratings[r.listing_id]={sum:0,count:0};ratings[r.listing_id].sum+=r.rating;ratings[r.listing_id].count++;});\n"
    "    Object.keys(ratings).forEach(function(id){ratings[id].avg=ratings[id].sum/ratings[id].count;});\n"
    "  }catch(e){/* reviews collection may not exist yet */}\n"
    "}"
)
if old13 in c: c=c.replace(old13,new13,1); print("13. loadRatings replaced")
else: print("13. WARN: loadRatings not found")

# 14. loadReviews fetch
old14 = "  const {data}=await sb.from('reviews').select('*, profiles(full_name)').eq('listing_id',lid).order('created_at',{ascending:false});"
new14 = "  let data=null;\n  try{const _rv=await pbGet('reviews',{filter:'listing_id=\"'+lid+'\"',sort:'-created',perPage:50});data=_rv.items;}catch(e){data=[];}"
if old14 in c: c=c.replace(old14,new14,1); print("14a. loadReviews fetch replaced")
else: print("14a. WARN: loadReviews not found")
c=c.replace("r.profiles?.full_name","r.reviewer_name")
print("14b. profiles.full_name replaced")

# 15. submitReview
old15 = "  const {error}=await sb.from('reviews').insert({listing_id:cur.id,user_id:user.id,rating:pickedStar,comment});\n  if(error){toast('Review failed: '+error.message,'err');return;}"
new15 = "  try{await pbPost('reviews',{listing_id:cur.id,user_id:user.id,reviewer_name:user.full_name||user.email||'Student',rating:pickedStar,comment:comment});}catch(e){toast('Review failed: '+e.message,'err');return;}"
if old15 in c: c=c.replace(old15,new15,1); print("15. submitReview replaced")
else: print("15. WARN: submitReview not found")

# 16. Stub promo codes
c=c.replace(
    "    const {data:promoRows}=await sb.from('promo_codes').select('*').eq('owner_user_id',user.id).is('used_by_user_id',null).limit(1);",
    "    const promoRows=[];"
)
c=c.replace(
    "    const {data:existRows}=await sb.from('promo_codes').select('*').eq('owner_user_id',user.id).is('used_by_user_id',null).limit(1);",
    "    const existRows=[];"
)
c=c.replace(
    "      const {error:promoErr}=await sb.from('promo_codes').insert({owner_user_id:user.id,code,used_by_user_id:null});\n      if(promoErr){console.warn('Promo insert blocked (expected until INSERT policy exists):',promoErr.message);code=null;}",
    "      code=null;"
)
c=c.replace(
    "      const {error:promoErr2}=await sb.from('promo_codes').insert({owner_user_id:user.id,code,used_by_user_id:null});\n      if(promoErr2){console.warn('Promo insert blocked (expected until INSERT policy exists):',promoErr2.message);code=null;}",
    "      code=null;"
)
print("16. Promo codes stubbed")

# 17. Trust stats
old17 = (
    "    const [pr,lr]=await Promise.all([\n"
    "      sb.from('payments').select('*',{count:'exact',head:true}).eq('status','confirmed'),\n"
    "      sb.from('listings').select('*',{count:'exact',head:true})\n"
    "    ]);\n"
    "    const students=pr.count;\n"
    "    const listings=lr.count;"
)
new17 = (
    "    const [pr,lr]=await Promise.all([\n"
    "      pbGet('payments',{filter:'status=\"confirmed\"',perPage:1}),\n"
    "      pbGet('listings',{perPage:1})\n"
    "    ]);\n"
    "    const students=pr.totalItems;\n"
    "    const listings=lr.totalItems;"
)
if old17 in c: c=c.replace(old17,new17,1); print("17. Trust stats replaced")
else: print("17. WARN: trust stats not found")

with open('index.html','w') as f: f.write(c)

remaining = c.count('sb.from(') + c.count('sb.auth.') + c.count('supabase.createClient')
print(f"\nRemaining Supabase refs: {remaining}")
if remaining > 0:
    for i,line in enumerate(c.split('\n'),1):
        if 'sb.from(' in line or 'sb.auth.' in line:
            print(f"  Line {i}: {line.strip()[:80]}")
print("Done.")
