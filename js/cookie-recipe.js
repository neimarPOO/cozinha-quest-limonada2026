/* Receita e regras puras: compartilhadas pelo jogo e pelos testes. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CookieRecipe = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  "use strict";
  const phases = [
    ["Mistura dos secos", "Misture os pós na tigela média e reserve."],
    [
      "Creme de manteiga e açúcares",
      "Use manteiga amaciada, sem derreter; bata até ficar fofo e castanho-claro.",
    ],
    [
      "Ovo e baunilha",
      "Quebre o ovo fora da mistura e emulsione os ingredientes.",
    ],
    [
      "Massa e chocolate",
      "Incorpore os secos aos poucos, sem bater em excesso.",
    ],
    [
      "Descanso opcional",
      "12–24 horas de geladeira equivalem a 10–15 segundos no jogo.",
    ],
    [
      "Porcionamento",
      "Forre a assadeira e distribua porções iguais com espaço para crescer.",
    ],
    [
      "Assamento",
      "Forno preaquecido a 180 °C. 8–10 minutos reais = 8–10 segundos no jogo.",
    ],
    [
      "Resfriar e servir",
      "Aguarde a estrutura firmar: 5 minutos reais = 5 segundos no jogo.",
    ],
  ];
  const items = {
    dry: ["Tigela Secos", "Tigela média", "🥣"],
    wet: ["Tigela Úmidos", "Tigela grande", "🥣"],
    flour: ["Farinha de Trigo", "450 g", "🌾"],
    soda: ["Bicarbonato de Sódio", "5 g", "🧂"],
    powder: ["Fermento em Pó", "5 g", "🥄"],
    salt: ["Sal", "5 g", "🧂"],
    butter: ["Manteiga", "200 g · ponto de pomada", "🧈"],
    brown: ["Açúcar Mascavo", "200 g", "🟤"],
    white: ["Açúcar Branco", "100 g", "🍚"],
    egg: ["Ovo", "1 unidade", "🥚"],
    vanilla: ["Essência de Baunilha", "1 colher de chá", "🧴"],
    chips: ["Gotas de Chocolate", "350 g", "🍫"],
    spoon: ["Colher", "Mistura dos secos", "🥄"],
    mixer: ["Batedeira", "Creme e emulsão", "🌀"],
    spatula: ["Espátula", "Incorporação delicada", "🥄"],
    tray: ["Assadeira Plana", "Até 20 cookies", "▦"],
    paper: ["Papel-Manteiga", "Forrar a assadeira", "📜"],
    fridge: ["Geladeira", "Descanso opcional", "❄️"],
    oven: ["Forno", "180 °C", "🔥"],
    gloves: ["Luvas Térmicas", "Proteção ao retirar", "🧤"],
    bench: ["Bancada", "Resfriamento", "⏱️"],
    plate: ["Prato de Entrega", "Servir", "🍽️"],
  };
  const task = (phase, item, procedure, extra = {}) => ({
    phase,
    item,
    procedure,
    ...extra,
  });
  const add = (
    phase,
    item,
    quantity,
    unit,
    target,
    procedure = "Adicionar a quantidade da receita",
  ) => task(phase, item, procedure, { quantity, unit, target });
  const tasks = [
    add(0, "flour", 450, "g", "dry"),
    add(0, "soda", 5, "g", "dry"),
    add(0, "powder", 5, "g", "dry"),
    add(0, "salt", 5, "g", "dry"),
    task(0, "spoon", "Misturar e reservar os secos", {
      duration: 3,
      target: "dry",
      note: "Misture os pós por 3 s no jogo, até distribuir os fermentos e o sal.",
    }),
    add(1, "butter", 200, "g", "wet", "Adicionar amaciada, em ponto de pomada"),
    add(1, "brown", 200, "g", "wet"),
    add(1, "white", 100, "g", "wet"),
    task(1, "mixer", "Bater até formar um creme fofo", {
      duration: 4,
      target: "wet",
      note: "No jogo: 4 s. Na cozinha, observe o creme fofo e mais claro; o tempo varia conforme a batedeira.",
    }),
    add(
      2,
      "egg",
      1,
      "unidade",
      "wet",
      "Quebrar fora da tigela e adicionar sem casca",
    ),
    add(2, "vanilla", 1, "colher de chá", "wet"),
    task(2, "mixer", "Bater para emulsionar", {
      duration: 3,
      target: "wet",
      note: "No jogo: 3 s. Bata apenas até incorporar o ovo e a baunilha.",
    }),
    task(3, "dry", "Incorporar os secos aos poucos", {
      target: "wet",
      note: "Use a mistura reservada; incorpore gradualmente à tigela grande.",
    }),
    task(3, "spatula", "Dobrar delicadamente até homogeneizar", {
      duration: 3,
      target: "wet",
      note: "No jogo: 3 s. Após adicionar farinha, evite bater em excesso.",
    }),
    add(3, "chips", 350, "g", "wet"),
    task(3, "spatula", "Distribuir as gotas sem bater em excesso", {
      duration: 2,
      target: "wet",
    }),
    task(4, "fridge", "Resfriar a massa", {
      kind: "chill",
      target: "fridge",
      note: "Opcional: 12–24 h reais → 10–15 s de jogo. Bônus Formato Perfeito: +10% somente na estética. Pular não bloqueia a receita.",
    }),
    task(5, "paper", "Forrar a assadeira com papel-manteiga", {
      target: "tray",
    }),
    task(5, "wet", "Porcionar bolinhas uniformes e espaçadas", {
      kind: "portion",
      target: "tray",
      note: "Escolha de 4 a 20 porções para esta rodada. Colete uma porção na massa e posicione na assadeira; deixe espaço para crescer.",
    }),
    task(6, "oven", "Pré-aquecer o forno", { temperature: 180 }),
    task(6, "tray", "Abrir o forno e inserir a assadeira", { target: "oven" }),
    task(6, "oven", "Assar e observar as bordas", {
      kind: "bake",
      note: "8–10 min reais → 8–10 s no jogo. Retire com luvas entre 8 e 10 s; de 10 a 15 s, perde maciez; acima de 15 s, queima.",
    }),
    task(7, "bench", "Deixar firmar antes de mover", {
      duration: 5,
      note: "5 min de resfriamento reais → 5 s no jogo. Cookies quentes ainda estão frágeis.",
    }),
    task(7, "plate", "Transferir com cuidado e servir"),
  ];
  class Session {
    constructor(definition = null) {
      this.definition = definition || {
        id: "cookie",
        name: "Cookies de chocolate",
        phases,
        items,
        tasks,
        bake: { min: 8, max: 10, burn: 15 },
        ingredientIds: [
          "flour",
          "soda",
          "powder",
          "salt",
          "butter",
          "brown",
          "white",
          "egg",
          "vanilla",
          "chips",
        ],
      };
      this.tasks = this.definition.tasks;
      this.history = [];
      this.repetitions = [];
      this.index = 0;
      this.status = "ready";
      this.elapsed = 0;
      this.rested = false;
      this.gloves = false;
      this.portions = [];
      this.portionGoal = 8;
      this.penalties = 0;
      this.bakeQuality = null;
      this.completed = false;
      this.holding = false;
    }
    get task() {
      return this.tasks[this.index];
    }
    get score() {
      return Math.max(
        0,
        this.completed
          ? 800 +
              (!this.definition.bake || this.bakeQuality === "ideal"
                ? 100
                : 50) +
              this.aesthetics -
              this.penalties
          : Math.floor((this.index / this.tasks.length) * 800) - this.penalties,
      );
    }
    get aesthetics() {
      const garnish = this.definition.bonusItems?.every((id) =>
        this.history.some((h) => h.item === id && !h.skipped),
      );
      return Math.round(100 * (this.rested || garnish ? 1.1 : 1));
    }
    reject(message) {
      this.penalties += 5;
      return { ok: false, message };
    }
    configure(values) {
      if (this.status !== "ready" || !this.task)
        return { ok: false, message: "Aguarde a ação atual." };
      const t = this.task;
      if (values.procedure !== t.procedure)
        return this.reject("Confira o procedimento desta etapa.");
      if (t.quantity) {
        const quantity = Number(values.quantity),
          range = t.quantityRange || [t.quantity, t.quantity];
        if (
          !Number.isFinite(quantity) ||
          quantity < range[0] ||
          quantity > range[1] ||
          (t.integer !== false && !Number.isInteger(quantity))
        )
          return this.reject(
            `A receita pede ${range[0] === range[1] ? range[0] : range.join(" a ")} ${t.unit}.`,
          );
      }
      if (t.temperature && Number(values.temperature) !== t.temperature)
        return this.reject(`Pré-aqueça a ${t.temperature} °C.`);
      let duration = Number(values.duration);
      if (
        t.duration &&
        (!Number.isFinite(duration) ||
          duration < (t.durationRange?.[0] || t.duration) ||
          duration > (t.durationRange?.[1] || t.duration))
      )
        return this.reject(
          `Nesta adaptação, use ${t.durationRange ? t.durationRange.join(" a ") : t.duration} segundos.`,
        );
      if (
        t.kind === "chill" &&
        (!Number.isInteger(duration) || duration < 10 || duration > 15)
      )
        return this.reject("Escolha de 10 a 15 segundos para o descanso.");
      if (
        t.kind === "bake" &&
        (!Number.isInteger(duration) ||
          duration < this.definition.bake.min ||
          duration > this.definition.bake.max)
      )
        return this.reject(
          `Escolha de ${this.definition.bake.min} a ${this.definition.bake.max} segundos para o assamento.`,
        );
      this.pending = {
        item: t.item,
        quantity: t.quantity ? Number(values.quantity) : undefined,
        duration,
        procedure: t.procedure,
      };
      if (t.kind === "repeat") {
        this.status = "repeat";
        this.repetitions = [];
        return { ok: true };
      }
      if (t.kind === "portion") {
        const n = Number(values.portions);
        if (!Number.isInteger(n) || n < 4 || n > 20)
          return this.reject("Escolha de 4 a 20 porções.");
        this.portionGoal = n;
        this.status = "portion";
        return { ok: true };
      }
      if (t.kind === "bake") {
        this.target = duration;
        this.elapsed = 0;
        this.status = "baking";
        return { ok: true };
      }
      if (t.duration || t.kind === "chill") {
        this.target = duration;
        this.elapsed = 0;
        this.status = "running";
        return { ok: true };
      }
      this.advance();
      return { ok: true };
    }
    skipChill() {
      if (this.task?.kind !== "chill" || this.status !== "ready") return false;
      this.pending = { item: this.task.item, skipped: true };
      this.advance();
      return true;
    }
    skipOptional() {
      if (
        this.status !== "ready" ||
        (!this.task?.optional && this.task?.kind !== "chill")
      )
        return false;
      this.pending = { item: this.task.item, skipped: true };
      this.advance();
      return true;
    }
    advanceTime() {
      if (this.status !== "running" || !this.task?.allowSkip) return false;
      this.tick(this.target - this.elapsed, true);
      return true;
    }
    repeat(position) {
      if (this.status !== "repeat") return { ok: false };
      if (this.repetitions.includes(position))
        return this.reject("Use outro ponto.");
      this.repetitions.push(position);
      if (this.repetitions.length >= this.task.count) this.advance();
      return { ok: true };
    }
    advance() {
      this.history.push({
        ...this.pending,
        item: this.task?.item,
        phase: this.task?.phase,
      });
      this.pending = null;
      this.index++;
      this.elapsed = 0;
      this.status = this.index === this.tasks.length ? "complete" : "ready";
      this.completed = this.status === "complete";
    }
    get requiresStir() {
      return (
        this.status === "running" &&
        (this.task?.hold || ["spoon", "spatula"].includes(this.task?.item))
      );
    }
    tick(seconds, working = false) {
      if (!Number.isFinite(seconds) || seconds < 0) return;
      if (this.status !== "running" && this.status !== "baking") return;
      if (this.requiresStir && !working) return;
      this.elapsed += seconds;
      if (this.status === "baking") {
        if (this.elapsed > this.definition.bake.burn) {
          this.status = "burnt";
          this.bakeQuality = "burnt";
        }
        return;
      }
      if (this.elapsed >= this.target) {
        if (this.task.kind === "chill") this.rested = true;
        this.advance();
      }
    }
    collect() {
      if (this.status !== "portion") return false;
      this.holding = true;
      return true;
    }
    place(x, y) {
      if (this.status !== "portion" || !this.holding)
        return { ok: false, message: "Colete uma porção de massa primeiro." };
      if (
        ![x, y].every(Number.isFinite) ||
        x < 0.06 ||
        x > 0.94 ||
        y < 0.06 ||
        y > 0.94
      )
        return {
          ok: false,
          message: "Mantenha as porções dentro da assadeira.",
        };
      if (this.portions.some((p) => Math.hypot(p.x - x, p.y - y) < 0.19))
        return this.reject(
          "Muito perto! Deixe mais espaço para os cookies crescerem.",
        );
      this.portions.push({ x, y });
      this.holding = false;
      if (this.portions.length === this.portionGoal) this.advance();
      return { ok: true };
    }
    equipGloves() {
      if (this.status !== "baking") return false;
      this.gloves = true;
      return true;
    }
    removeTray() {
      if (this.status !== "baking")
        return { ok: false, message: "O forno não está assando." };
      if (!this.gloves)
        return {
          ok: false,
          message: "Equipe as luvas térmicas antes de retirar.",
        };
      if (this.elapsed < this.definition.bake.min)
        return {
          ok: false,
          message: `Ainda está cru. Aguarde pelo menos ${this.definition.bake.min} segundos.`,
        };
      this.bakeQuality =
        this.elapsed <= this.definition.bake.max ? "ideal" : "dry";
      this.advance();
      return { ok: true };
    }
    report() {
      return {
        version: 1,
        recipeId: this.definition.id,
        recipeName: this.definition.name,
        phases: this.definition.phases.length,
        ingredients: this.history
          .filter((h) => h.quantity)
          .map((h) => ({ item: h.item, quantity: h.quantity })),
        portions: this.portions.length,
        rested: this.rested,
        aesthetics: this.aesthetics,
        bakeQuality: this.bakeQuality,
        penalties: this.penalties,
      };
    }
  }
  const requiresBowlDrop = (task) =>
    Boolean(
      task?.quantity ||
        task?.delivery ||
        (task?.item === "dry" && task?.target === "wet"),
    );
  const shouldPauseClock = (session) =>
    session.status === "running" || session.status === "baking";
  const cookie = {
    id: "cookie",
    name: "Cookies de chocolate",
    emoji: "🍪",
    phases,
    items,
    tasks,
    ingredientIds: [
      "flour",
      "soda",
      "powder",
      "salt",
      "butter",
      "brown",
      "white",
      "egg",
      "vanilla",
      "chips",
    ],
    bake: { min: 8, max: 10, burn: 15 },
  };
  const contextMode = (session, id) => {
    if (!session || !id) return null;
    if (session.status === "ready" && session.task?.item === id) return "task";
    if (session.status === "baking" && id === "gloves" && !session.gloves)
      return "gloves";
    return null;
  };
  return {
    contextMode,
    phases,
    items,
    tasks,
    Session,
    requiresBowlDrop,
    shouldPauseClock,
    cookie,
  };
});
