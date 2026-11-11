/* Adaptador do armazenamento compartilhado. A chave nunca sai do servidor. */
function createSupabaseStore({url, key, fetch:request=globalThis.fetch}={}) {
  if(!url||!key)throw new Error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no servidor.');
  const project=new URL(url);
  if(project.protocol!=='https:'||project.username||project.password||project.search||project.hash||project.pathname!=='/')throw new Error('SUPABASE_URL deve ser a URL HTTPS do projeto.');
  const headers={apikey:key,'Content-Type':'application/json'};
  // Chaves secretas novas não são JWTs. A chave legada service_role é um JWT.
  if(!key.startsWith('sb_secret_'))headers.Authorization='Bearer '+key;
  async function call(path,options={}) {
    const response=await request(project.origin+'/rest/v1/'+path,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw new Error('Não foi possível acessar o armazenamento Supabase (HTTP '+response.status+').');
    if(response.status===204)return null;
    return response.json();
  }
  const valid=key=>{if(typeof key!=='string'||!key.length||key.length>200)throw new Error('Chave de registro inválida.');return key;};
  async function getWithMetadata(key) {
    const rows=await call('cozinha_control_records?key=eq.'+encodeURIComponent(valid(key))+'&select=data,etag&limit=1');
    return rows[0]?{data:rows[0].data,etag:rows[0].etag,metadata:{}}:null;
  }
  return {
    async get(key){return (await getWithMetadata(key))?.data??null;},
    getWithMetadata,
    async setJSON(key,data,options={}) {
      if(options.onlyIfNew&&options.onlyIfMatch)throw new Error('Condições de escrita incompatíveis.');
      return call('rpc/cozinha_control_write',{method:'POST',body:JSON.stringify({p_key:valid(key),p_data:data,p_expected_etag:options.onlyIfMatch||null,p_only_if_new:!!options.onlyIfNew})});
    },
    async delete(key){await call('cozinha_control_records?key=eq.'+encodeURIComponent(valid(key)),{method:'DELETE',headers:{Prefer:'return=minimal'}});},
  };
}
module.exports={createSupabaseStore};
