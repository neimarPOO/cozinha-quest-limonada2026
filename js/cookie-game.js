/* Controlador compartilhado das três receitas detalhadas. */
(() => {
  "use strict";
  const { Session } = CookieRecipe;
  let definition = RecipeCatalog.cookie,
    { phases, items } = definition;
  let recipe = RECIPES.find((r) => r.id === "cookie");
  for (const entry of RECIPES) {
    const d = RecipeCatalog[entry.id];
    if (d) {
      entry.steps = d.phases.map(([name, hint]) => [name, "Preparar", hint]);
      entry.desc = `${d.phases.length} fases: quantidades, procedimentos e tempos de preparo.`;
    }
  }
  recipe.desc =
    "Dos ingredientes ao prato: prepare cookies em oito fases, com tempos e procedimentos.";
  recipe.steps = phases.map(([name, hint]) => [name, "Preparar", hint]);
  const gameRoot = document.getElementById("game");
  const sceneRoot = document.createElement("div");
  sceneRoot.id = "cookieScene";
  sceneRoot.hidden = true;
  document.querySelector("#game .scene").append(sceneRoot);
  const controls = document.createElement("details");
  controls.className = "cookie-controls";
  controls.hidden = true;
  controls.setAttribute("aria-label", "Ingredientes e estações da receita");
  controls.innerHTML =
    '<summary class="cookie-fallback-tab">⚠ Modo sem WebGL · abra somente se a visualização 3D falhar</summary><p class="cookie-learning-note">Estes controles alternativos permitem jogar quando o WebGL não está disponível.</p><p class="cookie-learning-note">⏱ O cronômetro conta durante leitura, configuração e movimentação. Pausa apenas nas ações temporizadas; o forno continua seu próprio tempo, mesmo com modal aberto.</p><button type="button" class="btn cookie-touch-mode" id="cookieMoveMode" aria-pressed="false">Ativar arraste de objetos</button><p class="cookie-touch-hint">Deslize a cena para os lados. Ative o arraste para mover objetos ou use os botões abaixo.</p><details open><summary>Ingredientes · quantidades da receita</summary><div class="cookie-inventory"></div></details><details open><summary>Utensílios e estações</summary><div class="cookie-stations"></div></details>';
  document.querySelector(".game-workbench").append(controls);
  let ingredientIds = definition.ingredientIds;
  function buildInventory() {
    controls.querySelector(".cookie-inventory").replaceChildren();
    controls.querySelector(".cookie-stations").replaceChildren();
    for (const [id, [name, quantity, emoji]] of Object.entries(items)) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "cookie-item";
      b.dataset.cookieItem = id;
      const icon = document.createElement("span"),
        title = document.createElement("b"),
        note = document.createElement("small");
      icon.textContent = emoji;
      title.textContent = name;
      note.textContent = quantity;
      b.append(icon, title, note);
      b.addEventListener("click", () => interact(id, null, "manual"));
      controls
        .querySelector(
          ingredientIds.includes(id) ? ".cookie-inventory" : ".cookie-stations",
        )
        .append(b);
    }
  }
  const viewportTools = document.createElement("div");
  viewportTools.className = "cookie-viewport-tools";
  viewportTools.hidden = true;
  viewportTools.innerHTML =
    '<span class="cookie-camera-hint">Scroll: zoom · botão direito: mover câmera</span><button type="button" class="btn" id="cookieZoomOut" aria-label="Diminuir zoom">−</button><output id="cookieZoomLevel" aria-label="Nível de zoom">100%</output><button type="button" class="btn" id="cookieZoomIn" aria-label="Aumentar zoom">+</button><button type="button" class="btn" id="cookieZoomReset">Visão geral</button><button type="button" class="btn" id="cookieFocus">Focar etapa</button><button type="button" class="btn" id="cookieExpand" aria-pressed="false">Ampliar bancada</button><button type="button" class="btn cookie-touch-mode" id="cookieSceneMove" aria-pressed="false">Arrastar objetos</button>';
  document.querySelector("#game .scene").append(viewportTools);
  const taskPanel = document.createElement("section");
  taskPanel.className = "cookie-task";
  taskPanel.hidden = true;
  taskPanel.innerHTML =
    '<p id="cookieTaskInstruction"></p><button type="button" class="btn primary" id="cookieTaskAction">Configurar ação</button><p id="cookieRealTime"></p><div id="cookieActivity" hidden><progress id="cookieActivityProgress" max="1" value="0"></progress><p id="cookieActivityText" role="status"></p><button type="button" class="btn primary" id="cookieStir" aria-pressed="false">Segure para misturar · ou mantenha Espaço pressionado</button></div><button type="button" class="btn" id="recipeAdvance" hidden>Avançar tempo de fermentação</button><div id="recipeRepeat" hidden><p id="recipeRepeatCount"></p><div id="recipeRepeatButtons"></div></div><div id="cookieBaking" hidden><p id="cookieBakeState" role="status"></p><button type="button" class="btn" id="cookieGloves">Equipar luvas</button><button type="button" class="btn primary" id="cookieRemove">Retirar assadeira</button></div><div id="cookiePortioning" hidden><p id="cookiePortionCount"></p><button type="button" class="btn" id="cookieCollect">Coletar uma porção</button><div id="cookieTray" role="group" aria-label="Posições na assadeira"></div><p>Posições com distância mínima. Bolinhas próximas são recusadas.</p></div><p id="cookieBuff"></p>';
  document
    .querySelector(".game-mission")
    .insertBefore(taskPanel, document.querySelector(".recipe-roadmap-heading"));
  const modal = document.createElement("div");
  modal.id = "cookieActionModal";
  modal.className = "cookie-modal";
  modal.hidden = true;
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "false");
  modal.setAttribute("aria-labelledby", "cookieActionTitle");
  modal.innerHTML =
    '<form class="cookie-modal-card" id="cookieActionForm"><div class="cookie-modal-heading"><div><span class="eyebrow">PREPARE COM INTENÇÃO</span><h2 id="cookieActionTitle"></h2></div><button class="btn" id="cookieModalClose" type="button" aria-label="Fechar configuração">✕</button></div><details class="cookie-action-details"><summary>Detalhes da etapa</summary><p id="cookieActionDescription"></p><p id="cookieActionNote" class="cookie-learning-note"></p></details><label for="cookieProcedure">Procedimento</label><select id="cookieProcedure" required></select><div id="cookieFields"></div><p id="cookieModalError" role="alert"></p><div class="cookie-modal-actions"><button type="button" class="btn" id="cookieSkip">Pular descanso</button><button type="submit" class="btn primary">Confirmar e executar</button></div></form>';
  gameRoot.append(modal);
  let state = null,
    scene = null,
    active = false,
    modalMode = null,
    previousFocus = null,
    lastTime = 0,
    remainingTime = 0,
    stirring = false,
    stopReason = "",
    modalAnchorId = null;
  function useFallback() {
    closeModal();
    scene?.dispose();
    scene = null;
    sceneRoot.textContent =
      "A visualização WebGL falhou. Continue pela aba de controles alternativos.";
    controls.open = true;
    viewportTools.hidden = true;
    setExpanded(false);
    $("engine").textContent = "Cookies · modo alternativo sem WebGL";
    if (active) render();
  }
  controls.addEventListener("toggle", () => {
    if (active) render();
  });
  function setExpanded(expanded) {
    gameRoot.classList.toggle("cookie-expanded", expanded);
    document.body.classList.toggle("cookie-immersive", expanded);
    $("cookieExpand").setAttribute("aria-pressed", String(expanded));
    $("cookieExpand").textContent = expanded
      ? "Reduzir bancada"
      : "Ampliar bancada";
  }
  $("cookieZoomIn").onclick = () => scene?.setZoom(scene.zoom * 1.2);
  $("cookieZoomOut").onclick = () => scene?.setZoom(scene.zoom / 1.2);
  $("cookieZoomReset").onclick = () => scene?.resetView();
  $("cookieFocus").onclick = () =>
    scene?.focus(state.task.target || state.task.item);
  $("cookieExpand").onclick = () =>
    setExpanded(!gameRoot.classList.contains("cookie-expanded"));
  $("cookieSceneMove").onclick = () => {
    const enabled =
      $("cookieSceneMove").getAttribute("aria-pressed") !== "true";
    $("cookieSceneMove").setAttribute("aria-pressed", String(enabled));
    $("cookieSceneMove").textContent = enabled
      ? "Explorar a cena"
      : "Arrastar objetos";
    sceneRoot.style.touchAction = enabled ? "none" : "pan-x";
  };
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.hidden && active) setExpanded(false);
  });
  function tell(message) {
    $("feedback").textContent = message;
  }
  function positionModal() {
    if (modal.hidden || !scene) return;
    const stage = document.querySelector("#game .scene"),
      bounds = stage.getBoundingClientRect();
    const viewport = window.visualViewport,
      visibleTop = viewport?.offsetTop || 0,
      visibleBottom = visibleTop + (viewport?.height || innerHeight);
    const card = $("cookieActionForm");
    const availableHeight = Math.max(
      150,
      Math.min(bounds.bottom, visibleBottom) -
        Math.max(bounds.top, visibleTop) -
        16,
    );
    card.style.maxHeight =
      Math.min(stage.clientHeight - 16, availableHeight) + "px";
    const w = card.offsetWidth,
      h = card.offsetHeight;
    const point = scene.getObjectAnchor(modalAnchorId) || {
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    };
    const ax = point.x - bounds.left,
      ay = point.y - bounds.top;
    const right = stage.clientWidth - w - 8,
      top = Math.max(8, visibleTop - bounds.top + 8),
      bottom = Math.min(
        stage.clientHeight - h - 8,
        visibleBottom - bounds.top - h - 8,
      );
    const fitsRight = ax + 22 + w <= stage.clientWidth - 8;
    const left = Math.max(
      8,
      Math.min(right, fitsRight ? ax + 22 : ax - w - 22),
    );
    const y = Math.max(top, Math.min(Math.max(top, bottom), ay - h / 2));
    card.style.left = left + "px";
    card.style.top = y + "px";
    card.dataset.side = fitsRight ? "right" : "left";
    card.style.setProperty(
      "--popover-arrow",
      Math.max(16, Math.min(h - 16, ay - y)) + "px",
    );
  }
  window.addEventListener("resize", positionModal);
  window.addEventListener("scroll", positionModal, true);
  window.visualViewport?.addEventListener("resize", positionModal);
  const panelSizeObserver = new ResizeObserver(positionModal);
  panelSizeObserver.observe($("cookieActionForm"));
  function closeModal() {
    modal.hidden = true;
    modalMode = null;
    if (scene) scene.actionObject = null;
    if (previousFocus?.isConnected) previousFocus.focus();
  }
  function openModal(mode = "task", anchorId = null) {
    if (!active) return;
    if (mode === "task" && state.status !== "ready") {
      tell("Conclua a ação em andamento.");
      return;
    }
    previousFocus = document.activeElement;
    modalMode = mode;
    modalAnchorId =
      anchorId || (mode === "gloves" ? "gloves" : state.task.item);
    modal.classList.toggle("is-fallback", !scene);
    modal.setAttribute("aria-modal", scene ? "false" : "true");
    if (scene) {
      document.querySelector("#game .scene").append(modal);
      scene.actionObject = modalAnchorId;
    } else {
      gameRoot.append(modal);
      $("cookieActionForm").style.maxHeight = "85svh";
    }
    modal.querySelector(".cookie-action-details").open = false;
    const t = state.task,
      gloves = mode === "gloves",
      name = gloves ? items.gloves[0] : items[t.item][0],
      correct = gloves
        ? "Equipar luvas térmicas antes de retirar"
        : t.procedure;
    $("cookieActionTitle").textContent = name;
    $("cookieActionDescription").textContent = gloves
      ? "A assadeira está quente. Proteja as mãos antes de retirá-la."
      : phases[t.phase][1];
    $("cookieActionNote").textContent = gloves
      ? "O forno continua contando enquanto você configura as luvas."
      : t.note ||
        (t.quantity
          ? `Quantidade real da receita: ${t.quantity} ${t.unit}.`
          : "Observe o objeto e escolha o procedimento correspondente.");
    const procedure = $("cookieProcedure");
    procedure.replaceChildren(new Option("Selecione o procedimento…", ""));
    const options = [
      correct,
      gloves
        ? "Retirar com as mãos sem proteção"
        : t.item === "butter"
          ? "Derreter completamente a manteiga"
          : t.item === "dry" && t.phase === 3
            ? "Adicionar toda a farinha e bater fortemente"
            : "Ignorar esta operação e seguir adiante",
    ];
    if (state.index % 2) options.reverse();
    for (const option of options) procedure.add(new Option(option, option));
    const fields = $("cookieFields");
    fields.replaceChildren();
    function numberField(name, label, min, max, value) {
      const wrap = document.createElement("div"),
        l = document.createElement("label"),
        i = document.createElement("input");
      i.id = "cookie-" + name;
      i.name = name;
      i.type = "number";
      i.required = true;
      i.step = "1";
      i.min = min;
      i.max = max;
      i.inputMode = "numeric";
      if (value !== undefined) i.value = value;
      l.htmlFor = i.id;
      l.textContent = label;
      wrap.append(l, i);
      fields.append(wrap);
    }
    if (!gloves) {
      if (t.quantity)
        numberField("quantity", `Quantidade (${t.unit})`, 1, 2000);
      if (t.temperature)
        numberField("temperature", "Temperatura (°C)", 100, 250);
      if (t.duration || t.kind === "chill" || t.kind === "bake")
        numberField(
          "duration",
          t.kind === "chill"
            ? "Descanso: 10–15 s no jogo (12–24 h reais)"
            : t.kind === "bake"
              ? `Meta: ${definition.bake.min}–${definition.bake.max} s no jogo (${definition.bake.min}–${definition.bake.max} min reais)`
              : `Tempo de ação no jogo (${t.duration} s)`,
          1,
          60,
        );
      if (t.kind === "portion")
        numberField(
          "portions",
          "Quantidade de cookies nesta rodada (4–20)",
          4,
          20,
          8,
        );
    }
    $("cookieSkip").hidden = gloves || (!t.optional && t.kind !== "chill");
    $("cookieSkip").textContent =
      t.kind === "chill" ? "Pular descanso" : "Pular decoração";
    $("cookieModalError").textContent = "";
    modal.hidden = false;
    if (scene)
      document
        .querySelector("#game .scene")
        .scrollIntoView({ block: "nearest", behavior: "instant" });
    positionModal();
    procedure.focus({ preventScroll: true });
  }
  function interact(id, target, source = "scene", contact = null) {
    if (!active || !state.task) return;
    if (state.status === "baking") {
      if (id === "gloves") openModal("gloves");
      else if (id === "oven" || id === "tray") removeTray();
      else
        tell(
          "Observe o forno. Equipe as luvas e retire no intervalo indicado no status.",
        );
      return;
    }
    if (state.status === "repeat") {
      const fruitCut =
        recipe.id === "lemonade" &&
        state.task.item === "knife" &&
        id === "lemon";
      if (id === state.task.item || id === state.task.target || fruitCut) {
        const result = state.repeat(
          contact && scene?.repeatPosition
            ? scene.repeatPosition(contact, state.task)
            : state.repetitions.length,
        );
        tell(result.ok ? "Procedimento executado." : result.message);
        scene?.press?.();
        render();
      } else tell("Use o objeto indicado no status da receita.");
      return;
    }
    if (state.status === "portion") {
      if (id === "wet") {
        state.collect();
        tell("Porção coletada. Escolha uma posição na assadeira.");
        render();
      } else if (id === "tray") {
        $("cookieTray").scrollIntoView({ block: "center", behavior: "smooth" });
        $("cookieTray").querySelector("button")?.focus();
      } else tell("Colete massa na tigela grande e posicione na assadeira.");
      return;
    }
    if (state.status !== "ready") {
      tell("Aguarde o temporizador desta ação.");
      return;
    }
    const t = state.task,
      sourceOK =
        id === t.item ||
        (t.kind === "chill" && id === "wet" && target === "fridge");
    if (!sourceOK) {
      tell(`Agora use ${items[t.item][0]}. ${t.procedure}.`);
      return;
    }
    if (
      scene &&
      source === "scene" &&
      CookieRecipe.requiresBowlDrop(t) &&
      target !== t.target
    ) {
      tell(
        `Arraste ${items[t.item][0]} até ${items[t.target][0]} para configurar quantidade e procedimento.`,
      );
      return;
    }
    if (source === "manual" && !controls.open) return;
    if (target && t.target && target !== t.target) {
      tell(`Destino desta etapa: ${items[t.target][0]}.`);
      return;
    }
    openModal("task", target || id);
  }
  function place(x, y, fromDrag = false) {
    if (!active) return;
    if (fromDrag) state.collect();
    const result = state.place(x, y);
    tell(result.ok ? "Porção posicionada." : result.message);
    render();
  }
  function removeTray() {
    const result = state.removeTray();
    tell(
      result.ok
        ? state.bakeQuality === "ideal"
          ? "Bordas douradas e centro macio! Deixe firmar na bancada."
          : "A massa assou além do ideal e perdeu maciez. Agora deixe esfriar."
        : result.message,
    );
    render();
  }
  $("cookieMoveMode").onclick = () => {
    const enabled = $("cookieMoveMode").getAttribute("aria-pressed") !== "true";
    $("cookieMoveMode").setAttribute("aria-pressed", String(enabled));
    $("cookieMoveMode").textContent = enabled
      ? "Concluir arraste e voltar a explorar"
      : "Ativar arraste de objetos";
    sceneRoot.style.touchAction = enabled ? "none" : "pan-x";
  };
  $("cookieActionForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!active || modal.hidden) return;
    if (modalMode === "gloves") {
      if (
        $("cookieProcedure").value !== "Equipar luvas térmicas antes de retirar"
      ) {
        $("cookieModalError").textContent =
          "Use as luvas térmicas para proteger as mãos.";
        return;
      }
      state.equipGloves();
      closeModal();
      tell("Luvas equipadas. Observe o tempo e retire a assadeira.");
      render();
      return;
    }
    const values = {
      procedure: $("cookieProcedure").value,
      ...Object.fromEntries(new FormData(e.target)),
    };
    const result = state.configure(values);
    if (!result.ok) {
      $("cookieModalError").textContent = result.message;
      render(false);
      return;
    }
    closeModal();
    stirring = false;
    lastTime = performance.now();
    tell(
      state.status === "running"
        ? "Ação iniciada. Observe a transformação da mistura."
        : state.status === "baking"
          ? "Forno ligado! Equipe as luvas e retire no intervalo indicado no status."
          : "Procedimento correto. Continue a receita.",
    );
    render();
  });
  $("cookieModalClose").onclick = closeModal;
  $("cookieSkip").onclick = () => {
    if (state?.skipOptional()) {
      closeModal();
      tell(
        "Etapa opcional pulada. A receita continua sem esse bônus de apresentação.",
      );
      render();
    }
  };
  $("cookieTaskAction").onclick = () =>
    interact(state.task.item, null, controls.open ? "manual" : "scene");
  $("cookieGloves").onclick = () => openModal("gloves");
  $("cookieRemove").onclick = removeTray;
  $("recipeAdvance").onclick = () => {
    if (state.advanceTime()) {
      tell("Fermentação concluída: a massa dobrou de volume.");
      render();
    }
  };
  const stirButton = $("cookieStir");
  const endStir = () => {
    stirring = false;
    stirButton.setAttribute("aria-pressed", "false");
  };
  stirButton.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    stirring = true;
    stirButton.setPointerCapture(e.pointerId);
    stirButton.setAttribute("aria-pressed", "true");
  });
  stirButton.addEventListener("pointerup", endStir);
  stirButton.addEventListener("pointercancel", endStir);
  stirButton.addEventListener("blur", endStir);
  stirButton.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      stirring = true;
      stirButton.setAttribute("aria-pressed", "true");
    }
  });
  stirButton.addEventListener("keyup", (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      endStir();
    }
  });
  $("cookieCollect").onclick = () => interact("wet");
  // Vinte posições com espaçamento suficiente; teclado e toque são equivalentes ao arraste 3D.
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 5; col++) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "cookie-tray-slot";
      b.dataset.x = (0.1 + col * 0.2).toFixed(2);
      b.dataset.y = (0.1 + row * 0.26).toFixed(2);
      b.setAttribute("aria-label", `Posição ${row * 5 + col + 1} da assadeira`);
      b.onclick = () => place(Number(b.dataset.x), Number(b.dataset.y));
      $("cookieTray").append(b);
    }
  modal.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    }
    if (e.key === "Tab" && modal.getAttribute("aria-modal") === "true") {
      const focusables = [
        ...modal.querySelectorAll("button,select,input"),
      ].filter(
        (el) => !el.hidden && !el.disabled && el.getClientRects().length,
      );
      const first = focusables[0],
        last = focusables.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  function render(allowComplete = true) {
    if (!active) return;
    if (state.status === "burnt") {
      stopReason = `${definition.name} passou de ${definition.bake.burn} segundos no forno e queimou. Retire entre ${definition.bake.min} e ${definition.bake.max} segundos.`;
      finish(false);
      return;
    }
    if (state.completed && allowComplete) {
      current.score = state.score;
      finish(true);
      return;
    }
    const t = state.task;
    if (!t) return;
    current.step = t.phase;
    current.score = state.score;
    $("stepTitle").textContent = `Fase ${t.phase + 1}: ${phases[t.phase][0]}`;
    const quantityHint = t.quantity
      ? `${t.quantityRange ? t.quantityRange.join(" a ") : t.quantity} ${t.unit}`
      : "";
    const instruction = `${items[t.item][0]}${quantityHint ? " · " + quantityHint : ""}: ${t.procedure}${t.duration ? " · " + (t.durationRange ? t.durationRange.join("–") : t.duration) + " segundos de ação" : ""}.`;
    if ($("stepHint").textContent !== instruction)
      $("stepHint").textContent = instruction;
    const statusKey = recipe.id + ":" + state.index;
    if (taskPanel.dataset.stepKey !== statusKey) {
      taskPanel.dataset.stepKey = statusKey;
      const status = $("stepHint");
      status.classList.remove("recipe-status-attention");
      void status.offsetWidth;
      status.classList.add("recipe-status-attention");
    }
    $("stepHint").setAttribute("aria-live", "polite");
    $("cookieStir").textContent = t.item.startsWith("half")
      ? "Segure para pressionar e girar"
      : "Segure para misturar · ou mantenha Espaço pressionado";
    $("recipeName").textContent =
      `${definition.emoji} ${definition.name} · receita completa`;
    $("sceneHint").textContent =
      `${items[t.item][2]} ${items[t.item][0]}${t.target ? " → " + items[t.target][0] : ""}`;
    $("score").textContent = `${current.score} pontos`;
    $("stepCount").textContent = `${t.phase + 1} de ${phases.length}`;
    $("progressBar").style.width =
      `${(state.index / state.tasks.length) * 100}%`;
    $("stepList").innerHTML = phases
      .map(
        ([name], i) =>
          `<div class="step ${i < t.phase ? "done" : i === t.phase ? "current" : ""}">${i + 1}. ${name}</div>`,
      )
      .join("");
    $("cookieTaskInstruction").textContent =
      `${items[t.item][0]}: ${t.procedure}.`;
    $("cookieRealTime").textContent =
      t.note ||
      (t.quantity
        ? `${t.quantity} ${t.unit} → ${items[t.target][0]}`
        : "Clique no objeto 3D ou use os botões da bancada.");
    const requiresDrop =
      scene && !controls.open && CookieRecipe.requiresBowlDrop(t);
    $("cookieTaskAction").hidden = state.status !== "ready" || requiresDrop;
    if (requiresDrop)
      $("cookieTaskInstruction").textContent =
        `Arraste ${items[t.item][0]}${quantityHint ? " · " + quantityHint : ""} até ${items[t.target][0]}. O modal abrirá somente após a entrega correta.`;
    $("cookieTaskAction").textContent = `Configurar ${items[t.item][0]}`;
    $("cookieActivity").hidden = state.status !== "running";
    $("cookieStir").hidden = !state.requiresStir;
    $("cookieBaking").hidden = state.status !== "baking";
    $("cookiePortioning").hidden = state.status !== "portion";
    $("recipeAdvance").hidden = state.status !== "running" || !t.allowSkip;
    $("recipeRepeat").hidden = state.status !== "repeat";
    if (state.status === "repeat") {
      $("recipeRepeatCount").textContent =
        `${state.repetitions.length} / ${t.count} · ${t.actionLabel}`;
      if ($("recipeRepeatButtons").dataset.task !== statusKey) {
        $("recipeRepeatButtons").dataset.task = statusKey;
        $("recipeRepeatButtons").replaceChildren();
        for (let i = 0; i < t.count; i++) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "btn";
          button.textContent = `${t.actionLabel} ${i + 1}`;
          button.onclick = () => {
            const result = state.repeat(i);
            tell(result.ok ? "Procedimento correto." : result.message);
            scene?.press?.();
            render();
          };
          $("recipeRepeatButtons").append(button);
        }
      }
      [...$("recipeRepeatButtons").children].forEach(
        (button, i) => (button.disabled = state.repetitions.includes(i)),
      );
    }
    if (state.status === "running") {
      $("cookieActivityProgress").value = Math.min(
        1,
        state.elapsed / state.target,
      );
      $("cookieActivityText").textContent =
        `${Math.min(state.elapsed, state.target).toFixed(1)} / ${state.target} s · ${t.kind === "chill" ? "massa em descanso" : "preparo em andamento"}`;
    }
    if (state.status === "baking") {
      $("cookieBakeState").textContent =
        `${state.elapsed.toFixed(1)} s no forno · meta escolhida: ${state.target} s · ${state.elapsed < definition.bake.min ? "assando" : state.elapsed <= definition.bake.max ? "RETIRE AGORA: ponto ideal" : "retire antes de " + definition.bake.burn + " s!"}`;
      $("cookieGloves").textContent = state.gloves
        ? "✓ Luvas equipadas"
        : "Equipar luvas";
      $("cookieGloves").disabled = state.gloves;
      $("cookieRemove").disabled =
        !state.gloves || state.elapsed < definition.bake.min;
    }
    if (state.status === "portion") {
      $("cookiePortionCount").textContent =
        `${state.portions.length} / ${state.portionGoal} porções · ${state.holding ? "massa na mão" : "colete a próxima porção"}`;
      for (const b of $("cookieTray").children) {
        const used = state.portions.some(
          (p) =>
            Math.hypot(p.x - Number(b.dataset.x), p.y - Number(b.dataset.y)) <
            0.05,
        );
        b.disabled = used;
        b.textContent = used ? "🍪" : "+";
      }
    }
    $("cookieBuff").hidden = recipe.id === "focaccia";
    $("cookieBuff").textContent =
      recipe.id === "lemonade"
        ? "Decoração opcional: fatia de limão + hortelã = +10% na apresentação."
        : state.rested
          ? "❄ Formato Perfeito: +10% na estética (100 → 110 pontos)."
          : "Estética base: 100 pontos. O descanso opcional pode acrescentar 10 pontos.";
    for (const b of controls.querySelectorAll("[data-cookie-item]")) {
      const id = b.dataset.cookieItem;
      b.classList.toggle("is-next", id === t.item);
      b.setAttribute("aria-pressed", String(id === t.item));
      if (ingredientIds.includes(id)) {
        const added = !state.tasks.some(
          (task, index) => index >= state.index && task.item === id,
        );
        b.disabled = added;
        b.classList.toggle("is-used", added);
        b.querySelector("small").textContent =
          items[id][1] + (added ? " · adicionado" : "");
      }
    }
    scene?.sync(state);
  }
  function tick() {
    if (!active) return;
    const now = performance.now(),
      dt = (now - lastTime) / 1000;
    lastTime = now;
    const paused = CookieRecipe.shouldPauseClock(state);
    state.working = stirring;
    state.tick(dt, stirring);
    if (!paused) {
      remainingTime = Math.max(0, remainingTime - dt);
      current.remaining = Math.ceil(remainingTime);
    }
    $("timer").dataset.paused = String(paused);
    renderTimer();
    render();
    if (active && current.remaining <= 0) {
      stopReason =
        "O tempo de jogo acabou. O relógio conta na leitura, nos modais e na movimentação; pausa apenas durante ações temporizadas.";
      finish(false);
    }
  }
  const api = {
    get active() {
      return active;
    },
    start(id = "cookie") {
      if (active) api.stop();
      clearInterval(timerId);
      definition = RecipeCatalog[id] || RecipeCatalog.cookie;
      ({ phases, items } = definition);
      ingredientIds = definition.ingredientIds;
      recipe = RECIPES.find((r) => r.id === definition.id);
      buildInventory();
      state = new Session(definition);
      active = true;
      stopReason = "";
      sceneHooks = null;
      remainingTime = db.settings.seconds;
      current = {
        recipe,
        step: 0,
        score: 0,
        wrong: 0,
        remaining: db.settings.seconds,
        finished: false,
        gameId: null,
      };
      $("intro").classList.add("hidden");
      $("end").classList.add("hidden");
      $("wheelArea").classList.add("hidden");
      $("game").classList.remove("hidden");
      gameRoot.classList.add("cookie-mode");
      $("manual").classList.add("hidden");
      $("dragHint").classList.add("hidden");
      $("fallback").style.display = "none";
      $("threeRoot").style.display = "none";
      $("sceneNavigation").hidden = true;
      controls.open = false;
      sceneRoot.hidden = false;
      controls.hidden = false;
      taskPanel.hidden = false;
      sceneRoot.style.touchAction = "pan-x";
      $("cookieSceneMove").setAttribute("aria-pressed", "false");
      $("cookieSceneMove").textContent = "Arrastar objetos";
      $("cookieMoveMode").setAttribute("aria-pressed", "false");
      $("cookieMoveMode").textContent = "Ativar arraste de objetos";
      try {
        scene =
          recipe.id === "cookie"
            ? new CookieScene(sceneRoot, interact, place, tell, useFallback)
            : new RecipeScene(
                sceneRoot,
                interact,
                place,
                tell,
                useFallback,
                definition,
              );
        scene.onViewChange = positionModal;
        viewportTools.hidden = false;
        $("engine").textContent =
          definition.name + " 3D · procedimentos e tempos";
      } catch (error) {
        scene?.dispose();
        scene = null;
        sceneRoot.textContent =
          "Visualização 3D indisponível. Use os ingredientes e estações abaixo para jogar a receita completa.";
        useFallback();
      }
      tell(
        "As estações já estão preparadas. Consulte a quantidade no status e arraste o primeiro ingrediente ao destino indicado.",
      );
      render();
      lastTime = performance.now();
      timerId = setInterval(tick, 100);
    },
    stop() {
      if (!active) return null;
      const report = state.report();
      active = false;
      clearInterval(timerId);
      closeModal();
      scene?.dispose();
      scene = null;
      sceneRoot.replaceChildren();
      sceneRoot.hidden = true;
      controls.hidden = true;
      viewportTools.hidden = true;
      setExpanded(false);
      taskPanel.hidden = true;
      gameRoot.classList.remove("cookie-mode");
      $("threeRoot").style.display = three ? "" : "none";
      $("fallback").style.display = three ? "none" : "flex";
      $("engine").textContent = three
        ? "Cozinha 3D • Three.js • arraste os itens"
        : "Modo 2D";
      window.dispatchEvent(new Event("resize"));
      return report;
    },
    get endNote() {
      return stopReason;
    },
  };
  window.CookieGame = api;
  renderRecipes();
})();
