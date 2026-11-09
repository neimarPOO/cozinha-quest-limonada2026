/* Mesmas regras puras para a roleta do jogo e a simulação administrativa. */
(function(root, factory) {
  if(typeof module==='object'&&module.exports) module.exports=factory(require('./game-settings'),require('./prize-catalog'));
  else root.WheelRules=factory(root.GameSettings,root.PrizeCatalog);
})(globalThis,(Settings,Catalog)=>{
  function available(db,prize) {
    const used=db.games.filter(g=>g.prize===prize.id&&g.status!=='cancelado');
    return Math.max(0,Math.min(prize.qty-used.length,prize.perDay-used.filter(g=>g.day===db.day).length));
  }
  function dailyPhysical(db) {return db.games.filter(g=>g.day===db.day&&g.prize&&g.status!=='cancelado').length;}
  function chance(score) {if(score<250)return .08;if(score<500)return .15;if(score<750)return .25;if(score<900)return .35;return .45;}
  function sectors(prizes) {
    const presets=Catalog.sectors();
    return [...prizes.map(p=>{
      const preset=presets.find(s=>s.id===p.id&&s.name===p.name);
      if(preset)return {...preset};
      const words=String(p.name).split(/\s+/), label=words.slice(0,2).join(' ').slice(0,14),sub=words.slice(2).join(' ').slice(0,24);
      return {id:p.id,name:p.name,label,sub,icon:'gift',type:'prize'};
    }),...presets.filter(s=>s.type!=='prize')];
  }
  function freeSessions(db) {
    return db.sessions.filter(s=>s.day===db.day&&s.capacity>db.games.filter(g=>g.sessionId===s.id&&g.status!=='cancelado').length).sort((a,b)=>a.time.localeCompare(b.time));
  }
  function pick(db,game,random=Math.random) {
    if(!Settings.wheelEligible(db.settings,game))return {ok:false,reason:'Para liberar a roleta: '+Settings.wheelRequirement(db.settings)+'.'};
    const list=sectors(db.prizes),pool=db.prizes.filter(p=>available(db,p)>0&&(p.id!=='ticket'||freeSessions(db).length));
    const cap=dailyPhysical(db)>=db.settings.dailyCap;
    let prize=null,session=null;
    if(pool.length&&!cap&&random()<chance(game.score)) {
      let n=random()*pool.reduce((sum,p)=>sum+Number(p.weight),0);
      prize=pool.find(p=>(n-=Number(p.weight))<0)||pool.at(-1);
      if(prize.id==='ticket')session=freeSessions(db)[0];
    }
    const type=prize?'prize':!game.hadRespin&&random()<.22?'respin':'miss';
    const targetIndex=list.findIndex(s=>prize?s.type==='prize'&&s.id===prize.id:s.type===type);
    return {ok:true,prize,session,targetIndex,isRespin:type==='respin',sector:list[targetIndex].id,
      reason:cap?'Limite diário geral de prêmios atingido.':!pool.length?'Nenhum prêmio disponível no estoque e nos limites de hoje.':prize?'Prêmio físico disponível.':type==='respin'?'Giro extra.':'Insígnia digital: o sorteio não selecionou um prêmio físico.'};
  }
  return {available,dailyPhysical,chance,sectors,pick};
});
