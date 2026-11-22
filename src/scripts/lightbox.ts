/** Lightbox: link con [data-lb] dentro un contenitore [data-lb-group]. href = immagine grande, data-cap = didascalia. */
export function initLightbox() {
  const dlg = document.querySelector<HTMLDialogElement>('[data-lb-dialog]');
  if (!dlg || dlg.dataset.ready) return;
  dlg.dataset.ready = '1';
  const img = dlg.querySelector<HTMLImageElement>('[data-lb-img]')!;
  const cap = dlg.querySelector<HTMLElement>('[data-lb-cap]')!;
  const iEl = dlg.querySelector<HTMLElement>('[data-lb-i]')!;
  const nEl = dlg.querySelector<HTMLElement>('[data-lb-n]')!;
  let items: HTMLAnchorElement[] = [];
  let idx = 0;
  let opener: HTMLElement | null = null;

  const show = (i: number) => {
    idx = (i + items.length) % items.length;
    const a = items[idx];
    img.src = a.href;
    img.alt = a.querySelector('img')?.alt || '';
    cap.textContent = a.dataset.cap || img.alt;
    iEl.textContent = String(idx + 1);
    nEl.textContent = String(items.length);
    const next = items[(idx + 1) % items.length];
    if (next) new Image().src = next.href;
  };

  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-lb]');
    if (!a) return;
    e.preventDefault();
    const group = a.closest('[data-lb-group]');
    items = Array.from((group || document).querySelectorAll<HTMLAnchorElement>('a[data-lb]'));
    opener = a;
    show(items.indexOf(a));
    dlg.showModal();
    window.__dlLenis?.stop();
  });
  dlg.querySelector('[data-lb-close]')!.addEventListener('click', () => dlg.close());
  dlg.querySelector('[data-lb-prev]')!.addEventListener('click', () => show(idx - 1));
  dlg.querySelector('[data-lb-next]')!.addEventListener('click', () => show(idx + 1));
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) dlg.close();
  });
  dlg.addEventListener('close', () => {
    window.__dlLenis?.start();
    opener?.focus();
  });
  // scorrimento col dito
  let x0 = 0;
  dlg.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
  dlg.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
  });
}
