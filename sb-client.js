function createClient(url,key){
  var h={'apikey':key,'Authorization':'Bearer '+key,'Content-Type':'application/json'};
  var _token=null;
  function getToken(){return _token||localStorage.getItem('sb-token')||key;}
  var auth={
    getUser:function(){
      var t=_token||localStorage.getItem('sb-token');
      if(!t)return Promise.resolve({data:{user:null}});
      return fetch(url+'/auth/v1/user',{headers:{'apikey':key,'Authorization':'Bearer '+t}})
        .then(function(r){return r.json().then(function(d){return{data:{user:r.ok?d:null}};});})
        .catch(function(){return{data:{user:null}};});
    },
    signInWithPassword:function(opts){
      return fetch(url+'/auth/v1/token?grant_type=password',{method:'POST',headers:h,body:JSON.stringify({email:opts.email,password:opts.password})})
        .then(function(r){return r.json().then(function(d){
          if(d.access_token){_token=d.access_token;localStorage.setItem('sb-token',d.access_token);}
          return r.ok?{data:{user:d.user,session:d},error:null}:{data:{user:null},error:d};
        });});
    },
    signUp:function(opts){
      var body={email:opts.email,password:opts.password,data:{full_name:(opts.options&&opts.options.data&&opts.options.data.full_name)||''}};
      return fetch(url+'/auth/v1/signup',{method:'POST',headers:h,body:JSON.stringify(body)})
        .then(function(r){return r.json().then(function(d){return r.ok?{data:{user:d.user},error:null}:{data:{},error:d};});});
    },
    signOut:function(){
      _token=null;localStorage.removeItem('sb-token');localStorage.removeItem('sb-refresh');
      return Promise.resolve({error:null});
    },
    onAuthStateChange:function(){return{data:{subscription:{unsubscribe:function(){}}}};},
    updateUser:function(attrs){
      var t=_token||localStorage.getItem('sb-token');
      return fetch(url+'/auth/v1/user',{method:'PUT',headers:{'apikey':key,'Authorization':'Bearer '+t,'Content-Type':'application/json'},body:JSON.stringify(attrs)})
        .then(function(r){return r.json().then(function(d){return r.ok?{data:{user:d},error:null}:{data:null,error:d};});});
    }
  };
  var storage={
    from:function(bucket){
      return{
        upload:function(path,file){
          var t=_token||localStorage.getItem('sb-token');
          return fetch(url+'/storage/v1/object/'+bucket+'/'+path,{method:'POST',headers:{'apikey':key,'Authorization':'Bearer '+(t||key)},body:file})
            .then(function(r){return r.ok?{data:{path:path},error:null}:r.json().then(function(e){return{data:null,error:e};});});
        },
        getPublicUrl:function(path){return{data:{publicUrl:url+'/storage/v1/object/public/'+bucket+'/'+path}};}
      };
    }
  };
  function from(table){
    var _filters=[];
    var _select='*';
    var _order=null;
    var _single=false;
    var _maybeSingle=false;
    var _limit=null;
    var q={
      select:function(cols){_select=cols||'*';return q;},
      eq:function(col,val){_filters.push(col+'=eq.'+encodeURIComponent(val));return q;},
      neq:function(col,val){_filters.push(col+'=neq.'+encodeURIComponent(val));return q;},
      order:function(col,opts){_order=col+'.'+(opts&&opts.ascending===false?'desc':'asc');return q;},
      limit:function(n){_limit=n;return q;},
      single:function(){_single=true;return q;},
      maybeSingle:function(){_maybeSingle=true;return q;},
      insert:function(data){
        var t=getToken();
        var ih={'apikey':key,'Authorization':'Bearer '+t,'Content-Type':'application/json','Prefer':'return=representation'};
        return fetch(url+'/rest/v1/'+table,{method:'POST',headers:ih,body:JSON.stringify(data)})
          .then(function(r){return r.json().then(function(d){return r.ok?{data:Array.isArray(d)?d:[d],error:null}:{data:null,error:d};});});
      },
      update:function(data){
        return{
          eq:function(col,val){
            var t=getToken();
            var uh={'apikey':key,'Authorization':'Bearer '+t,'Content-Type':'application/json','Prefer':'return=representation'};
            var uu=url+'/rest/v1/'+table+'?'+col+'=eq.'+encodeURIComponent(val);
            return fetch(uu,{method:'PATCH',headers:uh,body:JSON.stringify(data)})
              .then(function(r){return r.json().then(function(d){return{data:d,error:null};}).catch(function(){return{data:null,error:null};});});
          }
        };
      },
      delete:function(){
        return{
          eq:function(col,val){
            var t=getToken();
            var dh={'apikey':key,'Authorization':'Bearer '+t};
            var du=url+'/rest/v1/'+table+'?'+col+'=eq.'+encodeURIComponent(val);
            return fetch(du,{method:'DELETE',headers:dh})
              .then(function(r){return r.ok?{data:null,error:null}:r.json().then(function(e){return{data:null,error:e};});});
          }
        };
      },
      then:function(resolve,reject){
        var t=getToken();
        var fh={'apikey':key,'Authorization':'Bearer '+t};
        var fu=url+'/rest/v1/'+table+'?select='+encodeURIComponent(_select);
        _filters.forEach(function(f){fu+='&'+f;});
        if(_order)fu+='&order='+_order;
        if(_limit)fu+='&limit='+_limit;
        if(_single)fh['Accept']='application/vnd.pgrst.object+json';
        return fetch(fu,{headers:fh}).then(function(r){return r.json();}).then(function(d){
          if(d&&d.code&&d.message){resolve({data:null,error:d});}
          else if(_single||_maybeSingle){resolve({data:d,error:null});}
          else{resolve({data:Array.isArray(d)?d:[],error:null});}
        }).catch(function(e){resolve({data:null,error:e});});
      }
    };
    return q;
  }
  return{auth:auth,storage:storage,from:function(t){return from(t);}};
}
