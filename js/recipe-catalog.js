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
        "Leve 4 limões à tábua e corte transversalmente: serão 8 metades.",
      ],
      [
        "Extração do suco",
        "Leve as 8 metades juntas ao espremedor e processe o lote para obter aproximadamente 150 ml de suco.",
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
      knife: ["Faca de cozinha", "4 cortes · 8 metades", "🔪"],
      dry: ["Espremedor manual", "Reservatório de 150 ml", "◉"],
      wet: ["Jarra de vidro", "Capacidade: 1,5 L", "🫙"],
      water: ["Água gelada", "1 litro = 1000 ml", "💧"],
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
    t(0, "knife", "Cortar transversalmente no centro", {
      kind: "repeat",
      count: 4,
      target: "board",
      actionLabel: "Cortar o próximo limão",
    }),
    add(1, "halves", 8, "metades", "dry", {
      duration: 3,
      hold: true,
      procedure: "Espremer todas as metades em conjunto",
      note: "Arraste as 8 metades juntas. Pressione e gire por 3 segundos no jogo para obter cerca de 150 ml de suco; depois transfira todo o suco à jarra de uma vez.",
    }),
    add(2, "dry", 150, "ml de suco", "wet", {
      procedure: "Despejar o suco concentrado na jarra",
      ingredientName: "Suco de limão",
    }),
    add(2, "water", 1000, "ml", "wet"),
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
  const focaccia = {
    id: "focaccia",
    name: "Mini focaccia",
    emoji: "🥖",
    ingredientIds: [
      "water",
      "yeast",
      "white",
      "flour",
      "salt",
      "oil",
      "rosemary",
      "coarse",
    ],
    bake: { min: 20, max: 25, burn: 30 },
    phases: [
      [
        "Ativação do fermento",
        "350 ml de água morna, 7 g de fermento biológico e 1 colher de chá de açúcar.",
      ],
      [
        "Preparo da massa",
        "500 g de farinha, 2 colheres de chá de sal, fermento ativado e 20 ml de azeite; misture sem sovar pesado.",
      ],
      [
        "Primeira fermentação",
        "Cubra e deixe em local aquecido: 1 hora real = 30 segundos de jogo, com opção de avançar o tempo.",
      ],
      [
        "Modelagem e segunda fermentação",
        "Unte com 20 ml de azeite, espalhe a massa nos cantos e cubra: 30 minutos reais = 15 segundos no jogo.",
      ],
      [
        "Cavidades e cobertura",
        "Faça cavidades com os dedos; acrescente 20 ml de azeite, 15 g de alecrim e 1 colher de sopa de sal grosso.",
      ],
      [
        "Assamento",
        "Forno a 220 °C. 20–25 minutos reais = 20–25 segundos no jogo; acima de 30 segundos, queima.",
      ],
      [
        "Resfriar, cortar e servir",
        "Retire com luvas e espere 5 minutos reais (5 segundos no jogo) antes de cortar em retângulos.",
      ],
    ],
    items: {
      dry: ["Copo medidor", "Mistura de fermento", "🥛"],
      wet: ["Tigela grande", "Mistura e fermentação", "🥣"],
      water: ["Água morna", "350 ml", "💧"],
      yeast: ["Fermento biológico seco", "7 g", "🥄"],
      white: ["Açúcar", "1 colher de chá", "🍚"],
      flour: ["Farinha de trigo", "500 g", "🌾"],
      salt: ["Sal", "2 colheres de chá", "🧂"],
      oil: ["Azeite de oliva", "60 ml: 20 + 20 + 20", "🫒"],
      spoon: ["Colher de pau", "Mistura inicial", "🥄"],
      spatula: ["Espátula", "Mistura suave", "🥄"],
      cloth: ["Pano de prato", "Cobrir a massa", "▧"],
      bench: ["Bancada aquecida", "Fermentação", "⏱️"],
      tray: ["Assadeira 20 × 30 cm", "Modelar e assar", "▦"],
      hands: ["Mãos limpas e untadas", "Espalhar e pressionar", "✋"],
      rosemary: ["Alecrim fresco", "15 g", "🌿"],
      coarse: ["Sal grosso", "1 colher de sopa", "🧂"],
      oven: ["Forno", "220 °C", "🔥"],
      gloves: ["Luvas térmicas", "Retirar a assadeira", "🧤"],
      knife: ["Faca de pão", "Fatias retangulares", "🔪"],
      plate: ["Prato de entrega", "Focaccia pronta", "🍽️"],
    },
    tasks: [],
  };
  focaccia.tasks = [
    add(0, "water", 350, "ml", "dry"),
    add(0, "yeast", 7, "g", "dry"),
    add(0, "white", 1, "colher de chá", "dry"),
    t(0, "spoon", "Misturar o pré-fermento", { duration: 5, target: "dry" }),
    t(0, "bench", "Aguardar ativação do fermento", {
      duration: 10,
      note: "10 minutos reais → 10 segundos no jogo. Observe a espuma.",
    }),
    add(1, "flour", 500, "g", "wet"),
    add(1, "salt", 2, "colheres de chá", "wet"),
    t(1, "dry", "Transferir o fermento ativado à tigela", {
      target: "wet",
      delivery: true,
    }),
    add(1, "oil", 20, "ml", "wet"),
    t(1, "spatula", "Misturar suavemente sem sovar pesado", {
      duration: 4,
      target: "wet",
      note: "Adaptação: misture por 4 segundos, até a massa ficar pegajosa e homogênea.",
    }),
    t(2, "cloth", "Cobrir a tigela com o pano", {
      target: "wet",
      delivery: true,
    }),
    t(2, "bench", "Fermentar até dobrar de volume", {
      duration: 30,
      allowSkip: true,
      note: "1 hora real → 30 segundos no jogo; Avançar tempo conclui apenas esta espera.",
    }),
    add(3, "oil", 20, "ml", "tray"),
    t(3, "wet", "Transferir a massa crescida à assadeira", {
      target: "tray",
      delivery: true,
    }),
    t(3, "hands", "Espalhar suavemente até os cantos", {
      kind: "repeat",
      count: 4,
      target: "tray",
      actionLabel: "Espalhar a massa em outro canto",
    }),
    t(3, "cloth", "Cobrir novamente a assadeira", {
      target: "tray",
      delivery: true,
    }),
    t(3, "bench", "Aguardar a segunda fermentação", {
      duration: 15,
      note: "30 minutos reais → 15 segundos no jogo.",
    }),
    t(4, "hands", "Pressionar com os dedos limpos e untados", {
      kind: "repeat",
      count: 6,
      target: "tray",
      actionLabel: "Pressionar outro ponto da massa",
    }),
    add(4, "oil", 20, "ml", "tray"),
    add(4, "rosemary", 15, "g", "tray"),
    add(4, "coarse", 1, "colher de sopa", "tray"),
    t(5, "oven", "Pré-aquecer o forno", { temperature: 220 }),
    t(5, "tray", "Abrir o forno e inserir a assadeira", {
      target: "oven",
      delivery: true,
    }),
    t(5, "oven", "Assar até a crosta ficar dourada", {
      kind: "bake",
      note: "20–25 minutos reais → 20–25 segundos no jogo. Use luvas para retirar; acima de 30 segundos, queima.",
    }),
    t(6, "bench", "Aguardar antes de desformar", {
      duration: 5,
      note: "5 minutos reais → 5 segundos no jogo.",
    }),
    t(6, "knife", "Cortar em fatias retangulares", {
      kind: "repeat",
      count: 4,
      target: "tray",
      actionLabel: "Cortar a próxima fatia",
    }),
    t(6, "plate", "Servir as fatias de focaccia"),
  ];
  return { cookie, lemonade, focaccia };
});
