/** Punto d'ingresso comune a tutte le pagine. Il leggero subito, il movimento dopo la prima foto. */
import { initLoader } from './loader';
import { initConsent } from './consent';
import { afterFirstImage } from './ready';

initLoader();
initConsent();

afterFirstImage().then(async () => {
  const m = await import('./motion');
  m.initMotion();
  m.initDraw();
  m.initReveal();
  m.initInk();
  const c = await import('./cursor');
  c.initCursor();
  requestAnimationFrame(() => m.ScrollTrigger.refresh());
});
