const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const State=require('../js/event-state'),Rules=require('../js/wheel-rules'),Settings=require('../js/game-settings');
function fixture(){
 const nodes=new Map();
 function node(id){if(!nodes.has(id)){let html='';const el={value:'',options:[],disabled:false,hidden:true,dataset:{},attributes:{},style:{},focus(){this.focused=true},add(option){this.options.push(option)},setAttribute(k,v){this.attributes[k]=v},removeAttribute(k){delete this.attributes[k]}};
  Object.defineProperty(el,'innerHTML',{get:()=>html,set:value=>{html=value;if(id==='prizeSelect'){el.options=[...value.matchAll(/<option value="([^"]*)"/g)].map(m=>({value:m[1]}));el.value=el.options[0]?.value||''}}});nodes.set(id,el)}return nodes.get(id)}
 const context={db:State.fresh(),GameSettings:Settings,$:node,document:{querySelectorAll:()=>[]},buildRoletaSvg(){},Option:class{constructor(text,value){this.text=text;this.value=value}},isAdminAuthenticated:()=>context.auth!==false,openAdminLogin:tab=>context.loginRequested=tab,showTab:tab=>context.tab=tab,available:p=>Rules.available(context.db,p),dailyPhysical:()=>Rules.dailyPhysical(context.db),fmt:n=>String(n).padStart(2,'0'),audit:(type,detail)=>context.db.audit.push({type,detail,time:new Date().toISOString()}),save:async()=>{context.saves++;return true},ControlSync:{refresh:async()=>true},saves:0,confirm:()=>true};
 vm.runInNewContext(fs.readFileSync(require.resolve('../js/admin-controls'),'utf8'),context);context.renderPrizes();node('addStock').value='12';node('dayFilter').value='all';return{context,node,submit:()=>node('restockBtn').onclick()};
}
test('prize selection survives redraws and a restock confirms the selected zero-stock item',async()=>{
 const {context:c,node,submit}=fixture();node('prizeSelect').value='cha';c.renderPrizes();assert.equal(node('prizeSelect').value,'cha');
 c.ControlSync.refresh=async()=>{c.db=State.clone(c.db);c.renderAll();return true};await submit();
 assert.equal(c.db.prizes.find(p=>p.id==='cha').qty,12);assert.equal(c.db.prizes.find(p=>p.id==='pao-de-queijo').qty,0);assert.equal(node('prizeSelect').value,'cha');assert.equal(c.saves,1);assert.equal(node('stockSaveStatus').dataset.state,'success');assert.match(node('stockSaveStatus').textContent,/Chá/);assert.equal(node('restockBtn').disabled,false);
});
test('double clicks submit a single replenishment while synchronization is pending',async()=>{
 const {context:c,node,submit}=fixture();node('prizeSelect').value='cafe';let release;c.ControlSync.refresh=()=>new Promise(resolve=>release=resolve);
 const first=submit();await submit();assert.equal(node('restockBtn').disabled,true);release(true);await first;assert.equal(c.saves,1);assert.equal(c.db.prizes.find(p=>p.id==='cafe').qty,12);
});
test('offline, invalid quantities and missing authentication cannot pretend to register stock',async()=>{
 const f=fixture();f.context.ControlSync.refresh=async()=>false;await f.submit();assert.equal(f.context.saves,0);assert.equal(f.node('stockSaveStatus').dataset.state,'error');assert.ok(f.context.db.prizes.every(p=>p.qty===0));assert.equal(f.node('restockBtn').disabled,false);
 for(const value of ['', '-1','1.5','100001']){const v=fixture();v.node('addStock').value=value;await v.submit();assert.equal(v.context.saves,0);assert.equal(v.node('stockSaveStatus').dataset.state,'error')}
 const v=fixture();v.context.auth=false;await v.submit();assert.equal(v.context.loginRequested,'prizes');assert.equal(v.context.saves,0);
});
test('server rejection is not shown as success and zero daily cap is explained after a confirmed restock',async()=>{
 const f=fixture();f.context.save=async()=>{f.context.db=State.fresh();return false};await f.submit();assert.equal(f.node('stockSaveStatus').dataset.state,'error');assert.equal(f.node('addStock').value,'12');assert.ok(f.context.db.prizes.every(p=>p.qty===0));
 const v=fixture();v.context.db.settings.dailyCap=0;await v.submit();assert.equal(v.node('stockSaveStatus').dataset.state,'success');assert.match(v.node('stockSaveStatus').textContent,/Disponível hoje: 0/);assert.match(v.node('stockSaveStatus').textContent,/limite geral/);
});
test('roulette items render when authentication completes even without a new state revision',()=>{
 const nodes=new Map(),listeners=new Map();function node(id){if(!nodes.has(id))nodes.set(id,{value:'',style:{},innerHTML:'',addEventListener(){}});return nodes.get(id)}
 const db=State.fresh();db.prizes.find(p=>p.id==='cha').qty=9;
 const context={db,auth:false,WheelRules:Rules,GameSettings:Settings,WheelDesign:{svg:()=>'<svg/>'},isAdminAuthenticated:()=>context.auth,document:{getElementById:node,addEventListener(type,handler){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(handler)}}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../js/admin-wheel'),'utf8'),context);
 for(const fn of listeners.get('DOMContentLoaded'))fn();assert.equal(node('adminWheelItems').innerHTML,'');
 context.auth=true;for(const fn of listeners.get('control-auth')||[])fn();assert.match(node('adminWheelItems').innerHTML,/Chá/);assert.match(node('adminWheelItems').innerHTML,/Estoque total: 9/);
});
