/* Estado e sessão compartilhados pelo desktop e pelo painel móvel. */
'use strict';
const KEY='limonada-cozinha-quest-v2',ADMIN_AUTH_KEY='lq_admin_session';
const ADMIN_TABS=['dashboard','wheel','prizes','sessions','history','settings'];
const $=id=>document.getElementById(id),fmt=n=>String(n).padStart(2,'0');
let pendingAdminTab='dashboard';
function isAdminAuthenticated(){return sessionStorage.getItem(ADMIN_AUTH_KEY)==='true';}
function updateAdminUI(){const authed=isAdminAuthenticated();document.body.classList.toggle('is-admin',authed);document.querySelector('.admin-workspace')?.toggleAttribute('hidden',!authed);if(window.ADMIN_ONLY&&!authed)$('adminLoginModal').classList.remove('hidden');document.dispatchEvent(new Event('control-auth'));}
function openAdminLogin(tab){pendingAdminTab=tab||'dashboard';$('adminEmailInput').value='';$('adminPasswordInput').value='';$('adminLoginError').style.display='none';$('adminLoginModal').classList.remove('hidden');setTimeout(()=>$('adminEmailInput')?.focus({preventScroll:true}),120);}
function closeAdminLogin(){if(window.ADMIN_ONLY&&!isAdminAuthenticated())return;$('adminLoginModal').classList.add('hidden');$('adminLoginError').style.display='none';}
function handleAdminLogin(){return window.ControlSync?.login();}
function handleAdminLogout(){return window.ControlSync?.logout();}
function fresh(){return EventState.fresh();}
function load(){try{const value=JSON.parse(localStorage.getItem(KEY));return value?EventState.normalize(value):fresh();}catch{return fresh();}}
let db=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(db));}catch{}return window.ControlSync?ControlSync.submit(db):Promise.resolve(false);}
function audit(type,detail){db.audit.push({time:new Date().toISOString(),type,detail});}
function usedToday(id){return db.games.filter(g=>g.day===db.day&&g.prize===id&&g.status!=='cancelado').length;}
function dailyPhysical(){return WheelRules.dailyPhysical(db);}
function available(prize){return WheelRules.available(db,prize);}
function freeSessions(){return WheelRules.freeSessions(db);}
function availablePrizes(){return WheelRules.availablePrizes(db);}
