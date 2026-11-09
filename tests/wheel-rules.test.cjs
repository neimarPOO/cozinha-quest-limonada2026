const {test}=require('node:test');
const assert=require('node:assert/strict');
const Rules=require('../js/wheel-rules');
const State=require('../js/event-state');
test('wheel sectors reflect actual registered names and IDs, including new items',()=>{
 const db=State.fresh();db.prizes[0].name='Nome atualizado';db.prizes.push({id:'new',name:'Novo prêmio',qty:2,perDay:1,weight:1});
 const list=Rules.sectors(db.prizes);
 assert.deepEqual(list.filter(s=>s.type==='prize').map(p=>[p.id,p.name]),db.prizes.map(p=>[p.id,p.name]));
 assert.equal(list.length,10);
});
test('simulation shares eligibility and quotas and never mutates stock, settings, history or audit',()=>{
 const db=State.fresh();db.prizes[3].qty=2;db.settings.wheelMode='completion';
 const before=JSON.stringify(db);
 assert.equal(Rules.pick(db,{score:1000,completed:false},()=>0).ok,false);
 const pick=Rules.pick(db,{score:0,completed:true},()=>0);
 assert.equal(pick.prize.id,'brownie');assert.equal(Rules.sectors(db.prizes)[pick.targetIndex].id,pick.prize.id);
 assert.equal(JSON.stringify(db),before);
 db.settings.dailyCap=0;assert.equal(Rules.pick(db,{score:0,completed:true,hadRespin:true},()=>0).prize,null);
});
test('stock and daily limits include reserved/delivered items and release cancellations',()=>{
 const db=State.fresh(),p=db.prizes[0];p.qty=10;p.perDay=2;
 db.games=[{day:1,prize:p.id,status:'entregue'},{day:1,prize:p.id,status:'reservado'},{day:1,prize:p.id,status:'cancelado'}];
 assert.equal(Rules.available(db,p),0);assert.equal(Rules.dailyPhysical(db),2);
 const pick=Rules.pick(db,{score:1000,completed:true,hadRespin:true},()=>0);
 assert.equal(pick.prize,null);assert.equal(pick.sector,'miss_2');
 db.day=2;assert.equal(Rules.available(db,p),2);assert.equal(Rules.dailyPhysical(db),0);
});
test('weighted reward, extra spin and digital badge match the actual target sectors',()=>{
 const db=State.fresh();db.prizes[0].qty=1;db.prizes[1].qty=1;db.prizes[1].weight=3;
 let values=[0,.9];let pick=Rules.pick(db,{score:1000,completed:true},()=>values.shift());assert.equal(pick.prize.id,db.prizes[1].id);
 values=[.99,0];pick=Rules.pick(db,{score:1000,completed:true},()=>values.shift());assert.equal(pick.isRespin,true);
 pick=Rules.pick(db,{score:1000,completed:true,hadRespin:true},()=>.99);assert.equal(pick.sector,'miss_2');
});
