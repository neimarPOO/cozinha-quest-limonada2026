/* Somente apresentação: o estado e as regras do jogo continuam em app.js. */
(() => {
  function updateQuestProgress() {
    const recipeNames = new Set(RECIPES.map(recipe => recipe.name));
    const completed = db.games.filter(game => game.completed && recipeNames.has(game.recipe));
    const total = db.games.reduce((sum, game) => sum + (Number(game.score) || 0), 0);
    document.getElementById('questScore').replaceChildren(document.createTextNode(total.toLocaleString('pt-BR') + ' '));
    const unit = document.createElement('em');
    unit.textContent = 'pts';
    document.getElementById('questScore').append(unit);
    document.getElementById('questRecipes').textContent = `${new Set(completed.map(game => game.recipe)).size} / ${RECIPES.length}`;
    document.getElementById('questGoal').textContent = `${db.settings.wheelScore.toLocaleString('pt-BR')} pts`;
  }
  updateQuestProgress();
  // Atualiza quando o jogador retorna à seleção, inclusive após uma partida.
  new MutationObserver(updateQuestProgress).observe(document.getElementById('intro'), { attributes: true, attributeFilter: ['class'] });
  document.getElementById('mainTabs').addEventListener('click', updateQuestProgress);
})();
