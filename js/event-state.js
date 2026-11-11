/* Estado e alterações do evento, compartilhados pelo navegador e pelo servidor. */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./game-settings'), require('./prize-catalog'));
  else root.EventState = factory(root.GameSettings, root.PrizeCatalog);
})(globalThis, (Settings, Prizes) => {
  const clone = x => JSON.parse(JSON.stringify(x));
  const equal = (a,b) => JSON.stringify(a) === JSON.stringify(b);
  function fresh() {
    return {day:1, settings:Settings.normalizeSettings(), prizes:Prizes.defaults(), prizeCatalogVersion:Prizes.VERSION,
      archivedPrizes:[], games:[], sessions:[], audit:[], nextId:1};
  }
  function normalize(db) {
    if (!db || typeof db !== 'object' || !Array.isArray(db.games) || !Array.isArray(db.prizes) || !Array.isArray(db.sessions)) throw new Error('Estado do evento inválido.');
    db.audit = Array.isArray(db.audit) ? db.audit : [];
    db.archivedPrizes = Array.isArray(db.archivedPrizes) ? db.archivedPrizes : [];
    db.nextId = db.games.reduce((n,g)=>Math.max(n,Number(g.id)+1||1),Number(db.nextId)||1);
    db.settings = Settings.normalizeSettings(db.settings);
    return Prizes.migrate(db);
  }
  function diff(before, after) {
    const patch = {};
    const settings = Object.fromEntries(Object.entries(after.settings).filter(([k,v])=>!equal(before.settings[k],v)));
    if (Object.keys(settings).length) patch.settings=settings;
    if (before.day!==after.day) patch.day=after.day;
    const oldPrizes = new Map(before.prizes.map(p=>[p.id,p]));
    const prizes = after.prizes.flatMap(p=>{
      const old=oldPrizes.get(p.id); if(!old) return [];
      const edit={id:p.id}; if(p.qty!==old.qty) edit.qtyDelta=p.qty-old.qty;
      if(p.perDay!==old.perDay) edit.perDay=p.perDay;
      if(p.weight!==old.weight) edit.weight=p.weight;
      return Object.keys(edit).length>1?[edit]:[];
    });
    if(prizes.length) patch.prizes=prizes;
    for(const key of ['games','sessions']) {
      const previous = new Map(before[key].map(item=>[item.id,item]));
      const present = new Set(after[key].map(item=>item.id));
      const edits=after[key].flatMap(item=>{
        const old=previous.get(item.id);
        if(!old) return [{id:item.id, create:clone(item)}];
        const set=Object.fromEntries(Object.entries(item).filter(([k,v])=>k!=='id'&&!equal(old[k],v)));
        return Object.keys(set).length?[{id:item.id,set}]:[];
      });
      const removed=before[key].filter(item=>!present.has(item.id)).map(item=>({id:item.id,remove:true}));
      if(edits.length||removed.length) patch[key]=[...edits,...removed];
    }
    const previousAudit = new Set(before.audit.map(item=>JSON.stringify(item)));
    const audit=after.audit.filter(item=>!previousAudit.has(JSON.stringify(item)));
    if(audit.length) patch.audit=clone(audit);
    return patch;
  }
  // Utilizado no cliente para reaplicar alterações ainda não confirmadas.
  function merge(db, patch) {
    const result=clone(db);
    if(patch.settings) Object.assign(result.settings,patch.settings);
    if(patch.day!==undefined) result.day=patch.day;
    for(const edit of patch.prizes||[]) {
      const p=result.prizes.find(x=>x.id===edit.id); if(!p) continue;
      if(edit.qtyDelta!==undefined) p.qty+=edit.qtyDelta;
      if(edit.perDay!==undefined) p.perDay=edit.perDay;
      if(edit.weight!==undefined) p.weight=edit.weight;
    }
    for(const key of ['games','sessions']) for(const edit of patch[key]||[]) {
      const index=result[key].findIndex(x=>x.id===edit.id);
      if(edit.remove) {if(index>=0)result[key].splice(index,1);}
      else if(edit.create&&index<0) result[key].push(clone(edit.create));
      else if(edit.set&&index>=0) Object.assign(result[key][index],clone(edit.set));
    }
    if(patch.audit) result.audit.push(...clone(patch.audit));
    result.nextId=result.games.reduce((n,g)=>Math.max(n,Number(g.id)+1||1),Number(result.nextId)||1);
    return result;
  }
  return {fresh, normalize, diff, merge, clone};
});
