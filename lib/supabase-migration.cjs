/* Copia somente o evento inicial; nunca substitui um estado já existente. */
async function ensureSupabaseEvent(target,legacy) {
  if(await target.get('event',{type:'json'}))return {migrated:false};
  const previous=await legacy.get('event',{type:'json',consistency:'strong'});
  if(!previous)return {migrated:false};
  if(!previous.db||!Array.isArray(previous.db.games)||!Array.isArray(previous.db.prizes)||!previous.db.settings||!Number.isInteger(previous.revision))throw new Error('O estado anterior precisa ser conferido antes da migração.');
  const record={...previous,migration:{source:'netlify',revision:previous.revision,at:new Date().toISOString()}};
  const result=await target.setJSON('event',record,{onlyIfNew:true});
  return {migrated:result.modified};
}
module.exports={ensureSupabaseEvent};
