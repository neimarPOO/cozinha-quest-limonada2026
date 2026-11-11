/* Adaptador do armazenamento compartilhado. A chave nunca sai do servidor. */
function createSupabaseStore({url, key, fetch:request=globalThis.fetch}={}) {
  const missingVariables=[];
  if(!url||!String(url).trim())missingVariables.push('SUPABASE_URL');
  if(!key||!String(key).trim())missingVariables.push('SUPABASE_SERVICE_ROLE_KEY');
  if(missingVariables.length)throw Object.assign(new Error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no servidor.'),{code:'SUPABASE_CONFIG_MISSING',missingVariables});
  let project;
  try {project=new URL(String(url).trim());} catch {throw Object.assign(new Error('SUPABASE_URL deve ser a URL HTTPS do projeto.'),{code:'SUPABASE_URL_INVALID'});}
  if(project.protocol!=='https:'||project.username||project.password||project.search||project.hash||!['/','/rest/v1','/rest/v1/'].includes(project.pathname))throw Object.assign(new Error('SUPABASE_URL deve ser a URL HTTPS do projeto.'),{code:'SUPABASE_URL_INVALID'});
  key=String(key).trim();
  const headers={apikey:key,'Content-Type':'application/json'};
  // Chaves secretas novas não são JWTs. A chave legada service_role é um JWT.
  if(!key.startsWith('sb_secret_'))headers.Authorization='Bearer '+key;
  async function call(path,options={}) {
    const response=await request(project.origin+'/rest/v1/'+path,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(15000)});
    if(!response.ok) {
      let providerCode=null;
      try {const error=await response.json();if(typeof error.code==='string'&&/^[A-Z0-9]{4,12}$/.test(error.code))providerCode=error.code;} catch {}
      throw Object.assign(new Error('Não foi possível acessar o armazenamento Supabase (HTTP '+response.status+').'),{code:'SUPABASE_HTTP_ERROR',upstreamStatus:response.status,providerCode});
    }
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
