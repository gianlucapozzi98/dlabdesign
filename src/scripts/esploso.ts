/** Esploso assonometrico: gli strati si separano con lo scroll. */
import { gsap, hasMotion, initMotion } from './motion';

export function initEsploso() {
  initMotion();
  document.querySelectorAll<HTMLElement>('[data-esploso]').forEach((fig) => {
    const svg = fig.querySelector<SVGSVGElement>('svg')!;
    const gap = Number(svg.dataset.gap);
    const layers = Array.from(svg.querySelectorAll<SVGGElement>('.layer'));
    const callouts = Array.from(svg.querySelectorAll<SVGGElement>('.callout'));
    const set = (e: number, c: number) => {
      layers.forEach((g, i) => g.setAttribute('transform', `translate(0 ${(-i * gap * e).toFixed(2)})`));
      callouts.forEach((g, i) => {
        const t = Math.min(1, Math.max(0, c * (layers.length + 1) - (layers.length - 1 - i)));
        g.style.opacity = String(t);
      });
    };
    if (!hasMotion()) return set(1, 1);
    const st = { e: 0, c: 0 };
    set(0, 0);
    const trigger = (fig.closest('[data-esploso-scroll]') as HTMLElement | null) || fig;
    // date-start/end valgono solo quando la sezione è fissata (sticky); altrimenti si apre mentre passa
    const inner = trigger.querySelector<HTMLElement>('.vm__inner');
    const sticky = !!inner && getComputedStyle(inner).position === 'sticky';
    const start = (sticky && trigger.dataset.start) || 'top 70%';
    const end = (sticky && trigger.dataset.end) || 'center 35%';
    gsap
      .timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger, start, end, scrub: 0.6 },
        onUpdate: () => set(st.e, st.c),
      })
      .to(st, { e: 1, duration: 1, ease: 'power2.inOut' })
      .to(st, { c: 1, duration: 0.6 }, 0.55);
  });
}
