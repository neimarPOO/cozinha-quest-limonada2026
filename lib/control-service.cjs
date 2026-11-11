const crypto=require('node:crypto');
const State=require('../js/event-state');
const Settings=require('../js/game-settings');
const fail=(status,message)=>{throw Object.assign(new Error(message),{status})};
const integer=(n,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
function validatePatch(db,patch,admin) {
  if(!patch||typeof patch!=='object'||Array.isArray(patch)) fail(400,'Alteração inválida.');
  if(Object.keys(patch).some(k=>!['settings','day','prizes','sessions','games','audit'].includes(k))) fail(400,'Campo inválido.');
  if(!admin&&['settings','day','prizes','sessions'].some(k=>k in patch)) fail(401,'Faça login para alterar os controles.');
  if(patch.settings) {
    const p=patch.settings, allowed=['seconds','dailyCap','wheelScore','wheelMode'];
    if(Object.keys(p).some(k=>!allowed.includes(k)) ||
      ('seconds'in p&&!Settings.isValidDuration(p.seconds)) ||
      ('dailyCap'in p&&!integer(p.dailyCap,0,999)) ||
      ('wheelScore'in p&&!integer(p.wheelScore,0,1000)) ||
      ('wheelMode'in p&&!['score','completion'].includes(p.wheelMode))) fail(400,'Configurações inválidas.');
  }
  if('day'in patch&&!integer(patch.day,1,21)) fail(400,'Dia inválido.');
  for(const p of patch.prizes||[]) {
    const old=db.prizes.find(x=>x.id===p.id);
    if(!old||Object.keys(p).some(k=>!['id','qtyDelta','perDay','weight'].includes(k))||
      ('qtyDelta'in p&&(!integer(p.qtyDelta,-100000,100000)||old.qty+p.qtyDelta<0))||
      ('perDay'in p&&!integer(p.perDay,0,999))||('weight'in p&&!integer(p.weight,1,1000))) fail(400,'Estoque ou limite inválido.');
  }
  for(const edit of patch.sessions||[]) {
    const session=edit.create||{...db.sessions.find(x=>x.id===edit.id),...edit.set};
    if(edit.remove) {if(db.games.some(g=>g.sessionId===edit.id&&g.status!=='cancelado'))fail(409,'Sessão possui reservas.');continue;}
    if(typeof session.id!=='string'||!integer(session.day,1,21)||!integer(session.capacity,1,999)||!integer(session.duration,10,1440)||!/^\d{2}:\d{2}$/.test(session.time)) fail(400,'Sessão inválida.');
  }
  if(!admin&&(patch.games||[]).length>1)fail(400,'Envie uma partida por alteração.');
  const allowedFields=['id','day','time','recipe','score','seconds','completed','prize','sessionId','status','recipeDetails','cookieDetails','missSector'];
  for(const edit of patch.games||[]) {
    const old=db.games.find(g=>g.id===edit.id);
    if(edit.remove) {if(!admin)fail(401,'Login necessário.');continue;}
    if(edit.create&&old) fail(409,'Partida já registrada.');
    const fields=edit.create||edit.set;
    if(!fields||Object.keys(fields).some(k=>!allowedFields.includes(k))) fail(400,'Partida inválida.');
    const game=edit.create||{...old,...edit.set};
    if(!integer(game.id,1)||!integer(game.day,1,21)||typeof game.recipe!=='string'||game.recipe.length>120||
      !Number.isFinite(game.score)||game.score<0||game.score>10000||typeof game.completed!=='boolean'||
      !['aguardando_roleta','sem_premio','reservado','digital','entregue','cancelado'].includes(game.status)) fail(400,'Partida inválida.');
    if(!admin&&old&&Object.keys(fields).some(k=>!['prize','sessionId','status','missSector'].includes(k))) fail(403,'Uma partida concluída não pode ser alterada.');
    if(!admin&&['entregue','cancelado'].includes(game.status))fail(401,'Login necessário para entrega ou cancelamento.');
    if(!admin&&old&&old.status!=='aguardando_roleta')fail(409,'Esta partida já tem um resultado.');
    if(game.status==='aguardando_roleta'&&!Settings.wheelEligible(db.settings,game))fail(409,'A partida não atende à regra da roleta.');
    if(game.status==='reservado'&&old?.status!=='reservado') {
      if(!Settings.wheelEligible(db.settings,game))fail(409,'A partida não atende à regra da roleta.');
      const p=db.prizes.find(x=>x.id===game.prize), used=db.games.filter(g=>g.prize&&g.status!=='cancelado');
      if(!p||used.filter(g=>g.prize===p.id).length>=p.qty||used.filter(g=>g.day===game.day&&g.prize===p.id).length>=p.perDay||used.filter(g=>g.day===game.day).length>=db.settings.dailyCap)fail(409,'O prêmio atingiu o limite. Gire novamente com o estoque atualizado.');
    }
  }
  for(const item of patch.audit||[])if(typeof item.type!=='string'||typeof item.detail!=='string'||item.detail.length>5000) fail(400,'Registro inválido.');
}
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
        return json({db:record?State.normalize(record.db):State.fresh(),revision});
      }
      if(action==='changes'&&req.method==='POST') {
        const admin=!!await auth(req);
        if(typeof body.id!=='string'||body.id.length>100)fail(400,'Identificador inválido.');
        const result=await transaction(body.id,db=>{validatePatch(db,body.patch,admin);return State.merge(db,body.patch)});
        return json({db:result.db,revision:result.revision});
      }
      if(action==='replace'&&req.method==='POST') {
        if(!await auth(req))fail(401,'Faça login para importar ou apagar dados.');
        const db=body.db;
        if(!db||!Array.isArray(db.games)||!Array.isArray(db.prizes)||!Array.isArray(db.sessions)||!Array.isArray(db.audit)||!db.settings)fail(400,'Backup inválido.');
        // Importação é explícita e administrativa; dados históricos são preservados.
        const result=await transaction(body.id,()=>State.normalize(db));
        return json({db:result.db,revision:result.revision});
      }
      fail(404,'Controle indisponível.');
    }catch(error){return json({error:error.status?error.message:'Não foi possível acessar os controles do evento.'},error.status||503)}
  };
}
module.exports={createControlHandler,validatePatch};
