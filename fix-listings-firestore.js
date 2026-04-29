const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// Fix markdown corruption first
h = h.replace(/\[([a-zA-Z0-9_.]+)\]\(http:\/\/[^)]+\)/g, '$1');

// Replace sb.from listings fetch with Firestore
const OLD1 = `  const {data,error}=await sb.from('listings').select('*').order('created_at',{ascending:false});
  if(error||!data){
    // Fallback to stale cache if Supabase is down
    const stale=localStorage.getItem(CACHE_KEY);
    if(stale){
      try{
        const {data:sData}=JSON.parse(stale);
        if(Array.isArray(sData)&&sData.length){
          listings=sData;
          renderFromCache(sData);
          showToast('Showing cached listings — reconnecting…','warn');
          return;
        }
      }catch(e){}
    }
    emptyState();return;
  }`;

const NEW1 = `  let data;
  try{
    const snap=await firebase.firestore().collection('listings').orderBy('created_at','desc').get();
    data=snap.docs.map(d=>({id:d.id,...d.data()}));
  }catch(e){
    // Fallback to stale cache if Firestore is down
    const stale=localStorage.getItem(CACHE_KEY);
    if(stale){
      try{
        const {data:sData}=JSON.parse(stale);
        if(Array.isArray(sData)&&sData.length){
          listings=sData;
          renderFromCache(sData);
          showToast('Showing cached listings — reconnecting…','warn');
          return;
        }
      }catch(e2){}
    }
    emptyState();return;
  }
  if(!data||!data.length){emptyState();return;}`;

// Replace background refresh
const OLD2 = `  try{
    const {data,error}=await sb.from('listings').select('*').order('created_at',{ascending:false});
    if(!error&&data&&data.length){
      listings=data;
      try{localStorage.setItem('nf-listings-cache',JSON.stringify({data,ts:Date.now()}));}catch(e){}
      // Only re-render if data changed
      const cached=JSON.parse(localStorage.getItem('nf-listings-cache')||'{}');
      if(data.length!==(cached.data||[]).length)renderFromCache(data);
    }
  }catch(e){}`;

const NEW2 = `  try{
    const snap=await firebase.firestore().collection('listings').orderBy('created_at','desc').get();
    const data=snap.docs.map(d=>({id:d.id,...d.data()}));
    if(data&&data.length){
      listings=data;
      try{localStorage.setItem('nf-listings-cache',JSON.stringify({data,ts:Date.now()}));}catch(e){}
      const cached=JSON.parse(localStorage.getItem('nf-listings-cache')||'{}');
      if(data.length!==(cached.data||[]).length)renderFromCache(data);
    }
  }catch(e){}`;

if(h.includes(OLD1)){
  h=h.replace(OLD1,NEW1);
  console.log('load() fixed');
}else{
  console.log('WARNING: load() pattern not found');
}

if(h.includes(OLD2)){
  h=h.replace(OLD2,NEW2);
  console.log('refreshListingsBackground() fixed');
}else{
  console.log('WARNING: refreshListingsBackground() pattern not found');
}

fs.writeFileSync('index.html',h);
console.log('done');
