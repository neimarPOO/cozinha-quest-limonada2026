const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createControlHandler}=require('../lib/control-service.cjs');
const State=require('../js/event-state');
const Settings=require('../js/game-settings');
const clone=State.clone;
function memoryStore(){const map=new Map();return {
 async get(k){return clone(map.get(k)?.data||null)},async getWithMetadata(k){return clone(map.get(k)||null)},
 async setJSON(k,data,opts={}){await Promise.resolve();const old=map.get(k);if((opts.onlyIfNew&&old)||(opts.onlyIfMatch&&old?.etag!==opts.onlyIfMatch))return{modified:false};map.set(k,{data:clone(data),etag:crypto.randomUUID()});return{modified:true}},
 async delete(k){map.delete(k)},
}}
function client(handler){let cookie='';return async(action,body)=>{
 const res=await handler(new Request('https://example.test/api/control/'+action,{method:body?'POST':'GET',headers:{cookie,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined}));
 const set=res.headers.get('set-cookie');if(set)cookie=set.split(';')[0];return{status:res.status,data:await res.json(),cookie:set};
}}
async function fixture(){const store=memoryStore(),handler=createControlHandler(store,{user:'monitor@test.local',password:'test-password'}),admin=client(handler),game=client(handler);
 assert.equal((await admin('login',{user:'monitor@test.local',password:'test-password'})).status,200);return{store,handler,admin,game};}
const change=(patch,id=crypto.randomUUID())=>({id,patch});
const game=(id,score=800,completed=true)=>({id,day:1,time:new Date().toISOString(),recipe:'Brownie de chocolate',score,seconds:80,completed,prize:null,sessionId:null,status:'aguardando_roleta'});
test('wheel rules preserve zero score, migrate old settings and require full completion only in completion mode',()=>{
 assert.equal(Settings.normalizeSettings({wheelScore:650}).wheelMode,'score');
 assert.ok(Settings.wheelEligible({wheelScore:0},{score:0,completed:false}));
 assert.ok(!Settings.wheelEligible({wheelScore:650},{score:649,completed:true}));
 assert.ok(Settings.wheelEligible({wheelMode:'completion'},{score:0,completed:true}));
 assert.ok(!Settings.wheelEligible({wheelMode:'completion'},{score:1000,completed:false}));
});
test('shared control requires a server session, rejects forged local auth and expires logout',async()=>{
 const {handler,admin,game}=await fixture();
 assert.equal((await game('changes',change({settings:{wheelScore:0}}))).status,401);
 assert.equal((await game('replace',{id:crypto.randomUUID(),db:State.fresh()})).status,401);
 const forged=await handler(new Request('https://example.test/api/control/changes',{method:'POST',headers:{cookie:'lq_admin_session=true'},body:JSON.stringify(change({settings:{wheelScore:0}}))}));assert.equal(forged.status,401);
 assert.equal((await admin('changes',change({settings:{wheelMode:'completion',wheelScore:777}}))).status,200);
 assert.equal((await game('state')).data.db.settings.wheelMode,'completion');
 assert.equal((await admin('logout',{})).status,200);
 assert.equal((await admin('changes',change({day:2}))).status,401);
});
test('shared changes are atomic and idempotent: concurrent restocks and last-item reservation cannot lose stock or oversell',async()=>{
 const {admin,game:player,handler}=await fixture();
 const edits=await Promise.all(Array.from({length:6},()=>admin('changes',change({prizes:[{id:'cafe',qtyDelta:1}]}))));
 assert.ok(edits.every(x=>x.status===200));assert.equal((await player('state')).data.db.prizes.find(p=>p.id==='cafe').qty,6);
 const id=crypto.randomUUID();await admin('changes',change({prizes:[{id:'brownie',qtyDelta:1}]},id));await admin('changes',change({prizes:[{id:'brownie',qtyDelta:1}]},id));
 assert.equal((await player('state')).data.db.prizes.find(p=>p.id==='brownie').qty,1);
 for(const id of [1,2])assert.equal((await player('changes',change({games:[{id,create:game(id)}]}))).status,200);
 const players=[client(handler),client(handler)];
 const reservations=await Promise.all(players.map((p,i)=>p('changes',change({games:[{id:i+1,set:{prize:'brownie',status:'reservado'}}]}))));
 assert.deepEqual(reservations.map(x=>x.status).sort(),[200,409]);
 assert.equal((await player('state')).data.db.games.filter(g=>g.status==='reservado').length,1);
});
test('eligibility, limits, delivered history and cancellation are checked on server',async()=>{
 const {admin,game:player}=await fixture();
 await admin('changes',change({settings:{wheelMode:'completion'},prizes:[{id:'cha',qtyDelta:4,perDay:1}]}));
 assert.equal((await player('changes',change({games:[{id:1,create:game(1,1000,false)}]}))).status,409);
 for(const id of [1,2])assert.equal((await player('changes',change({games:[{id,create:game(id,0,true)}]}))).status,200);
 assert.equal((await player('changes',change({games:[{id:1,set:{status:'reservado',prize:'cha'}}]}))).status,200);
 assert.equal((await player('changes',change({games:[{id:2,set:{status:'reservado',prize:'cha'}}]}))).status,409);
 assert.equal((await player('changes',change({games:[{id:1,set:{status:'entregue'}}]}))).status,401);
 assert.equal((await admin('changes',change({games:[{id:1,set:{status:'cancelado'}}]}))).status,200);
 assert.equal((await player('changes',change({games:[{id:2,set:{status:'reservado',prize:'cha'}}]}))).status,200);
});
test('cross-origin changes and invalid settings are rejected',async()=>{
 const {handler,admin}=await fixture();
 const response=await handler(new Request('https://example.test/api/control/login',{method:'POST',headers:{origin:'https://other.test'},body:'{}'}));assert.equal(response.status,403);
 for(const settings of [{seconds:2},{wheelMode:'anything'},{wheelScore:-1},{dailyCap:0.5}])assert.equal((await admin('changes',change({settings}))).status,400);
});
test('malformed changes and mismatched identities are rejected without altering state',async()=>{
 const {admin,game:player}=await fixture();
 for(const patch of [{games:[{id:1,create:null}]},{games:{}},{games:[{id:1,create:game(2)}]},{games:[{id:1,set:{status:'digital'}}]}])assert.ok([400,409].includes((await player('changes',change(patch))).status));
 assert.equal((await player('changes',change({games:[{id:1,create:{...game(1),status:'reservado',prize:'cha'}}]}))).status,400);
 assert.equal((await player('state')).data.db.games.length,0);
 const backup=State.fresh();backup.games=[{id:1}];
 assert.equal((await admin('replace',{id:crypto.randomUUID(),db:backup})).status,400);
 assert.equal((await player('state')).data.db.games.length,0);
});
test('operation acknowledgement supports recovery and completed results cannot reopen',async()=>{
 const {game:player}=await fixture();const id=crypto.randomUUID();
 assert.equal((await player('changes',change({games:[{id:1,create:game(1)}]},id))).status,200);
 assert.equal((await player('state?operation='+id)).data.acknowledged,true);
 assert.equal((await player('changes',change({games:[{id:1,set:{status:'digital'}}]}))).status,200);
 assert.equal((await player('changes',change({games:[{id:1,set:{status:'aguardando_roleta'}}]}))).status,409);
});
test('session time validation also rejects duplicate times in a single atomic batch',async()=>{
 const {admin}=await fixture();const session={day:1,time:'10:30',duration:30,capacity:4};
 assert.equal((await admin('changes',change({sessions:[{id:'a',create:{...session,id:'a',time:'25:00'}}]}))).status,400);
 assert.equal((await admin('changes',change({sessions:['a','b'].map(id=>({id,create:{...session,id}}))}))).status,409);
});
test('large game histories normalize without spreading all records onto the stack',()=>{
 const value=State.fresh();value.games=Array.from({length:150000},(_,i)=>({id:i+1}));
 assert.equal(State.normalize(value).nextId,150001);
});
test('optimized state diff preserves creates, edits, removals, stock deltas and appended audit',()=>{
 const before=State.fresh();before.games=[game(1),game(2)];before.sessions=[{id:'old',day:1,time:'10:00',capacity:3,duration:30}];
 const after=clone(before);after.games=[{...game(1),status:'digital'},game(3)];after.sessions=[];after.prizes[0].qty+=2;after.audit.push({time:new Date().toISOString(),type:'test',detail:'diff'});
 const patch=State.diff(before,after);const merged=State.merge(before,patch);
 assert.deepEqual(merged.games,after.games);assert.deepEqual(merged.sessions,after.sessions);assert.deepEqual(merged.prizes,after.prizes);assert.deepEqual(merged.audit,after.audit);
 assert.deepEqual(State.diff(merged,after),{});
});
