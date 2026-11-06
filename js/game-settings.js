(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.GameSettings = api;
})(globalThis, () => {
  const MIN_SECONDS = 180,
    MAX_SECONDS = 1800,
    DEFAULT_SECONDS = 180;
  function normalizeDuration(value) {
    const n = Number(value);
    return Number.isFinite(n)
      ? Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, Math.round(n)))
      : DEFAULT_SECONDS;
  }
  function isValidDuration(value) {
    const n = Number(value);
    return Number.isInteger(n) && n >= MIN_SECONDS && n <= MAX_SECONDS;
  }
  function normalizeSettings(settings = {}) {
    const score = Number(settings.wheelScore);
    return {
      ...settings,
      seconds: normalizeDuration(settings.seconds),
      dailyCap: Number.isInteger(Number(settings.dailyCap)) && Number(settings.dailyCap) >= 0 ? Number(settings.dailyCap) : 15,
      wheelScore: Number.isFinite(score) ? Math.max(0, Math.min(1000, Math.round(score))) : 500,
      wheelMode: settings.wheelMode === "completion" ? "completion" : "score",
    };
  }
  function wheelEligible(settings, game) {
    const rule = normalizeSettings(settings);
    return rule.wheelMode === "completion"
      ? game.completed === true
      : Number.isFinite(Number(game.score)) && Number(game.score) >= rule.wheelScore;
  }
  function wheelRequirement(settings) {
    const rule = normalizeSettings(settings);
    return rule.wheelMode === "completion" ? "Concluir a receita inteira" : `${rule.wheelScore} pontos`;
  }
  return {
    normalizeSettings, wheelEligible, wheelRequirement,
    MIN_SECONDS,
    MAX_SECONDS,
    DEFAULT_SECONDS,
    normalizeDuration,
    isValidDuration,
  };
});
