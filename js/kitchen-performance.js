/* Ajusta somente a resolução interna sob carga; assets e iluminação são preservados. */
window.KitchenPerformance = class KitchenPerformance {
  constructor(nativeRatio) {
    this.nativeRatio = Math.min(1.75, Math.max(1, nativeRatio || 1));
    this.ratio = this.nativeRatio;
    this.mode = 'auto';
    try { if (sessionStorage.getItem('lq_graphics_mode') === 'native') this.mode = 'native'; } catch {}
    this.samples = [];
    this.lastChange = 0;
  }
  setMode(mode) {
    this.mode = mode === 'native' ? 'native' : 'auto';
    this.ratio = this.nativeRatio;
    this.samples.length = 0;
    try { sessionStorage.setItem('lq_graphics_mode', this.mode); } catch {}
    return this.ratio;
  }
  sample(milliseconds, now) {
    if (this.mode !== 'auto' || !Number.isFinite(milliseconds) || milliseconds <= 0 || milliseconds > 10000) return false;
    this.samples.push(milliseconds);
    if (this.samples.length < (milliseconds > 250 ? 4 : 24)) return false;
    const sorted = this.samples.splice(0).sort((a,b)=>a-b);
    const typical = sorted[Math.floor(sorted.length * .75)];
    if (now - this.lastChange < 4000) return false;
    const next = typical > 48 ? Math.max(.75, this.ratio * .85)
      : typical < 23 ? Math.min(this.nativeRatio, this.ratio + .1) : this.ratio;
    if (Math.abs(next-this.ratio) < .01) return false;
    this.ratio = next;
    this.lastChange = now;
    return true;
  }
};
