const {test}=require('node:test'),assert=require('node:assert/strict');
const {createSupabaseStore}=require('../lib/supabase-store.cjs');
function setup(result,status=200,key='test-service-role-jwt'){
 const calls=[];
 const store=createSupabaseStore({url:'https://project.supabase.co',key,fetch:async(url,options)=>{calls.push({url,options});return new Response(status===204?null:JSON.stringify(result),{status})}});
 return{store,calls};
}
test('Supabase adapter reads records and ETags with server-only credentials',async()=>{
 const {store,calls}=setup([{data:{revision:4},etag:'a'}]);
 assert.deepEqual(await store.getWithMetadata('event'),{data:{revision:4},etag:'a',metadata:{}});
 assert.equal(calls[0].options.headers.apikey,'test-service-role-jwt');
 assert.equal(calls[0].options.headers.Authorization,'Bearer test-service-role-jwt');
 assert.ok(calls[0].url.includes('/rest/v1/cozinha_control_records?key=eq.event'));
 assert.deepEqual(await store.get('event'),{revision:4});
 assert.equal(await setup([]).store.get('absent'),null);
});
test('Supabase adapter delegates atomic create/update conditions and preserves conflict results',async()=>{
 const {store,calls}=setup({modified:false,etag:null});
 assert.deepEqual(await store.setJSON('event',{revision:5},{onlyIfMatch:'previous-etag'}),{modified:false,etag:null});
 assert.deepEqual(JSON.parse(calls[0].options.body),{p_key:'event',p_data:{revision:5},p_expected_etag:'previous-etag',p_only_if_new:false});
 await store.setJSON('event',{}, {onlyIfNew:true});assert.equal(JSON.parse(calls[1].options.body).p_only_if_new,true);
 await assert.rejects(store.setJSON('event',{}, {onlyIfNew:true,onlyIfMatch:'other'}),/incompatíveis/);
});
test('Supabase secret API keys are not treated as user JWTs and deletion requests are scoped',async()=>{
 const {store,calls}=setup(null,204,'sb_secret_test-only');
 await store.delete('session-abc');assert.equal(calls[0].options.method,'DELETE');
 assert.equal(calls[0].options.headers.apikey,'sb_secret_test-only');assert.equal(calls[0].options.headers.Authorization,undefined);
 assert.ok(calls[0].url.includes('key=eq.session-abc'));
});
test('Supabase misconfiguration and API failures do not expose secrets or provider response bodies',async()=>{
 assert.throws(()=>createSupabaseStore({}),/Configure/);
 assert.throws(()=>createSupabaseStore({url:'http://project.supabase.co',key:'test'}),/HTTPS/);
 assert.throws(()=>createSupabaseStore({url:'https://user:password@project.supabase.co',key:'test'}),/HTTPS/);
 const {store}=setup({message:'private-provider-message'},403);
 await assert.rejects(store.get('event'),error=>error.message.includes('HTTP 403')&&!error.message.includes('private-provider-message')&&!error.message.includes('test-service-role-jwt'));
});

test('first Supabase initialization copies legacy event once and never overwrites existing data',async()=>{
 const {ensureSupabaseEvent}=require('../lib/supabase-migration.cjs');
 const previous={db:{games:[{id:1}],prizes:[{id:'cafe',qty:8}],settings:{wheelScore:500}},revision:13,applied:['existing-operation']};
 let saved=null,copies=0;
 const target={async get(){return saved},async setJSON(key,value,options){assert.equal(options.onlyIfNew,true);copies++;saved=value;return {modified:true}}};
 const legacy={async get(){return previous}};
 assert.equal((await ensureSupabaseEvent(target,legacy)).migrated,true);
 assert.deepEqual(saved.db,previous.db);assert.deepEqual(saved.applied,previous.applied);
 assert.equal(saved.migration.revision,13);
 saved.db.games.push({id:2});
 assert.equal((await ensureSupabaseEvent(target,legacy)).migrated,false);
 assert.equal(copies,1);assert.equal(saved.db.games.length,2);
});
test('migration leaves an empty source untouched and refuses malformed source state',async()=>{
 const {ensureSupabaseEvent}=require('../lib/supabase-migration.cjs');
 const target={async get(){return null},async setJSON(){throw Error('Must not write')}};
 assert.equal((await ensureSupabaseEvent(target,{async get(){return null}})).migrated,false);
 await assert.rejects(ensureSupabaseEvent(target,{async get(){return {db:{},revision:1}}}),/conferido/);
});
