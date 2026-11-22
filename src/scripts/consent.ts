/**
 * Consenso cookie. Nulla di esterno si carica prima di una scelta esplicita.
 * La scelta è salvata in localStorage (strumento tecnico necessario) per 6 mesi.
 */
export type Categoria = 'video' | 'mappe' | 'statistiche';
export type Consenso = { v: 1; data: string } & Record<Categoria, boolean>;

const KEY = 'dl-consenso';
const DURATA_MS = 1000 * 60 * 60 * 24 * 182; // 6 mesi

export function leggiConsenso(): Consenso | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Consenso;
    if (c.v !== 1 || Date.now() - Date.parse(c.data) > DURATA_MS) return null;
    return c;
  } catch {
    return null;
  }
}

export function salvaConsenso(scelte: Record<Categoria, boolean>) {
  const c: Consenso = { v: 1, data: new Date().toISOString(), ...scelte };
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* modalità privata: vale per questa pagina */
  }
  (window as unknown as { __dlConsenso?: Consenso }).__dlConsenso = c;
  window.dispatchEvent(new CustomEvent('dl:consenso', { detail: c }));
  return c;
}

export function consensoAttuale(): Consenso | null {
  return (window as unknown as { __dlConsenso?: Consenso }).__dlConsenso ?? leggiConsenso();
}

/** Esegue `cb` subito se la categoria è accettata, oppure appena viene accettata. */
export function quandoConsentito(cat: Categoria, cb: () => void) {
  if (consensoAttuale()?.[cat]) return cb();
  const h = (e: Event) => {
    if ((e as CustomEvent<Consenso>).detail[cat]) {
      window.removeEventListener('dl:consenso', h);
      cb();
    }
  };
  window.addEventListener('dl:consenso', h);
}

/** Accetta una sola categoria (es. "Carica il video") mantenendo le altre scelte. */
export function accettaCategoria(cat: Categoria) {
  const c = consensoAttuale();
  salvaConsenso({ video: c?.video ?? false, mappe: c?.mappe ?? false, statistiche: c?.statistiche ?? false, [cat]: true });
}

function caricaStatistiche() {
  const src = import.meta.env.PUBLIC_ANALYTICS_SRC;
  if (!src || document.querySelector('script[data-analytics]')) return;
  const s = document.createElement('script');
  s.defer = true;
  s.src = src;
  s.dataset.analytics = '';
  const domain = import.meta.env.PUBLIC_ANALYTICS_DOMAIN;
  if (domain) s.dataset.domain = domain;
  document.head.appendChild(s);
}

export function initConsent() {
  const box = document.querySelector<HTMLElement>('[data-cookie]');
  if (!box || box.dataset.ready) return;
  box.dataset.ready = '1';
  const form = box.querySelector<HTMLFormElement>('[data-ck-form]')!;
  const actions = box.querySelector<HTMLElement>('[data-ck-actions]')!;
  const customize = box.querySelector<HTMLButtonElement>('[data-ck="customize"]')!;
  let lastFocus: HTMLElement | null = null;

  const open = (withForm = false) => {
    lastFocus = document.activeElement as HTMLElement;
    const c = consensoAttuale();
    (['video', 'mappe', 'statistiche'] as Categoria[]).forEach((k) => {
      const el = form.elements.namedItem(k) as HTMLInputElement | null;
      if (el) el.checked = !!c?.[k];
    });
    box.hidden = false;
    form.hidden = !withForm;
    customize.setAttribute('aria-expanded', String(withForm));
    actions.hidden = false;
    if (withForm) (form.querySelector('input:not([disabled])') as HTMLElement | null)?.focus();
  };
  const close = () => {
    box.hidden = true;
    if (lastFocus && document.contains(lastFocus) && lastFocus !== document.body) lastFocus.focus();
  };

  box.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-ck]');
    if (!b) return;
    const a = b.dataset.ck;
    if (a === 'accept') {
      salvaConsenso({ video: true, mappe: true, statistiche: true });
      close();
    } else if (a === 'reject') {
      salvaConsenso({ video: false, mappe: false, statistiche: false });
      close();
    } else if (a === 'customize') {
      const show = form.hidden;
      form.hidden = !show;
      customize.setAttribute('aria-expanded', String(show));
      if (show) (form.querySelector('input:not([disabled])') as HTMLElement | null)?.focus();
    }
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = (k: string) => (form.elements.namedItem(k) as HTMLInputElement).checked;
    salvaConsenso({ video: val('video'), mappe: val('mappe'), statistiche: val('statistiche') });
    close();
  });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && consensoAttuale()) close();
  });
  document.querySelectorAll<HTMLElement>('[data-cookie-open]').forEach((b) => b.addEventListener('click', () => open(true)));

  quandoConsentito('statistiche', caricaStatistiche);
  if (!leggiConsenso()) {
    // mostra il banner dopo il primo disegno: non copre il contenuto principale e non sposta il layout
    requestAnimationFrame(() => setTimeout(() => open(false), document.documentElement.classList.contains('loading') ? 1300 : 400));
  } else {
    (window as unknown as { __dlConsenso?: Consenso }).__dlConsenso = leggiConsenso()!;
  }
}
