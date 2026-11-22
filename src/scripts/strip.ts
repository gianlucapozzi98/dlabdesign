/**
 * Striscia orizzontale dei progetti.
 * - Schermi larghi E abbastanza alti: fissata, scorre in orizzontale con lo scroll verticale.
 * - Altrimenti (mobile, finestre basse, riduci movimento): scorrimento orizzontale nativo con frecce.
 */
import { gsap, ScrollTrigger, hasMotion, initMotion } from './motion';

/** Deve coincidere con la media query in ProjectStrip.astro */
export const PIN_MQ = '(min-width: 960px) and (min-height: 720px)';

function initArrows(sec: HTMLElement, vp: HTMLElement) {
  const prev = sec.querySelector<HTMLButtonElement>('[data-strip-prev]');
  const next = sec.querySelector<HTMLButtonElement>('[data-strip-next]');
  if (!prev || !next) return;
  const step = () => (vp.querySelector<HTMLElement>('.strip__item')?.offsetWidth ?? 320) + 24;
  const sync = () => {
    prev.disabled = vp.scrollLeft <= 2;
    next.disabled = vp.scrollLeft >= vp.scrollWidth - vp.clientWidth - 2;
  };
  prev.addEventListener('click', () => vp.scrollBy({ left: -step(), behavior: hasMotion() ? 'smooth' : 'auto' }));
  next.addEventListener('click', () => vp.scrollBy({ left: step(), behavior: hasMotion() ? 'smooth' : 'auto' }));
  vp.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync);
  sync();
}

export function initStrip() {
  const sec = document.querySelector<HTMLElement>('[data-strip]');
  if (!sec || sec.dataset.ready) return;
  sec.dataset.ready = '1';
  const track = sec.querySelector<HTMLElement>('[data-strip-track]')!;
  const vp = sec.querySelector<HTMLElement>('[data-strip-viewport]')!;
  initArrows(sec, vp);
  if (!hasMotion()) return;
  initMotion();

  const mm = gsap.matchMedia();
  mm.add(PIN_MQ, () => {
    sec.classList.add('is-pinned');
    const dist = () => Math.max(0, track.scrollWidth - vp.clientWidth);
    const tw = gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: sec.querySelector('.strip__pin'),
        start: 'top top',
        end: () => `+=${dist()}`,
        pin: true,
        scrub: 0.5,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });
    // tastiera: se il focus va su una scheda fuori vista, porta lo scroll lì
    const onFocus = (e: FocusEvent) => {
      const item = (e.target as HTMLElement).closest('.strip__item') as HTMLElement | null;
      const st = tw.scrollTrigger;
      if (!item || !st) return;
      const x = Math.min(dist(), Math.max(0, item.offsetLeft - 40));
      const y = st.start + (x / Math.max(1, dist())) * (st.end - st.start);
      window.__dlLenis ? window.__dlLenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y);
    };
    track.addEventListener('focusin', onFocus);
    return () => {
      sec.classList.remove('is-pinned');
      track.removeEventListener('focusin', onFocus);
      gsap.set(track, { clearProps: 'transform' });
    };
  });
  ScrollTrigger.refresh();
}
