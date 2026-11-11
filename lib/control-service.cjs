const crypto=require('node:crypto');
const State=require('../js/event-state');
const fail=(status,message)=>{throw Object.assign(new Error(message),{status})};
const {validatePatch,validateBackup}=require('./control-validation.cjs');
function createControlHandler(store, options={}) {
  const user=options.user||process.env.ADMIN_USER||'es5@calabria.com.br';
  const password=options.password||process.env.ADMIN_PASSWORD||'limonada2026';
  const secure=options.secure!==false;
  const cookie=(value,age)=>`lq_control=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${secure?'; Secure':''}`;
  const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
  const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}});
  async function auth(req) {
    const token=req.headers.get('cookie')?.match(/(?:^|;\s*)lq_control=([a-f0-9]{64})(?:;|$)/)?.[1];
    if(!token)return false;
    const session=await store.get('session-'+hash(token),{type:'json'});
    return session&&session.expires>Date.now();
  }
  async function transaction(id,change) {
    for(let attempt=0;attempt<12;attempt++) {
      const entry=await store.getWithMetadata('event',{type:'json',consistency:'strong'});
      const record=entry?.data||{db:State.fresh(),revision:0,applied:[]};
      if(id&&record.applied.includes(id))return record;
      const db=change(State.normalize(record.db));
      const next={...record,db,revision:record.revision+1,applied:[...record.applied,...(id?[id]:[])].slice(-1000)};
      const result=await store.setJSON('event',next,entry?{onlyIfMatch:entry.etag}:{onlyIfNew:true});
      if(result.modified)return next;
    }
    fail(409,'O evento está recebendo outras alterações. Tente novamente.');
  }
  return async function(req) {
    try {
      const url=new URL(req.url),action=url.pathname.split('/').filter(Boolean).pop();
      if(req.method==='OPTIONS')return new Response(null,{status:405});
      if(!['GET','POST'].includes(req.method))fail(405,'Método indisponível.');
      if(req.method==='POST') {
        const origin=req.headers.get('origin');
        if(origin&&origin!==url.origin)fail(403,'Origem não autorizada.');
      }
      let body={};
      if(req.method==='POST') {
        const text=await req.text(); if(text.length>2*1024*1024)fail(413,'Backup ou alteração muito grande.');
        try{body=JSON.parse(text)}catch{fail(400,'JSON inválido.')}
        if(!body||typeof body!=='object'||Array.isArray(body))fail(400,'Corpo inválido.');
      }
      if(action==='login'&&req.method==='POST') {
        const address=options.localAddress||req.headers.get('x-nf-client-connection-ip')||'local';
        const key='attempt-'+hash(address),attempt=await store.get(key,{type:'json'});
        if(attempt&&attempt.until>Date.now()&&attempt.count>=10)fail(429,'Muitas tentativas. Aguarde 15 minutos.');
        if(!crypto.timingSafeEqual(crypto.createHash('sha256').update(String(body.user)).digest(),crypto.createHash('sha256').update(user).digest())||
           !crypto.timingSafeEqual(crypto.createHash('sha256').update(String(body.password)).digest(),crypto.createHash('sha256').update(password).digest())) {
          await store.setJSON(key,{count:attempt?.until>Date.now()?attempt.count+1:1,until:Date.now()+900000});
          fail(401,'Credenciais incorretas.');
        }
        const token=crypto.randomBytes(32).toString('hex');
        await store.setJSON('session-'+hash(token),{expires:Date.now()+8*3600000});
        return json({authenticated:true},200,{'Set-Cookie':cookie(token,8*3600)});
      }
      if(action==='logout'&&req.method==='POST') {
        const token=req.headers.get('cookie')?.match(/lq_control=([a-f0-9]{64})/)?.[1];
        if(token)await store.delete('session-'+hash(token));
        return json({authenticated:false},200,{'Set-Cookie':cookie('',0)});
      }
      if(action==='session'&&req.method==='GET')return json({authenticated:!!await auth(req)});
      if(action==='storage'&&req.method==='GET') {
        const record=await store.get('event',{type:'json',consistency:'strong'});
        return json({provider:options.storageProvider||'local',initialized:!!record,revision:record?.revision||0,migration:record?.migration||null});
      }
      if(action==='state'&&req.method==='GET') {
        const record=await store.get('event',{type:'json',consistency:'strong'});
        const revision=record?.revision||0;
        if(url.searchParams.get('since')===String(revision))return json({revision});
        return json({db:record?State.normalize(record.db):State.fresh(),revision,...(url.searchParams.has('operation')?{acknowledged:!!record?.applied?.includes(url.searchParams.get('operation'))}:{})});
      }
      if(action==='changes'&&req.method==='POST') {
        const admin=!!await auth(req);
        if(typeof body.id!=='string'||!body.id.trim()||body.id.length>100)fail(400,'Identificador inválido.');
        const result=await transaction(body.id,db=>{validatePatch(db,body.patch,admin);return State.merge(db,body.patch)});
        return json({db:result.db,revision:result.revision});
      }
      if(action==='replace'&&req.method==='POST') {
        if(!await auth(req))fail(401,'Faça login para importar ou apagar dados.');
        if(typeof body.id!=='string'||!body.id.trim()||body.id.length>100)fail(400,'Identificador inválido.');
        const db=validateBackup(body.db);
        // Importação é explícita e administrativa; dados históricos são preservados.
        const result=await transaction(body.id,()=>State.normalize(db));
        return json({db:result.db,revision:result.revision});
      }
      fail(404,'Controle indisponível.');
    }catch(error){return json({error:error.status?error.message:'Não foi possível acessar os controles do evento.'},error.status||503)}
  };
}
module.exports={createControlHandler,validatePatch};
