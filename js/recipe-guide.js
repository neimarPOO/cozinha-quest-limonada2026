/* Orientações de cada fase geradas das próprias quantidades e tempos da receita. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.RecipeGuide = api;
})(globalThis, () => {
  function build(definition, phase) {
    const tasks = definition.tasks.filter((t) => t.phase === phase),
      groups = new Map();
    for (const t of tasks.filter((t) => t.quantity)) {
      const destination = definition.items[t.target]?.[0] || "preparo";
      if (!groups.has(destination)) groups.set(destination, []);
      groups
        .get(destination)
        .push(
          `${t.ingredientName || definition.items[t.item][0]} (${t.quantityRange ? t.quantityRange.join(" a ") : t.quantity} ${t.unit}${t.optional ? ", opcional" : ""})`,
        );
    }
    const ingredients = [...groups]
      .map(
        ([destination, entries]) =>
          `Para ${destination}: ${entries.join("; ")}.`,
      )
      .join(" ");
    const timings = tasks
      .flatMap((t) => {
        if (t.kind === "bake")
          return [
            `Pré-aqueça a ${tasks.find((t) => t.temperature)?.temperature || 180} °C; asse por ${definition.bake.min}–${definition.bake.max} segundos de jogo (${definition.bake.min}–${definition.bake.max} minutos reais). Retire com luvas antes de ${definition.bake.burn} segundos para evitar queimar.`,
          ];
        if (t.kind === "chill") return [t.note];
        if (t.duration)
          return [
            `${t.procedure}: ${t.durationRange ? t.durationRange.join("–") : t.duration} segundos de jogo.${/reais?|minutos?|horas?/.test(t.note || "") ? " " + t.note : ""}`,
          ];
        if (t.kind === "repeat")
          return [`${t.count} ações: ${t.actionLabel.toLowerCase()}.`];
        return [];
      })
      .join(" ");
    const introduction =
      definition.id === "cookie" && phase === 0
        ? "Coloque os ingredientes secos na tigela de secos, misture para distribuir os fermentos e o sal e reserve. Essa mistura será incorporada à tigela de úmidos mais adiante."
        : definition.phases[phase][1];
    return {
      title: definition.phases[phase][0],
      introduction,
      ingredients,
      timing:
        timings ||
        "Sem espera fixa nesta fase: execute o procedimento com cuidado e siga a orientação atual.",
    };
  }
  return { build };
});
