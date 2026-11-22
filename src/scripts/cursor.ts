/** Cursore a "mirino": solo desktop (puntatore fine), solo sopra elementi interattivi. Il cursore di sistema resta. */
import { gsap, hasMotion, EASE } from './motion';

export function initCursor() {
  if (!hasMotion() || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const el = document.querySelector<HTMLElement>('[data-cursor-el]');
  if (!el || el.dataset.ready) return;
  el.dataset.ready = '1';
  const xTo = gsap.quickTo(el, 'x', { duration: 0.32, ease: EASE });
  const yTo = gsap.quickTo(el, 'y', { duration: 0.32, ease: EASE });
  const SEL = 'a[href], button:not([disabled]), [data-cursor], summary, label[for], select, input[type="checkbox"], input[type="radio"]';
  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      xTo(e.clientX);
      yTo(e.clientY);
    },
    { passive: true },
  );
  document.addEventListener('pointerover', (e) => {
    const t = (e.target as Element).closest?.(SEL);
    el.classList.toggle('is-on', !!t);
  });
  document.addEventListener('pointerleave', () => el.classList.remove('is-on'));
  window.addEventListener('pointerdown', () => el.classList.add('is-down'));
  window.addEventListener('pointerup', () => el.classList.remove('is-down'));
}
