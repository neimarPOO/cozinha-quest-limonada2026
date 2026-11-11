import {getStore} from '@netlify/blobs';
import service from '../../lib/control-service.cjs';
import storage from '../../lib/supabase-store.cjs';
import migration from '../../lib/supabase-migration.cjs';
let initialization;
export default async function(request, context) {
  const provider=process.env.CONTROL_STORAGE || 'netlify';
  if(!['netlify','supabase'].includes(provider))return Response.json({error:'Armazenamento do evento não configurado.'},{status:503});
  let store;
  try {
    store=provider==='supabase'
      ? storage.createSupabaseStore({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY})
      : getStore({name:'cozinha-quest-control',consistency:'strong'});
  } catch(error) {return Response.json({error:'Armazenamento do evento indisponível. Confira a configuração do servidor.',code:error.code||'STORAGE_SETUP_FAILED',missingVariables:error.missingVariables||[]},{status:503});}
  if(provider==='supabase') {
    if(!initialization)initialization=migration.ensureSupabaseEvent(store,getStore({name:'cozinha-quest-control',consistency:'strong'})).catch(error=>{initialization=null;throw error;});
    try {await initialization;} catch {return Response.json({error:'Não foi possível preparar a migração dos dados anteriores. Nenhum estado existente foi substituído.'},{status:503});}
  }
  return service.createControlHandler(store, {localAddress:context.ip,storageProvider:provider})(request);
}
export const config={path:'/api/control/*'};
