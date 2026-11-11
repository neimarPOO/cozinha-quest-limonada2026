const State=require('../js/event-state');
const Settings=require('../js/game-settings');
const fail=(status,message)=>{throw Object.assign(new Error(message),{status})};
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const integer=(n,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const states=['aguardando_roleta','sem_premio','reservado','digital','entregue','cancelado'];
const gameFields=['id','day','time','recipe','score','seconds','completed','prize','sessionId','status','recipeDetails','cookieDetails','missSector'];
function unique(items,key){const ids=new Set();for(const item of items){if(!object(item)||ids.has(item[key]))fail(400,'Registro duplicado ou inválido.');ids.add(item[key]);}}
function validGame(game){
 if(!object(game)||!integer(game.id,1)||!integer(game.day,1,21)||typeof game.recipe!=='string'||!game.recipe.length||game.recipe.length>120||!Number.isFinite(game.score)||game.score<0||game.score>10000||typeof game.completed!=='boolean'||!states.includes(game.status)||typeof game.time!=='string'||!Number.isFinite(Date.parse(game.time))||!Number.isFinite(game.seconds)||game.seconds<0)fail(400,'Partida inválida.');
 if(['reservado','entregue'].includes(game.status)&&!(typeof game.prize==='string'&&game.prize.length))fail(400,'Prêmio da partida inválido.');
 if(!['reservado','entregue','cancelado'].includes(game.status)&&game.prize!=null)fail(400,'Resultado incompatível com o prêmio.');
}
function validSession(session){if(!object(session)||typeof session.id!=='string'||!session.id.length||!integer(session.day,1,21)||!integer(session.capacity,1,999)||!integer(session.duration,10,1440)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(session.time))fail(400,'Sessão inválida.');}
function settingsPatch(p){
 if(!object(p)||Object.keys(p).some(k=>!['seconds','dailyCap','wheelScore','wheelMode'].includes(k))||('seconds'in p&&!Settings.isValidDuration(p.seconds))||('dailyCap'in p&&!integer(p.dailyCap,0,999))||('wheelScore'in p&&!integer(p.wheelScore,0,1000))||('wheelMode'in p&&!['score','completion'].includes(p.wheelMode)))fail(400,'Configurações inválidas.');
}
function editShape(edit){
 if(!object(edit)||Object.keys(edit).some(k=>!['id','create','set','remove'].includes(k))||['create','set','remove'].filter(k=>k in edit).length!==1)fail(400,'Alteração de registro inválida.');
 if('create'in edit&&(!object(edit.create)||edit.create.id!==edit.id))fail(400,'Identificador de registro incompatível.');
 if('set'in edit&&(!object(edit.set)||'id'in edit.set))fail(400,'Alteração de registro inválida.');
 if('remove'in edit&&edit.remove!==true)fail(400,'Exclusão inválida.');
}
function validatePatch(db,patch,admin){
 if(!object(patch)||Object.keys(patch).some(k=>!['settings','day','prizes','sessions','games','audit'].includes(k)))fail(400,'Alteração inválida.');
 if(!admin&&['settings','day','prizes','sessions'].some(k=>k in patch))fail(401,'Faça login para alterar os controles.');
 for(const key of ['prizes','sessions','games','audit'])if(key in patch&&!Array.isArray(patch[key]))fail(400,'Lista de alterações inválida.');
 if('settings'in patch)settingsPatch(patch.settings);
 if('day'in patch&&!integer(patch.day,1,21))fail(400,'Dia inválido.');
 unique(patch.prizes||[],'id');
 for(const p of patch.prizes||[]){
  const old=db.prizes.find(x=>x.id===p.id);
  if(!old||Object.keys(p).some(k=>!['id','qtyDelta','perDay','weight'].includes(k))||('qtyDelta'in p&&(!integer(p.qtyDelta,-100000,100000)||old.qty+p.qtyDelta<0))||('perDay'in p&&!integer(p.perDay,0,999))||('weight'in p&&!integer(p.weight,1,1000)))fail(400,'Estoque ou limite inválido.');
 }
 unique(patch.sessions||[],'id');
 let sessionState=db;
 for(const edit of patch.sessions||[]){
  editShape(edit);const old=sessionState.sessions.find(s=>s.id===edit.id);
  if(edit.create&&old)fail(409,'Sessão já cadastrada.');if(!edit.create&&!old)fail(409,'Sessão não encontrada.');
  if(edit.remove){if(db.games.some(g=>g.sessionId===edit.id&&g.status!=='cancelado'))fail(409,'Sessão possui reservas.');sessionState=State.merge(sessionState,{sessions:[edit]});continue;}
  const fields=edit.create||edit.set;if(Object.keys(fields).some(k=>!['id','day','time','duration','capacity'].includes(k)))fail(400,'Campo de sessão inválido.');
  const session=edit.create||{...old,...edit.set};validSession(session);
  if(sessionState.sessions.some(s=>s.id!==edit.id&&s.day===session.day&&s.time===session.time))fail(409,'Já existe uma sessão nesse dia e horário.');
  sessionState=State.merge(sessionState,{sessions:[edit]});
 }
 if(!admin&&(patch.games||[]).length>1)fail(400,'Envie uma partida por alteração.');
 unique(patch.games||[],'id');
 let current=db;
 for(const edit of patch.games||[]){
  editShape(edit);const old=current.games.find(g=>g.id===edit.id);
  if(edit.create&&old)fail(409,'Partida já registrada.');if(!edit.create&&!old)fail(409,'Partida não encontrada.');
  if(edit.remove){if(!admin)fail(401,'Login necessário.');current=State.merge(current,{games:[edit]});continue;}
  const fields=edit.create||edit.set;
  if(Object.keys(fields).some(k=>!gameFields.includes(k)))fail(400,'Partida inválida.');
  const game=edit.create||{...old,...fields};validGame(game);
  if(edit.create){
    if(!admin&&(!['aguardando_roleta','sem_premio'].includes(game.status)||game.prize!=null||game.sessionId!=null))fail(400,'Registre a tentativa antes de sortear um prêmio.');
  }else {
    if(Object.keys(fields).some(k=>!['prize','sessionId','status','missSector'].includes(k)))fail(403,'Uma partida concluída não pode ser alterada.');
    if(['entregue','cancelado'].includes(game.status)&&!admin)fail(401,'Login necessário para entrega ou cancelamento.');
    const next=old.status==='aguardando_roleta'?['reservado','digital','sem_premio']:old.status==='reservado'&&admin?['entregue','cancelado']:[];
    if(!next.includes(game.status))fail(409,'Esta partida já tem um resultado ou a transição é inválida.');
    if(old.status==='reservado'&&(game.prize!==old.prize||game.sessionId!==old.sessionId))fail(400,'Não altere o prêmio de uma reserva existente.');
  }
  if(['aguardando_roleta','reservado','digital'].includes(game.status)&&!Settings.wheelEligible(db.settings,game))fail(409,'A partida não atende à regra da roleta.');
  if(game.status==='reservado'){
    const p=current.prizes.find(x=>x.id===game.prize),used=current.games.filter(g=>g.prize&&g.status!=='cancelado');
    if(!p||used.filter(g=>g.prize===p.id).length>=p.qty||used.filter(g=>g.day===game.day&&g.prize===p.id).length>=p.perDay||used.filter(g=>g.day===game.day).length>=db.settings.dailyCap)fail(409,'O prêmio atingiu o limite. Gire novamente com o estoque atualizado.');
    if(p.id==='ticket'){
      const session=current.sessions.find(s=>s.id===game.sessionId&&s.day===game.day);
      if(!session||used.filter(g=>g.sessionId===session.id).length>=session.capacity)fail(409,'Sessão sem vagas.');
    }else if(game.sessionId!=null)fail(400,'Este prêmio não utiliza sessão.');
  }
  current=State.merge(current,{games:[edit]});
 }
 for(const item of patch.audit||[])if(!object(item)||typeof item.type!=='string'||item.type.length>100||typeof item.detail!=='string'||item.detail.length>5000||typeof item.time!=='string'||!Number.isFinite(Date.parse(item.time)))fail(400,'Registro inválido.');
}
function validateBackup(value){
 if(!object(value)||!object(value.settings)||!integer(value.day,1,21))fail(400,'Backup inválido.');
 for(const key of ['games','prizes','sessions'])if(!Array.isArray(value[key]))fail(400,'Backup inválido.');
 if(value.archivedPrizes!==undefined&&(!Array.isArray(value.archivedPrizes)||value.archivedPrizes.some(p=>!object(p)||typeof p.id!=='string'||typeof p.name!=='string')))fail(400,'Catálogo arquivado inválido.');
 if(value.audit!==undefined&&!Array.isArray(value.audit))fail(400,'Auditoria do backup inválida.');
 for(const key of ['games','prizes','sessions'])unique(value[key],'id');
 for(const p of value.prizes)if(typeof p.id!=='string'||!p.id.length||typeof p.name!=='string'||!p.name.length||!integer(p.qty)||!integer(p.perDay,0,999)||!Number.isFinite(p.weight)||p.weight<=0)fail(400,'Prêmio inválido no backup.');
 for(const item of value.audit||[])if(!object(item)||typeof item.type!=='string'||typeof item.detail!=='string'||typeof item.time!=='string'||!Number.isFinite(Date.parse(item.time)))fail(400,'Auditoria inválida no backup.');
 for(const game of value.games)validGame(game);
 for(const session of value.sessions)validSession(session);
 const result=State.normalize(State.clone(value));
 return result;
}
module.exports={validatePatch,validateBackup};
