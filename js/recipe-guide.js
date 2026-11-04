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
  function notebook(definition) {
    const ingredients = definition.ingredientIds
      .filter((id) => !["halves", "juice"].includes(id))
      .map((id) => {
        const additions = definition.tasks.filter(
          (t) => t.item === id && t.quantity,
        );
        const min = additions.reduce(
          (n, t) => n + (t.quantityRange?.[0] ?? t.quantity),
          0,
        );
        const max = additions.reduce(
          (n, t) => n + (t.quantityRange?.[1] ?? t.quantity),
          0,
        );
        return {
          name: definition.items[id][0],
          amount: additions.length
            ? `${min === max ? min : min + "–" + max} ${additions[0].unit}`
            : definition.items[id][1],
        };
      });
    const chapters = definition.phases.map(([title], phase) => {
      const guide = build(definition, phase);
      const instructions = definition.tasks
        .filter((t) => t.phase === phase)
        .map((t) => {
          const amount = t.quantity
            ? ` (${t.quantityRange ? t.quantityRange.join("–") : t.quantity} ${t.unit})`
            : "";
          const ingredient = t.ingredientName || definition.items[t.item][0];
          const action =
            t.quantity && /^Adicionar.*(quantidade|tigela)/i.test(t.procedure)
              ? `Adicione ${t.quantityRange ? t.quantityRange.join(" a ") : t.quantity} ${t.unit} de ${ingredient}${t.target ? " na " + definition.items[t.target][0] : ""}.`
              : `${ingredient}${amount}: ${t.procedure}${t.target ? " na " + definition.items[t.target][0] : ""}${t.temperature ? " a " + t.temperature + " °C" : ""}${t.count ? " (" + t.count + " ações)" : ""}.`;
          return (
            action +
            (t.optional ? " Opcional." : "") +
            (t.note ? " " + t.note : "")
          );
        });
      return {
        title,
        introduction: guide.introduction,
        instructions,
        taskIndices: definition.tasks.flatMap((t, index) =>
          t.phase === phase ? [index] : [],
        ),
        timing: guide.timing,
      };
    });
    return { title: definition.name, ingredients, chapters };
  }
  function procedureProgress(definition, state) {
    return definition.tasks.map((task, index) => {
      const entry = state.history?.[index];
      if (
        index >= state.index ||
        !entry ||
        entry.item !== task.item ||
        entry.phase !== task.phase
      )
        return "pending";
      return entry.skipped ? "skipped" : "done";
    });
  }
  return { build, notebook, procedureProgress };
});
