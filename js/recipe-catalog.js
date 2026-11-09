/* Especificações dos anexos limonada.txt e focaccia.txt; tempos não definidos são adaptações explícitas. */
(function (root, factory) {
  const catalog = factory(
    typeof module === "object" && module.exports
      ? require("./cookie-recipe")
      : root.CookieRecipe,
  );
  if (typeof module === "object" && module.exports) module.exports = catalog;
  else root.RecipeCatalog = catalog;
})(globalThis, ({ cookie }) => {
  const t = (phase, item, procedure, extra = {}) => ({
    phase,
    item,
    procedure,
    ...extra,
  });
  const add = (phase, item, quantity, unit, target, extra = {}) =>
    t(phase, item, "Adicionar a quantidade indicada", {
      quantity,
      unit,
      target,
      ...extra,
    });
  const lemonade = {
    id: "lemonade",
    name: "Limonada especial",
    emoji: "🍋",
    bonusItems: ["slice", "mint"],
    ingredientIds: [
      "lemon",
      "halves",
      "water",
      "white",
      "ice",
      "slice",
      "mint",
    ],
    phases: [
      [
        "Preparo das frutas",
        "Leve os 4 limões juntos à tábua e corte todo o lote com uma única ação: serão 8 metades.",
      ],
      [
        "Limões na jarra",
        "Transfira as 8 metades juntas para a jarra. A extração do lote é automática por 3 segundos no jogo, produzindo aproximadamente 150 ml de suco.",
      ],
      [
        "Base na jarra",
        "Jarra de 1,5 L: suco, 1 L de água gelada e 4–6 colheres de sopa de açúcar.",
      ],
      [
        "Dissolver o açúcar",
        "Misture continuamente por 5–8 segundos até o líquido ficar homogêneo.",
      ],
      ["Gelar a jarra", "Adicione 8–10 cubos de gelo e aguarde 5 segundos."],
      [
        "Servir e decorar",
        "Use 2 cubos extras no copo, preencha 90% e decore opcionalmente com limão e hortelã.",
      ],
    ],
    items: {
      lemon: ["Limões frescos", "4 unidades", "🍋"],
      board: ["Tábua de corte", "Corte transversal", "▤"],
      knife: ["Faca de cozinha", "Um corte em lote · 8 metades", "🔪"],
      wet: ["Jarra de vidro", "Capacidade: 1,5 L", "🫙"],
      water: ["Jarra de água gelada", "1 litro = 1000 ml", "💧"],
      white: ["Açúcar", "4–6 colheres de sopa", "🍚"],
      spoon: ["Colher comprida", "Mistura circular", "🥄"],
      ice: ["Gelo", "8–10 na jarra + 2 no copo", "🧊"],
      bench: ["Bancada fria", "5 segundos de gelamento", "⏱️"],
      glass: ["Copo servidor", "Preencher 90%", "🥛"],
      slice: ["Fatia de limão", "Decoração opcional", "🍋"],
      mint: ["Hortelã", "1 ramo opcional", "🌿"],
    },
    tasks: [],
  };
  lemonade.items.halves = [
    "Metades de limão",
    "8 metades em um único lote",
    "🍋",
  ];
  lemonade.tasks = [
    add(0, "lemon", 4, "unidades", "board"),
    t(0, "knife", "Cortar os 4 limões juntos na tábua", {
      kind: "repeat",
      count: 1,
      target: "board",
      actionLabel: "Cortar os 4 limões de uma vez",
    }),
    add(1, "halves", 8, "metades", "wet", {
      duration: 3,
      procedure: "Adicionar todas as metades à jarra de uma vez",
      note: "Arraste o lote de 8 metades para a jarra em uma única transferência. A animação automática de 3 segundos extrai aproximadamente 150 ml de suco; não é necessário espremer nem adicionar uma metade por vez.",
    }),
    add(2, "water", 1000, "ml", "wet", { ingredientName: "Água gelada", procedure: "Despejar 1 litro de água gelada na jarra de limonada" }),
    add(2, "white", 4, "colheres de sopa", "wet", { quantityRange: [4, 6] }),
    t(3, "spoon", "Misturar em movimentos circulares", {
      duration: 5,
      durationRange: [5, 8],
      target: "wet",
      note: "Segure a ação por 5–8 segundos, até dissolver o açúcar.",
    }),
    add(4, "ice", 8, "cubos", "wet", { quantityRange: [8, 10] }),
    t(4, "bench", "Aguardar a jarra gelar", {
      duration: 5,
      note: "5 segundos no jogo: observe a condensação na jarra.",
    }),
    add(5, "ice", 2, "cubos extras", "glass"),
    add(5, "wet", 90, "% do volume do copo", "glass", {
      duration: 2,
      procedure: "Inclinar a jarra e servir até 90%",
      ingredientName: "Limonada",
      note: "Preencha 90% do copo. A animação de servir dura 2 segundos no jogo.",
    }),
    add(5, "slice", 1, "fatia", "glass", { optional: true }),
    add(5, "mint", 1, "ramo", "glass", { optional: true }),
    t(5, "glass", "Entregar a limonada pronta"),
  ];
  const brownie = {
    id: "brownie",
    name: "Brownie de chocolate",
    emoji: "🍫",
    ingredientIds: [
      "butter",
      "chocolate",
      "white",
      "egg",
      "vanilla",
      "cocoa",
      "flour",
      "salt",
    ],
    phases: [
      [
        "Fôrma e forno",
        "Preaqueça a 180 °C. Unte uma fôrma quadrada de metal de aproximadamente 20 × 20 cm, forre o fundo com papel-manteiga e unte também o papel.",
      ],
      [
        "Manteiga noisette e chocolate",
        "Doure a manteiga em fogo médio até apresentar aroma amendoado. Desligue o fogo, transfira imediatamente para uma tigela e derreta nela o chocolate picado. Reserve.",
      ],
      [
        "Ovos e açúcar: a casquinha",
        "Bata os ovos em temperatura ambiente com o açúcar refinado por cerca de oito minutos, até formar um creme fofo, esbranquiçado e volumoso.",
      ],
      [
        "Massa delicada",
        "Incorpore o chocolate com manteiga aos ovos. Junte a baunilha, peneire farinha, cacau e sal diretamente sobre a mistura e incorpore delicadamente com espátula.",
      ],
      [
        "Assamento",
        "Despeje na fôrma preparada e asse em forno preaquecido a 180 °C por 20–24 minutos. O centro deve permanecer úmido, mas não totalmente líquido.",
      ],
      [
        "Descanso, corte e serviço",
        "Retire com luvas e deixe esfriar por pelo menos duas horas antes de cortar. Assim a estrutura firma e a casquinha permanece crocante.",
      ],
    ],
    items: {
      butter: [
        "Manteiga sem sal",
        "170 g na massa + pequena porção para untar",
        "🧈",
      ],
      chocolate: ["Chocolate amargo 70%", "120 g, picado", "🍫"],
      white: ["Açúcar branco refinado", "200 g, bem fino", "🍚"],
      egg: ["Ovos em temperatura ambiente", "3 unidades", "🥚"],
      vanilla: ["Extrato ou essência de baunilha", "1 colher de chá", "🍶"],
      cocoa: ["Cacau em pó amargo", "40 g", "🍫"],
      flour: ["Farinha de trigo", "60 g", "🌾"],
      salt: ["Sal fino", "1 colher de café", "🧂"],
      dry: [
        "Tigela de chocolate",
        "Reservar manteiga noisette com chocolate",
        "🥣",
      ],
      wet: [
        "Tigela de ovos e massa",
        "Creme de ovos e incorporação delicada",
        "🥣",
      ],
      pan: ["Panela", "Manteiga noisette em fogo médio", "🍳"],
      stove: ["Fogão", "Aquecer e desligar o fogo", "🔥"],
      spoon: ["Colher", "Derreter o chocolate na manteiga quente", "🥄"],
      mixer: ["Batedeira", "Bater ovos com açúcar", "⚙️"],
      spatula: ["Espátula", "Incorporar delicadamente", "🥄"],
      sieve: ["Peneira", "Farinha, cacau e sal sobre a massa", "◌"],
      tray: [
        "Fôrma quadrada 20 × 20 cm",
        "Metal, untada e com papel-manteiga",
        "▦",
      ],
      paper: ["Papel-manteiga", "Forrar o fundo e untar", "▧"],
      oven: ["Forno", "180 °C", "🔥"],
      gloves: ["Luvas térmicas", "Retirar a fôrma quente", "🧤"],
      bench: [
        "Bancada de descanso",
        "Pelo menos 2 horas reais antes do corte",
        "⏱️",
      ],
      knife: ["Faca de corte", "Cortar apenas depois do descanso", "🔪"],
      plate: [
        "Prato de entrega",
        "Brownies com casquinha e centro úmido",
        "🍽️",
      ],
    },
    bake: { min: 20, max: 24, burn: 30 },
    tasks: [],
  };
  brownie.tasks = [
    t(0, "oven", "Pré-aquecer o forno", { temperature: 180 }),
    t(0, "butter", "Untar a fôrma com uma pequena porção de manteiga", {
      target: "tray",
      delivery: true,
      note: "O documento não quantifica a manteiga para untar. Separe uma pequena porção adicional aos 170 g destinados à massa.",
    }),
    t(0, "paper", "Forrar o fundo da fôrma com papel-manteiga", {
      target: "tray",
      delivery: true,
    }),
    t(0, "butter", "Untar também o papel-manteiga", {
      target: "tray",
      delivery: true,
    }),
    add(1, "butter", 170, "g", "pan"),
    t(1, "stove", "Dourar a manteiga em fogo médio", {
      duration: 6,
      note: "Tempo adaptado: 6 segundos no jogo. Na receita real, observe a cor dourada e o aroma amendoado; não há duração fixa. Evite queimar.",
    }),
    t(1, "stove", "Desligar o fogo"),
    t(1, "pan", "Transferir imediatamente a manteiga noisette para a tigela", {
      target: "dry",
      delivery: true,
    }),
    add(1, "chocolate", 120, "g", "dry", {
      note: "Use chocolate amargo com 70% de cacau, picado. O calor da manteiga derrete o chocolate.",
    }),
    t(
      1,
      "spoon",
      "Misturar até derreter completamente o chocolate e reservar",
      {
        target: "dry",
        duration: 4,
        note: "4 segundos no jogo; na cozinha, misture até não restarem pedaços de chocolate.",
      },
    ),
    add(2, "egg", 3, "unidades", "wet", {
      note: "Ovos em temperatura ambiente.",
    }),
    add(2, "white", 200, "g", "wet", {
      note: "Dica do documento: bater levemente o açúcar no liquidificador ou processador para deixá-lo bem fino.",
    }),
    t(2, "mixer", "Bater até obter creme fofo, esbranquiçado e volumoso", {
      target: "wet",
      duration: 8,
      note: "Cerca de 8 minutos reais → 8 segundos no jogo. Esta aeração ajuda a formar a casquinha.",
    }),
    t(
      3,
      "dry",
      "Incorporar a mistura de chocolate e manteiga aos ovos batidos",
      { target: "wet", delivery: true },
    ),
    add(3, "vanilla", 1, "colher de chá", "wet"),
    t(3, "spatula", "Incorporar delicadamente a baunilha e o chocolate", {
      target: "wet",
      duration: 3,
      note: "Tempo de jogo adaptado: 3 segundos. Preserve a aeração do creme.",
    }),
    add(3, "flour", 60, "g", "sieve"),
    add(3, "cocoa", 40, "g", "sieve"),
    add(3, "salt", 1, "colher de café", "sieve"),
    t(3, "sieve", "Peneirar os secos diretamente sobre a massa", {
      target: "wet",
      duration: 3,
      hold: true,
      note: "3 segundos no jogo. Farinha, cacau e sal devem passar pela peneira.",
    }),
    t(3, "spatula", "Incorporar os secos gentilmente, sem bater em excesso", {
      target: "wet",
      duration: 4,
    }),
    t(4, "wet", "Despejar a massa na fôrma preparada", {
      target: "tray",
      delivery: true,
    }),
    t(4, "spatula", "Distribuir a massa na fôrma delicadamente", {
      target: "tray",
      duration: 2,
    }),
    t(4, "tray", "Inserir a fôrma no forno preaquecido", {
      target: "oven",
      delivery: true,
    }),
    t(4, "oven", "Assar mantendo o centro úmido, mas não líquido", {
      kind: "bake",
      note: "20–24 minutos reais → 20–24 segundos no jogo. O limite de 30 segundos para queimar é uma regra do jogo, não um tempo adicional da receita.",
    }),
    t(5, "bench", "Esfriar completamente antes de cortar", {
      duration: 20,
      note: "Pelo menos 2 horas reais → 20 segundos no jogo. Esta espera é obrigatória e não pode ser pulada.",
    }),
    t(5, "knife", "Cortar o brownie já frio em quadrados", {
      target: "tray",
      kind: "repeat",
      count: 4,
      actionLabel: "Fazer o próximo corte",
      note: "Porcionamento adaptado ao jogo: dois cortes em cada direção formam nove quadrados. O documento não define rendimento.",
    }),
    t(5, "plate", "Servir os brownies com casquinha crocante e centro úmido"),
  ];
  return { cookie, lemonade, brownie };
});
