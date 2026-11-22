/**
 * Movimento condiviso: Lenis + GSAP ScrollTrigger, UNA curva e quattro durate.
 * Le stesse curve sono in CSS (tokens.css): --ease = power3.out, --ease-io = power2.inOut.
 * Con prefers-reduced-motion la classe `motion` su <html> non c'è: niente Lenis, niente animazioni.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export const EASE = 'power3.out';
export const EASE_IO = 'power2.inOut';
export const DUR = { micro: 0.16, ui: 0.32, reveal: 0.64, draw: 1.2 } as const;

declare global {
  interface Window {
    __dlMotion?: boolean;
    __dlLenis?: Lenis | null;
  }
}

export const hasMotion = () => document.documentElement.classList.contains('motion');
const navOffset = () => -(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64) - 8;

export function initMotion() {
  if (window.__dlMotion) return;
  window.__dlMotion = true;
  gsap.defaults({ ease: EASE, duration: DUR.reveal });
  if (!hasMotion()) {
    window.__dlLenis = null;
    return;
  }
  const lenis = new Lenis({
    autoRaf: false,
    lerp: 0.11,
    anchors: { offset: navOffset() },
    stopInertiaOnNavigate: true,
    prevent: (node) => !!node.closest?.('[data-lenis-prevent], dialog, .cookie'),
  });
  window.__dlLenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // se l'utente attiva "riduci movimento" a pagina aperta, fermiamo tutto
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
    if (e.matches) location.reload();
  });
}

export function scrollToY(y: number | HTMLElement, immediate = false) {
  const lenis = window.__dlLenis;
  if (lenis) {
    lenis.scrollTo(y, { offset: typeof y === 'number' ? 0 : navOffset(), immediate, duration: immediate ? 0 : 1.4 });
  } else if (typeof y === 'number') {
    window.scrollTo({ top: y, behavior: 'auto' });
  } else {
    y.scrollIntoView({ block: 'start' });
  }
}

/** Disegni SVG che si tracciano: [data-draw] (con lo scroll) o [data-draw="enter"] (una volta, all'ingresso). */
export function initDraw(root: ParentNode = document) {
  const svgs = root.querySelectorAll<SVGSVGElement>('svg[data-draw]');
  svgs.forEach((svg) => {
    if (svg.dataset.drawReady) return;
    svg.dataset.drawReady = '1';
    if (!hasMotion()) return;
    const shapes = Array.from(
      svg.querySelectorAll<SVGGeometryElement>('path, line, polyline, polygon, rect, circle, ellipse'),
    ).filter((el) => !el.closest('.no-draw') && !el.closest('defs') && !el.closest('pattern'));
    const order = (el: Element) => (el.closest('.q, [data-late]') ? 2 : el.closest('.l2, .l3') ? 1 : 0);
    shapes.sort((a, b) => order(a) - order(b));
    shapes.forEach((el) => {
      el.setAttribute('pathLength', '1');
    });
    const texts = svg.querySelectorAll('text, .draw-fade');
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
    tl.to(shapes, { strokeDashoffset: 0, duration: 1, stagger: { amount: 1.6 } }, 0);
    if (texts.length) tl.to(texts, { opacity: 1, duration: 0.4, stagger: 0.06 }, '>-0.6');
    const mode = svg.dataset.draw;
    if (mode === 'enter') {
      ScrollTrigger.create({
        trigger: svg,
        start: 'top 82%',
        once: true,
        onEnter: () => gsap.to(tl, { progress: 1, duration: DUR.draw * 1.8, ease: EASE_IO }),
      });
    } else {
      ScrollTrigger.create({
        trigger: svg,
        start: svg.dataset.drawStart || 'top 88%',
        end: svg.dataset.drawEnd || 'bottom 45%',
        scrub: 0.6,
        animation: tl,
      });
    }
  });
}

/** Comparse sobrie, una volta sola. */
export function initReveal(root: ParentNode = document) {
  if (!hasMotion()) return;
  const els = root.querySelectorAll<HTMLElement>('[data-reveal]');
  els.forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () =>
        gsap.to(el, { opacity: 1, y: 0, duration: DUR.reveal, ease: EASE, delay: parseFloat(el.dataset.delay || '0') }),
    });
  });
}

/** Testo che si "inchiostra" riga per riga con lo scroll: [data-ink]. */
export function initInk(root: ParentNode = document) {
  if (!hasMotion()) return;
  root.querySelectorAll<HTMLElement>('[data-ink]').forEach((el) => {
    const words = el.querySelectorAll<HTMLElement>('.ink-w');
    if (!words.length) return;
    gsap.fromTo(
      words,
      { color: 'var(--c-matita)' },
      {
        color: 'var(--c-inchiostro)',
        ease: 'none',
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 52%', scrub: 0.5 },
      },
    );
  });
}

export { gsap, ScrollTrigger };
