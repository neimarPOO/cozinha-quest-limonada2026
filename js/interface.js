/* Somente apresentação: o estado e as regras do jogo continuam em app.js. */
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
