/* Sincronização compartilhada, com confirmação e reenvio idempotente. */
window.ControlSync=(()=>{
 const base='/api/control/',journalKey='lq_unsent_changes';
 let snapshot,confirmed,revision=-1,ready=false,flight=null,recovering=false,pending=[],chain=Promise.resolve(),failed=[];
 const status=text=>document.querySelectorAll('.sync-status').forEach(el=>el.textContent=text);
 const storeLocal=()=>{try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}};
 const uid=()=>crypto.randomUUID?.()||Date.now().toString(36)+'-'+Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-');
 const recovery=document.createElement('aside');recovery.className='control-recovery';recovery.hidden=true;recovery.setAttribute('role','status');
 const message=document.createElement('p');message.textContent='Há um envio não confirmado. Confira ou tente sincronizar antes de repetir a ação.';
 const retryButton=document.createElement('button');retryButton.className='btn';retryButton.textContent='Tentar sincronizar';retryButton.type='button';
 const archiveButton=document.createElement('button');archiveButton.className='btn';archiveButton.textContent='Arquivar após conferência';archiveButton.type='button';
 const exportButton=document.createElement('button');exportButton.className='btn';exportButton.textContent='Baixar pendências';exportButton.type='button';
 recovery.append(message,retryButton,exportButton,archiveButton);document.querySelector('.shell').prepend(recovery);
 function journal(){try{localStorage.setItem(journalKey,JSON.stringify(failed))}catch{}recovery.hidden=!failed.length;}
 exportButton.onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(failed,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='cozinha-envios-pendentes.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 archiveButton.onclick=async()=>{
  if(!isAdminAuthenticated()){openAdminLogin('history');return}
  if(!confirm('Confira o histórico e baixe as pendências antes de continuar. Arquivar libera novos envios e não executa as ações pendentes. Deseja arquivar?'))return;
  try{const session=await api('session');if(!session.authenticated)throw new Error('Faça login novamente para arquivar.');localStorage.setItem('lq_archived_changes_'+Date.now(),JSON.stringify(failed));failed=[];journal();await refresh()}catch(error){alert(error.message)}
 };
 async function api(action,body){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{
   const response=await fetch(base+action,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:controller.signal});
   let data;try{data=await response.json()}catch{throw new Error('O serviço de controle não está disponível nesta publicação.')}
   if(!response.ok)throw Object.assign(new Error(data.error||'Falha na sincronização.'),{status:response.status});return data;
  }finally{clearTimeout(timer)}
 }
 function apply(record){
  if(!record.db||record.revision<revision)return;
  confirmed=EventState.clone(record.db);db=EventState.normalize(record.db);
  for(const item of pending)db=EventState.merge(db,item.patch);
  snapshot=EventState.clone(db);revision=record.revision;storeLocal();
  if(!document.activeElement?.matches('input,select,textarea')&&typeof renderAll==='function')renderAll();
  document.dispatchEvent(new Event('control-state'));
 }
 async function refresh(){
  await chain;
  if(flight)return flight;
  flight=(async()=>{try{
    const result=await api('state?since='+revision);if(result.revision!==revision)apply(result);
    ready=true;status(failed.length?'Há envio pendente de confirmação.':'Evento conectado · dados compartilhados');return !failed.length;
   }catch{ready=false;status('Sem conexão com o evento · alterações não enviadas');return false}
   finally{flight=null}
  })();return flight;
 }
 async function send(job){
  try{return await api('changes',{id:job.id,patch:job.patch})}
  catch(error){
   if(error.status&&error.status<500)throw error;
   // A primeira resposta pode ter se perdido após a gravação. Mesmo ID, sem duplicar.
   try{return await api('changes',{id:job.id,patch:job.patch})}
   catch(second){
    try{const record=await api('state?operation='+encodeURIComponent(job.id));if(record.acknowledged)return record}catch{}
    throw second;
   }
  }
 }
 function submit(next){
  if(!snapshot)return Promise.resolve(false);
  if(failed.length){db=EventState.clone(snapshot);storeLocal();alert('Há envio não confirmado. Use “Tentar sincronizar” antes de repetir a ação.');return Promise.resolve(false)}
  const patch=EventState.diff(snapshot,next);snapshot=EventState.clone(next);
  if(!Object.keys(patch).length)return Promise.resolve(true);
  const job={id:uid(),patch,created:Date.now()};pending.push(job);status('Salvando no evento…');
  const work=chain.then(async()=>{
   try{
    if(failed.length)throw new Error('Um envio anterior aguarda confirmação.');
    const record=await send(job);pending=pending.filter(x=>x!==job);apply(record);ready=true;
    status(pending.length?'Salvando no evento…':'Evento conectado · alterações salvas');return true;
   }catch(error){
    pending=pending.filter(x=>x!==job);
    if(!error.status||error.status>=500){failed.push(job);journal()}
    if(error.status===401){sessionStorage.removeItem(ADMIN_AUTH_KEY);updateAdminUI();openAdminLogin('dashboard')}
    try{apply(await api('state'))}catch{ready=false;if(confirmed){db=EventState.clone(confirmed);for(const p of pending)db=EventState.merge(db,p.patch);snapshot=EventState.clone(db);storeLocal();}}
    status('Alteração não confirmada · '+error.message);
    alert(error.message+' '+(failed.length?'O envio foi preservado. Use “Tentar sincronizar”; não repita a ação.':'Confira os dados e tente novamente.'));return false;
   }
  });chain=work.catch(()=>{});return work;
 }
 async function retry(){
  if(recovering)return false;recovering=true;
  await chain;retryButton.disabled=true;
  try{
   for(const job of [...failed]){
    let record=await api('state?operation='+encodeURIComponent(job.id));
    if(!record.acknowledged){
     if(Date.now()-job.created>30*60*1000)throw new Error('Envio antigo: confira o histórico e o arquivo de pendências antes de uma recuperação manual.');
     record=await send(job);
    }
    failed=failed.filter(x=>x.id!==job.id);apply(record);journal();
   }
   ready=true;status('Evento conectado · envios confirmados');document.dispatchEvent(new Event('control-recovered'));return true;
  }catch(error){alert(error.message);return false}finally{recovering=false;retryButton.disabled=false}
 }
 retryButton.onclick=retry;
 async function replace(next){
  try{await chain;const record=await api('replace',{id:uid(),db:next});failed=[];journal();apply(record);status('Evento conectado · dados atualizados');return true}
  catch(error){alert(error.message);return false}
 }
 async function login(){
  const button=$('adminSubmitBtn'),error=$('adminLoginError');button.disabled=true;error.style.display='none';
  try{await api('login',{user:$('adminEmailInput').value.trim(),password:$('adminPasswordInput').value});sessionStorage.setItem(ADMIN_AUTH_KEY,'true');$('adminPasswordInput').value='';updateAdminUI();closeAdminLogin();await refresh();showTab(pendingAdminTab||'dashboard')}
  catch(e){error.textContent=e.message;error.style.display='block';$('adminPasswordInput').value=''}finally{button.disabled=false}
 }
 async function logout(){
  if(!confirm('Encerrar sessão de monitor?'))return;
  try{await api('logout',{})}catch{alert('Não foi possível encerrar a sessão no servidor. Tente novamente.');return}
  sessionStorage.removeItem(ADMIN_AUTH_KEY);updateAdminUI();if(window.ADMIN_ONLY)openAdminLogin('dashboard');else showTab('play');
 }
 async function start(){
  try{if(!localStorage.getItem('lq_before_cloud'))localStorage.setItem('lq_before_cloud',JSON.stringify(db));const saved=JSON.parse(localStorage.getItem(journalKey)||'[]');failed=Array.isArray(saved)?saved.filter(j=>j&&typeof j.id==='string'&&j.patch&&Number.isFinite(j.created)):[];}catch{}
  snapshot=EventState.clone(db);confirmed=EventState.clone(db);journal();
  $('btnAdminLogout').onclick=logout;$('adminLoginForm').onsubmit=e=>{e.preventDefault();login()};
  await refresh();
  try{const session=await api('session');sessionStorage.setItem(ADMIN_AUTH_KEY,String(session.authenticated))}catch{sessionStorage.removeItem(ADMIN_AUTH_KEY)}
  updateAdminUI();if(window.ADMIN_ONLY){if(isAdminAuthenticated()){closeAdminLogin();showTab('dashboard')}else openAdminLogin('dashboard')}
  setInterval(()=>{if(!document.hidden)refresh()},5000);addEventListener('focus',refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
 }
 document.addEventListener('DOMContentLoaded',start);
 return {refresh,submit,replace,retry,login,logout,get ready(){return ready}};
})();
