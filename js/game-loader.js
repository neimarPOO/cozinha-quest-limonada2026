/* A abertura funciona antes de baixar/inicializar WebGL. */
window.GameLoader = (() => {
  const scripts = [
    "public/three.min.js?v=3b3a1c97de3c",
    "js/kitchen-resources.js?v=1",
    "public/models/hand-surface.js?v=1",
    "js/kitchen-hand.js?v=3",
    "public/vendor/RectAreaLightUniformsLib.js?v=158",
    "js/kitchen-environment.js?v=3",
    "js/kitchen-assets.js?v=3",
    "js/kitchen-lighting.js?v=2",
    "js/cookie-scene.js?v=11",
    "js/recipe-scene.js?v=4",
    "js/brownie-scene.js?v=1",
    "js/recipe-notebook.js?v=3",
    "js/cookie-game.js?v=14",
  ];
  const wood = ["diffuse", "bump", "roughness"].map(
    (n) => "public/textures/kitchen/hardwood2_" + n + ".jpg",
  );
  const symbols = [
    "THREE",
    "KitchenResources",
    "KitchenHandSurface",
    "KitchenHand",
    "RectAreaLightUniformsLib",
    "KitchenEnvironment",
    "KitchenAssets",
    "KitchenLighting",
    "CookieScene",
    "RecipeScene",
    "BrownieScene",
    "RecipeNotebook",
    "CookieGame",
  ];
  const loaded = new Set();
  let pending = null,
    warmed = false,
    request = 0;
  const panel = document.createElement("div");
  panel.className = "game-loading";
  panel.hidden = true;
  panel.innerHTML =
    '<section role="status" aria-live="polite"><span class="game-loading-spinner" aria-hidden="true"></span><h2>Preparando sua cozinha…</h2><p>Carregando os detalhes e a iluminação. O tempo da receita ainda não começou.</p><button type="button" class="btn">Voltar</button></section>';
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.querySelector("h2").id = "gameLoadingTitle";
  panel.setAttribute("aria-labelledby", "gameLoadingTitle");
  let previousFocus = null;
  panel.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      event.preventDefault();
      panel.querySelector("button").focus();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      panel.querySelector("button").click();
    }
  });
  document.body.append(panel);
  function restore() {
    document.getElementById("game").classList.add("hidden");
    document.getElementById("intro").classList.remove("hidden");
  }
  panel.querySelector("button").onclick = () => {
    request++;
    if (window.CookieGame?.active) {
      CookieGame.stop();
      restore();
    }
    panel.hidden = true;
    if (previousFocus?.isConnected)
      previousFocus.focus({ preventScroll: true });
  };
  function warm() {
    if (warmed) return;
    warmed = true;
    for (const url of scripts) {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.as = "script";
      link.href = url;
      document.head.append(link);
    }
    for (const url of wood) {
      const img = new Image();
      img.src = url;
    }
  }
  function load() {
    if (pending) return pending;
    for (const url of scripts) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "script";
      link.href = url;
      document.head.append(link);
    }
    pending = (async () => {
      for (const url of scripts) {
        if (loaded.has(url)) continue;
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.async = false;
          script.src = url;
          script.onload = () => {
            if (!window[symbols[scripts.indexOf(url)]]) {
              script.remove();
              reject(new Error("Falha ao inicializar " + url));
              return;
            }
            loaded.add(url);
            resolve();
          };
          script.onerror = () => {
            script.remove();
            reject(new Error("Falha no carregamento"));
          };
          document.head.append(script);
        });
      }
    })().catch((error) => {
      pending = null;
      throw error;
    });
    return pending;
  }
  async function start(id) {
    const token = ++request;
    if (panel.hidden) previousFocus = document.activeElement;
    panel.hidden = false;
    panel.querySelector("button").focus({ preventScroll: true });
    panel.querySelector("h2").textContent = "Preparando sua cozinha…";
    panel.querySelector("p").textContent =
      "Carregando os detalhes e a iluminação. O tempo da receita ainda não começou.";
    try {
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
      await load();
      if (token !== request) return;
      await CookieGame.start(id);
      if (token !== request) return;
      panel.hidden = true;
      document.getElementById("stageAction")?.focus({ preventScroll: true });
    } catch (error) {
      if (token !== request) return;
      if (window.CookieGame?.active) {
        CookieGame.stop();
        restore();
      }
      panel.querySelector("h2").textContent =
        "Não foi possível preparar a cozinha";
      panel.querySelector("p").textContent =
        "Volte e escolha a receita para tentar novamente.";
    }
  }
  for (const event of ["pointerover", "focusin", "touchstart"])
    document.addEventListener(
      event,
      (e) => {
        if (e.target.closest?.("[data-recipe]")) warm();
      },
      { passive: true },
    );
  return {
    start,
    warm,
    load,
    get ready() {
      return loaded.size === scripts.length;
    },
  };
})();
