/**
 * Tour d'ingresso guidato dallo scroll.
 * render(p) è una funzione pura della posizione (0 → 1): niente timeline nascoste,
 * si può fermare, riprendere, saltare a una tappa. Fuori schermo non gira nulla.
 *
 *  A 0.00–0.10  la tavola si apre (dai margini di carta al pieno schermo)
 *  B 0.06–0.30  ci si avvicina all'esterno, dissolvenza "in avanti" sull'ingresso
 *  C 0.30–0.46  ci si avvicina alla porta, il contorno della porta si traccia in rosso
 *  D 0.46–0.62  la porta diventa una finestra: la soglia si allarga fino a riempire lo schermo
 *  E 0.62–0.76  la soglia, il rilievo si traccia
 *  F 0.74–0.86  una linea di sezione scorre e rivela l'interno
 *  G 0.86–1.00  l'interno, compaiono gli hotspot
 */
import { gsap, ScrollTrigger, hasMotion, scrollToY, EASE_IO, initMotion } from './motion';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const out3 = (t: number) => 1 - Math.pow(1 - t, 3);
const io2 = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** posizioni (p) delle 4 tappe, per i pulsanti e la tastiera */
const STOPS = [0.0, 0.4, 0.7, 0.97];
const TAV_AT = (p: number) => (p < 0.27 ? 0 : p < 0.56 ? 1 : p < 0.8 ? 2 : 3);

function setupHotspots(root: HTMLElement) {
  const btns = Array.from(root.querySelectorAll<HTMLButtonElement>('.hotspot__btn'));
  const close = (except?: HTMLButtonElement) =>
    btns.forEach((b) => {
      if (b === except) return;
      b.setAttribute('aria-expanded', 'false');
      const t = document.getElementById(b.getAttribute('aria-controls') || '');
      if (t) t.hidden = true;
    });
  btns.forEach((b) =>
    b.addEventListener('click', () => {
      const open = b.getAttribute('aria-expanded') === 'true';
      close(b);
      b.setAttribute('aria-expanded', String(!open));
      const t = document.getElementById(b.getAttribute('aria-controls') || '');
      if (t) t.hidden = open;
    }),
  );
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
  return close;
}

