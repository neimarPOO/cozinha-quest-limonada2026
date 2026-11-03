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
  return {
    MIN_SECONDS,
    MAX_SECONDS,
    DEFAULT_SECONDS,
    normalizeDuration,
    isValidDuration,
  };
});
