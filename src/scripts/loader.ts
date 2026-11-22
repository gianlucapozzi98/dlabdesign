/**
 * Caricamento: una linea che si traccia con l'avanzamento reale (font + prima foto del tour).
 * Massimo ~1,1 s, si salta con un clic o un tasto, una sola volta per sessione.
 * La prima foto è già nel markup: il caricatore non blocca nulla.
 */
export function initLoader() {
  const d = document.documentElement;
  const el = document.querySelector<HTMLElement>('[data-loader]');
  if (!el) return;
  if (!d.classList.contains('loading')) {
    el.remove();
    return;
  }
  const line = el.querySelector<HTMLElement>('[data-line]')!;
  const pct = el.querySelector<HTMLElement>('[data-pct]')!;
  const MAX = 900;
  const t0 = performance.now();
  let loaded = 0;
  let shown = 0;
  let finished = false;

  const img = document.querySelector<HTMLImageElement>('[data-tour] .scene img');
  const steps: Promise<unknown>[] = [
    document.fonts ? document.fonts.ready : Promise.resolve(),
    img && !img.complete
      ? new Promise((r) => {
          img.addEventListener('load', r, { once: true });
          img.addEventListener('error', r, { once: true });
        })
      : Promise.resolve(),
  ];
  steps.forEach((p) => p.then(() => (loaded += 1 / steps.length)));

  function finish() {
    if (finished) return;
    finished = true;
    line.style.transform = 'scaleX(1)';
    pct.textContent = '100';
    el!.classList.add('is-done');
    setTimeout(() => {
      d.classList.remove('loading');
      el!.remove();
    }, 260);
    window.removeEventListener('keydown', finish);
    window.removeEventListener('pointerdown', finish);
  }
  window.addEventListener('keydown', finish);
  window.addEventListener('pointerdown', finish);

  function tick(now: number) {
    if (finished) return;
    const time = (now - t0) / MAX;
    const target = Math.min(1, Math.max(loaded * 0.85, Math.min(time, 0.92)) + (loaded >= 0.999 ? 0.15 : 0));
    shown += (target - shown) * 0.22;
    line.style.transform = `scaleX(${shown})`;
    pct.textContent = String(Math.round(shown * 100)).padStart(2, '0');
    if ((loaded >= 0.999 && shown > 0.97) || now - t0 > MAX) return finish();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