export function initTour() {
  const root = document.querySelector<HTMLElement>('[data-tour]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = '1';
  initMotion();
  const closeHotspots = setupHotspots(root);

  const skip = root.querySelector<HTMLAnchorElement>('[data-tour-skip]');
  const target = document.getElementById('il-lab');
  skip?.addEventListener('click', (e) => {
    if (!target) return;
    e.preventDefault();
    scrollToY(target, true);
    const h = target.querySelector<HTMLElement>('h2, [tabindex]') || target;
    if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
    h.focus({ preventScroll: true });
  });

  if (!hasMotion()) return; // versione statica: foto in colonna con descrizioni

  const stage = root.querySelector<HTMLElement>('[data-stage]')!;
  const sheet = root.querySelector<HTMLElement>('.tour__sheet')!;
  const scenes = Array.from(root.querySelectorAll<HTMLElement>('.scene'));
  const plates = scenes.map((s) => s.querySelector<HTMLElement>('[data-plate]')!);
  const lines = scenes.map((s) => Array.from(s.querySelectorAll<SVGPathElement>('.plate__lines path')));
  const doorScene = scenes.findIndex((s) => s.dataset.door);
  const doorRect = root.querySelector<SVGRectElement>('.plate__door rect');
  const hotspots = Array.from(root.querySelectorAll<HTMLElement>('.hotspot'));
  const veil = root.querySelector<HTMLElement>('.plate__veil')!;
  const wipe = root.querySelector<HTMLElement>('.tour__wipe')!;
  const intro = root.querySelector<HTMLElement>('[data-intro]')!;
  const hud = root.querySelector<HTMLElement>('.tour__hud')!;
  const bar = root.querySelector<HTMLElement>('[data-progress]')!;
  const steps = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-step]'));
  const total = scenes.length;

  // ---- geometria ----
  let W = 0,
    H = 0,
    M = { t: 0, r: 0, b: 0, l: 0 };
  const origin: [number, number][] = [];
  let door = { x: 0, y: 0, w: 0, h: 0 };

  function measure() {
    scenes.forEach((s) => (s.style.transform = 'none'));
    const r = stage.getBoundingClientRect();
    W = r.width;
    H = r.height;
    const cs = getComputedStyle(sheet);
    M = { t: parseFloat(cs.top), r: parseFloat(cs.right), b: parseFloat(cs.bottom), l: parseFloat(cs.left) };
    scenes.forEach((s, i) => {
      const pr = plates[i].getBoundingClientRect();
      const [fx, fy] = (s.dataset.focus || '0.5,0.5').split(',').map(Number);
      origin[i] = [pr.left - r.left + fx * pr.width, pr.top - r.top + fy * pr.height];
      s.style.transformOrigin = `${origin[i][0]}px ${origin[i][1]}px`;
      if (i === doorScene) {
        const [dx, dy, dw, dh] = (s.dataset.door || '').split(',').map(Number);
        door = { x: pr.left - r.left + dx * pr.width, y: pr.top - r.top + dy * pr.height, w: dw * pr.width, h: dh * pr.height };
      }
    });
  }

  // ---- disegno del rilievo ----
  const lastD = new Array(total).fill(-1);
  function drawLines(i: number, d: number) {
    const ps = lines[i];
    if (!ps || Math.abs(lastD[i] - d) < 0.002) return;
    lastD[i] = d;
    const n = ps.length;
    const span = 0.62;
    for (let k = 0; k < n; k++) {
      const st = (k / n) * span;
      ps[k].style.strokeDashoffset = String(1 - clamp((d - st) / (1 - span)));
    }
  }

  // ---- stato di caricamento (tracciamento iniziale della prima tavola) ----
  const intro0 = { d: 0, veil: 0.7, lift: 0 };

  const show = (el: HTMLElement, on: boolean) => {
    const v = on ? 'visible' : 'hidden';
    if (el.style.visibility !== v) el.style.visibility = v;
  };

  let current = -1;
  let lastP = 0;

  function render(p: number) {
    lastP = p;
    if (!origin.length) return;
    const a = seg(p, 0, 0.1);
    const ea = io2(a);

    // A — la tavola si apre
    stage.style.clipPath = `inset(${lerp(M.t, 0, ea)}px ${lerp(M.r, 0, ea)}px ${lerp(M.b, 0, ea)}px ${lerp(M.l, 0, ea)}px)`;
    sheet.style.opacity = String(1 - seg(p, 0, 0.04));
    intro.style.opacity = String(1 - seg(p, 0.0, 0.06));
    intro.style.transform = `translateY(${-40 * out3(seg(p, 0, 0.08))}px)`;
    show(intro, p < 0.07);
    const h = seg(p, 0.06, 0.12);
    hud.style.opacity = String(h);
    // resta focalizzabile da tastiera: niente visibility, solo opacità e puntatore
    hud.style.pointerEvents = h > 0.5 ? 'auto' : 'none';
    veil.style.opacity = String(intro0.veil * (1 - seg(p, 0, 0.05)));
    veil.style.transform = `translateY(${-6 * intro0.lift}%) scaleY(${1 - 0.04 * intro0.lift})`;

    // B — esterno: avvicinamento e dissolvenza in avanti
    const s0 = scenes[0];
    const b = out3(seg(p, 0.04, 0.3));
    s0.style.transform = `scale(${lerp(1, 1.5, b)})`;
    const x01 = seg(p, 0.2, 0.3);
    s0.style.opacity = String(1 - x01);
    show(s0, x01 < 1);
    drawLines(0, Math.max(intro0.d, 0));

    // scena 1 — ingresso
    const s1 = scenes[1];
    const c = io2(seg(p, 0.3, 0.46));
    const dD = io2(seg(p, 0.46, 0.64));
    const s1Scale = lerp(1.22, 1, out3(x01)) * lerp(1, 1.55, c) * lerp(1, 2.4, dD);
    s1.style.transform = `scale(${s1Scale})`;
    const s1Out = seg(p, 0.58, 0.63);
    s1.style.opacity = String(x01 * (1 - s1Out));
    show(s1, x01 > 0 && s1Out < 1);
    drawLines(1, seg(p, 0.22, 0.38));
    if (doorRect) doorRect.style.strokeDashoffset = String(1 - seg(p, 0.33, 0.43));

    // D — la porta diventa finestra sulla soglia
    const s2 = scenes[2];
    const dOpen = io2(seg(p, 0.47, 0.62));
    const s2Scale = lerp(1.3, 1, out3(seg(p, 0.46, 0.64))) * lerp(1, 1.07, io2(seg(p, 0.64, 0.76)));
    const s2Shift = lerp(0, -6, io2(seg(p, 0.74, 0.86)));
    s2.style.transform = `translateX(${s2Shift}%) scale(${s2Scale})`;
    const s2On = p >= 0.46;
    s2.style.opacity = s2On ? '1' : '0';
    show(s2, s2On && p < 0.87);
    if (s2On && doorScene === 1) {
      // porta in coordinate schermo (dentro la scena 1 trasformata)…
      const [ox, oy] = origin[1];
      const sx = (x: number) => ox + s1Scale * (x - ox);
      const sy = (y: number) => oy + s1Scale * (y - oy);
      let L = sx(door.x),
        T = sy(door.y),
        R = sx(door.x + door.w),
        B = sy(door.y + door.h);
      // …che si allarga fino al pieno schermo
      L = lerp(L, 0, dOpen);
      T = lerp(T, 0, dOpen);
      R = lerp(R, W, dOpen);
      B = lerp(B, H, dOpen);
      // e riportata nel sistema locale della scena 2 (che ha la sua scala)
      const [px, py] = origin[2];
      const inv = (v: number, o: number) => o + (v - o) / s2Scale;
      const li = inv(L, px),
        ti = inv(T, py),
        ri = inv(R, px),
        bi = inv(B, py);
      s2.style.clipPath = dOpen >= 1 ? 'none' : `inset(${ti}px ${W - ri}px ${H - bi}px ${li}px)`;
    }
    drawLines(2, seg(p, 0.56, 0.72));

    // F — linea di sezione che rivela l'interno
    const s3 = scenes[3];
    const f = io2(seg(p, 0.74, 0.86));
    const x = lerp(W, 0, f);
    wipe.style.transform = `translateX(${x - W}px)`;
    wipe.style.opacity = f > 0 && f < 1 ? '1' : '0';
    s3.style.clipPath = f >= 1 ? 'none' : `inset(0 0 0 ${x}px)`;
    s3.style.opacity = f > 0 ? '1' : '0';
    s3.style.transform = `scale(${lerp(1.04, 1, f) * lerp(1, 1.045, seg(p, 0.86, 1))})`;
    show(s3, f > 0);
    drawLines(3, seg(p, 0.82, 0.95));

    // G — hotspot
    const g = seg(p, 0.9, 0.95);
    hotspots.forEach((hs, k) => {
      const t = clamp(g * 1.6 - k * 0.25);
      hs.style.opacity = String(t);
      hs.style.transform = `scale(${lerp(0.85, 1, out3(t))})`;
      show(hs, t > 0.05);
    });
    if (g < 0.05) closeHotspots();

    // HUD: avanzamento e tappa attiva
    bar.style.transform = `scaleX(${p})`;
    const tav = TAV_AT(p);
    if (tav !== current) {
      current = tav;
      steps.forEach((s, i) => (i === tav ? s.setAttribute('aria-current', 'step') : s.removeAttribute('aria-current')));
    }
  }

  // ---- scroll ----
  root.classList.add('is-live');
  measure();
  const yAt = (p: number) => root.offsetTop + p * (root.offsetHeight - window.innerHeight);
  const st = ScrollTrigger.create({
    trigger: root,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => render(self.progress),
    onRefresh: (self) => {
      measure();
      render(self.progress);
    },
    onToggle: (self) => stage.classList.toggle('is-active', self.isActive),
  });
  measure();
  render(st.progress);

  // ---- tracciamento iniziale: il lucido si solleva ----
  gsap.to(intro0, {
    d: 1,
    duration: 2.0,
    ease: EASE_IO,
    delay: document.documentElement.classList.contains('loading') ? 0.9 : 0.25,
    onUpdate: () => render(lastP),
  });
  gsap.to(intro0, { veil: 0, lift: 1, duration: 1.3, ease: EASE_IO, delay: document.documentElement.classList.contains('loading') ? 2.7 : 2.1, onUpdate: () => render(lastP) });

  // ---- tappe, "Entra" e tastiera ----
  steps.forEach((b, i) =>
    b.addEventListener('click', () => {
      const lenis = window.__dlLenis;
      const y = yAt(STOPS[i]);
      if (lenis) lenis.scrollTo(y, { duration: Math.min(3.2, 0.8 + Math.abs(y - window.scrollY) / 1600), easing: (t) => io2(t) });
      else window.scrollTo(0, y);
    }),
  );
  root.querySelector('[data-tour-enter]')?.addEventListener('click', (e) => {
    e.preventDefault();
    const lenis = window.__dlLenis;
    const y = yAt(STOPS[2]);
    const done = () => steps[2]?.focus({ preventScroll: true });
    if (lenis) lenis.scrollTo(y, { duration: 3.4, easing: (t) => io2(t), onComplete: done });
    else {
      window.scrollTo(0, y);
      done();
    }
  });
  // da tastiera: se il focus arriva sulle tappe quando il tour è ancora chiuso, apri la tavola
  hud.addEventListener('focusin', () => {
    if (lastP < 0.12) {
      const y = yAt(0.12);
      window.__dlLenis ? window.__dlLenis.scrollTo(y, { duration: 0.8 }) : window.scrollTo(0, y);
    }
  });

  // debug/verifica: window.__tour(p) porta il tour a una posizione
  (window as unknown as { __tour: (p: number) => void }).__tour = (p: number) => {
    window.__dlLenis?.scrollTo(yAt(p), { immediate: true });
    window.scrollTo(0, yAt(p));
    render(p);
  };
}
