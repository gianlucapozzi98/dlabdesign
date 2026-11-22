/**
 * Promessa risolta quando la prima immagine importante è caricata (o al massimo dopo 2,5 s).
 * Le librerie di movimento (GSAP, Lenis) si caricano DOPO: la banda va prima alla foto (LCP).
 */
let p: Promise<void> | null = null;
export function afterFirstImage(): Promise<void> {
  if (p) return p;
  p = new Promise((resolve) => {
    let done = false;
    const img = document.querySelector<HTMLImageElement>('img[fetchpriority="high"]');
    const go = () => {
      if (done) return;
      done = true;
      // dopo la decodifica e il primo disegno della foto.
      // setTimeout e non requestAnimationFrame: rAF è fermo nelle schede in background.
      const after = () => setTimeout(resolve, 60);
      if (img && img.decode) img.decode().then(after, after);
      else after();
    };
    if (!img || img.complete) return go();
    img.addEventListener('load', go, { once: true });
    img.addEventListener('error', go, { once: true });
    setTimeout(go, 2500);
  });
  return p;
}
