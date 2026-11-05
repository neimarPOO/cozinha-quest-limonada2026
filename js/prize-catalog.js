/* Catálogo compartilhado pelo cadastro administrativo e pela roleta. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PrizeCatalog = api;
})(globalThis, () => {
  const VERSION = 1;
  const definitions = [
    ['pao-de-queijo', 'Pão de Queijo', 'PÃO DE', 'QUEIJO', 'bread'],
    ['torta-fria', 'Torta Fria desconstruída', 'TORTA FRIA', 'DESCONSTRUÍDA', 'cake'],
    ['cheesecake', 'Cheesecake', 'CHEESECAKE', '', 'cake'],
    ['brownie', 'Brownie', 'BROWNIE', '', 'brownie'],
    ['cafe', 'Café', 'CAFÉ', '', 'drink'],
    ['cha', 'Chá', 'CHÁ', '', 'drink'],
    ['mesa', 'Mesa com bebida, doce e salgado', 'MESA COM', 'BEBIDA, DOCE E SALGADO', 'table'],
  ];
  const defaults = () => definitions.map(([id, name]) => ({id, name, qty: 0, perDay: 10, weight: 1}));
  const sectors = () => [
    ...definitions.map(([id, name, label, sub, icon]) => ({id, name, label, sub, icon, type: 'prize'})),
    {id: 'miss_2', name: 'Insígnia digital', label: 'INSÍGNIA', sub: 'DIGITAL', type: 'miss'},
    {id: 'respin', name: 'Gire novamente', label: 'GIRE', sub: 'NOVAMENTE', type: 'respin'},
  ];
  function migrate(db) {
    if (db.prizeCatalogVersion === VERSION) return db;
    const ids = new Set(definitions.map(([id]) => id));
    db.archivedPrizes = [...(db.archivedPrizes || []), ...db.prizes.filter(p => !ids.has(p.id))]
      .filter((p, i, all) => all.findIndex(other => other.id === p.id) === i);
    db.prizes = defaults().map(p => {
      const previous = db.prizes.find(old => old.id === p.id);
      return previous ? {...previous, name: p.name} : p;
    });
    db.prizeCatalogVersion = VERSION;
    return db;
  }
  return {VERSION, defaults, sectors, migrate};
});
