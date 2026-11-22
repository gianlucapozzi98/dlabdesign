/** Header: menu mobile accessibile (Esc, focus trap leggero) e barra che si nasconde scendendo. */
export function initHeader() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header || header.dataset.ready) return;
  header.dataset.ready = '1';
  const btn = header.querySelector<HTMLButtonElement>('[data-menu-btn]')!;
  // il menu è fratello dell'header (vedi Header.astro), non figlio
  const menu = document.querySelector<HTMLElement>('[data-menu]')!;
  const main = document.getElementById('main');

  const focusables = () =>
    [header, menu].flatMap((root) => Array.from(root.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))).filter((el) => el.offsetParent !== null);

  function open(state: boolean) {
    btn.setAttribute('aria-expanded', String(state));
    menu.hidden = !state;
    header!.classList.toggle('is-menu', state);
    // a menu aperto il banner cookie si fa da parte (coprirebbe le ultime voci); torna appena il menu si chiude
    document.documentElement.classList.toggle('menu-aperto', state);
    document.documentElement.style.overflow = state ? 'hidden' : '';
    window.__dlLenis?.[state ? 'stop' : 'start']();
    if (main) main.inert = state;
    const footer = document.querySelector<HTMLElement>('.site-footer');
    if (footer) footer.inert = state;
    if (state) menu.querySelector<HTMLElement>('a')?.focus();
    else btn.focus();
  }
  btn.addEventListener('click', () => open(btn.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) open(false);
  });
  document.addEventListener('keydown', (e) => {
    if (menu.hidden) return;
    if (e.key === 'Escape') open(false);
    if (e.key === 'Tab') {
      const f = focusables();
      const first = f[0],
        last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  matchMedia('(min-width: 1080px)').addEventListener('change', (e) => {
    if (e.matches && !menu.hidden) open(false);
  });

  // nasconde l'header scendendo, lo mostra risalendo (mai mentre il focus è dentro)
  let lastY = window.scrollY;
  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const down = y > lastY + 4;
        const up = y < lastY - 4;
        const inTour = !!document.querySelector('[data-tour] .is-active');
        if (!header.contains(document.activeElement) && menu.hidden) {
          if (down && y > 240 && !inTour) header.classList.add('is-hidden');
          if (up || y < 120 || inTour) header.classList.remove('is-hidden');
        }
        lastY = y;
        ticking = false;
      });
    },
    { passive: true },
  );
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
}
