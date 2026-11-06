/* Sincroniza somente dados e operações; nunca carrega recursos do jogo no admin. */
window.ControlSync = (() => {
  const base='/api/control/';
  let snapshot,confirmed,revision=-1,ready=false,busy=false,pending=[],chain=Promise.resolve(),timer;
  const uid=()=>crypto.randomUUID();
  const status=text=>{
    document.querySelectorAll('.sync-status').forEach(el=>el.textContent=text);
  };
  const storeLocal=()=>{try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}};
  async function api(action,body) {
    const response=await fetch(base+action,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
    let data;try{data=await response.json()}catch{throw new Error('O serviço de controle não está disponível nesta publicação.')}
    if(!response.ok)throw Object.assign(new Error(data.error||'Falha na sincronização.'),{status:response.status});
    return data;
  }
  function apply(record) {
    if(!record.db)return;
    confirmed=EventState.clone(record.db);
    db=EventState.normalize(record.db);
    for(const item of pending)db=EventState.merge(db,item.patch);
    snapshot=EventState.clone(db);revision=record.revision;
    storeLocal();
    const editing=document.activeElement?.matches('input,select,textarea');
    if(!editing&&typeof renderAll==='function')renderAll();
    document.dispatchEvent(new Event('control-state'));
  }
  async function refresh() {
    if(pending.length||busy)return ready;
    busy=true;
    try {
      const result=await api('state?since='+revision);
      if(result.revision!==revision)apply(result);
      ready=true;status('Evento conectado · dados compartilhados');return true;
    }catch(error){status('Sem conexão com o evento · alterações não enviadas');return false}
    finally{busy=false}
  }
  function submit(next) {
    if(!snapshot)return Promise.resolve(false);
    const patch=EventState.diff(snapshot,next);snapshot=EventState.clone(next);
    if(!Object.keys(patch).length)return Promise.resolve(true);
    const job={id:uid(),patch};pending.push(job);status('Salvando no evento…');
    const work=chain.then(async()=>{
      try {
        const result=await api('changes',job);
        pending=pending.filter(x=>x!==job);apply(result);
        status(pending.length?'Salvando no evento…':'Evento conectado · alterações salvas');return true;
      }catch(error){
        // Não repete reservas automaticamente: o jogador pode conferir e tentar de novo.
        pending=pending.filter(x=>x!==job);
        status('Alteração não salva · '+error.message);
        if(error.status===401){sessionStorage.removeItem(ADMIN_AUTH_KEY);updateAdminUI();openAdminLogin('dashboard')}
        if(!pending.length){try{const latest=await api('state');apply(latest)}catch{
          try{const unsent=JSON.parse(localStorage.getItem('lq_unsent_changes')||'[]');unsent.push(job);localStorage.setItem('lq_unsent_changes',JSON.stringify(unsent));}catch{}
          if(confirmed){db=EventState.clone(confirmed);snapshot=EventState.clone(db);storeLocal();}
        }}
        alert(error.message+' A alteração não foi confirmada; confira os dados e tente novamente.');return false;
      }
    });
    chain=work.catch(()=>{});return work;
  }
  async function replace(next) {
    try{await chain;const result=await api('replace',{id:uid(),db:next});apply(result);status('Evento conectado · dados atualizados');return true}
    catch(error){alert(error.message);return false}
  }
  async function login() {
    const button=$('adminSubmitBtn');button.disabled=true;
    const error=$('adminLoginError');error.style.display='none';
    try {
      await api('login',{user:$('adminEmailInput').value.trim(),password:$('adminPasswordInput').value});
      sessionStorage.setItem(ADMIN_AUTH_KEY,'true');
      updateAdminUI();closeAdminLogin();await refresh();showTab(pendingAdminTab||'dashboard');
    }catch(e){error.textContent=e.message;error.style.display='block';$('adminPasswordInput').value=''}
    finally{button.disabled=false}
  }
  async function logout() {
    if(!confirm('Encerrar sessão de monitor?'))return;
    try{await api('logout',{})}catch{alert('Não foi possível encerrar a sessão no servidor. Tente novamente.');return}
    sessionStorage.removeItem(ADMIN_AUTH_KEY);updateAdminUI();
    if(window.ADMIN_ONLY)openAdminLogin('dashboard');else showTab('play');
  }
  async function start() {
    // Mantém um backup local anterior à primeira conexão; não o envia sem autorização.
    if(!localStorage.getItem('lq_before_cloud'))try{localStorage.setItem('lq_before_cloud',JSON.stringify(db))}catch{}
    snapshot=EventState.clone(db);confirmed=EventState.clone(db);
    await refresh();
    try{const session=await api('session');sessionStorage.setItem(ADMIN_AUTH_KEY,String(session.authenticated));}catch{sessionStorage.removeItem(ADMIN_AUTH_KEY)}
    updateAdminUI();
    if(window.ADMIN_ONLY){if(isAdminAuthenticated()){closeAdminLogin();showTab('dashboard')}else openAdminLogin('dashboard')}
    handleAdminLogin=login;handleAdminLogout=logout;
    $('btnAdminLogout').onclick=logout;
    // O estado da sessão é decidido no servidor, não por uma flag local.
    $('adminLoginForm').onsubmit=e=>{e.preventDefault();login()};
    timer=setInterval(()=>{if(!document.hidden)refresh()},5000);
    addEventListener('focus',refresh);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
  }
  document.addEventListener('DOMContentLoaded',start);
  return {refresh,submit,replace,get ready(){return ready}};
})();
