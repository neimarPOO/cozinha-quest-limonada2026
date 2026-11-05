const {test} = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../js/prize-catalog');
const wheel = require('../js/wheel-design');
test('prize catalog: seven requested rewards have matching wheel sectors', () => {
  const prizes = catalog.defaults(), sectors = catalog.sectors();
  assert.deepEqual(prizes.map(p => p.name), ['Pão de Queijo', 'Torta Fria desconstruída', 'Cheesecake', 'Brownie', 'Café', 'Chá', 'Mesa com bebida, doce e salgado']);
  assert.deepEqual(sectors.filter(s => s.type === 'prize').map(s => s.id), prizes.map(p => p.id));
  assert.ok(prizes.every(p => p.qty === 0 && p.weight === 1));
  const svg = wheel.svg(sectors);
  assert.equal((svg.match(/data-sector=/g) || []).length, 9);
  assert.ok(!svg.includes('NaN'));
  for (const p of prizes) assert.ok(svg.includes(p.name));
});
test('prize migration preserves historical awards and existing stock without reviving old rewards', () => {
  const games = [{prize:'sweet',status:'reservado'}];
  const db = {prizes:[{id:'sweet',name:'Mini doce',qty:40},{id:'cafe',name:'Café antigo',qty:8,perDay:3,weight:2}],games};
  catalog.migrate(db);
  assert.equal(db.prizes.length, 7);
  assert.equal(db.archivedPrizes[0].name, 'Mini doce');
  assert.equal(db.games, games);
  assert.deepEqual(db.prizes.find(p => p.id === 'cafe'), {id:'cafe',name:'Café',qty:8,perDay:3,weight:2});
  db.prizes[0].qty = 14;
  const saved = JSON.stringify(db);
  catalog.migrate(db);
  assert.equal(JSON.stringify(db), saved);
});
