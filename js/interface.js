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
    document.getElementById('questGoal').textContent = GameSettings.wheelRequirement(db.settings);
  }
  document.addEventListener("control-state", updateQuestProgress);
  updateQuestProgress();
  // Atualiza quando o jogador retorna à seleção, inclusive após uma partida.
  new MutationObserver(updateQuestProgress).observe(document.getElementById('intro'), { attributes: true, attributeFilter: ['class'] });
  document.getElementById('mainTabs').addEventListener('click', updateQuestProgress);
})();

// Atalhos da abertura não iniciam uma receita sem a escolha do jogador.
(() => {
  function reveal(id) {
    showTab('play');
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    const focus = id === 'recipeList' ? target.querySelector('[data-recipe]') : target;
    if (focus) { if (!focus.hasAttribute('tabindex')) focus.tabIndex = -1; focus.focus({preventScroll:true}); }
  }
  document.getElementById('lobbyPlayNow').onclick = () => reveal('recipeList');
  document.querySelectorAll('[data-lobby-target]').forEach(button => button.onclick = () => reveal(button.dataset.lobbyTarget));
})();
