/** Moduli: validazione accessibile, honeypot, invio reale o email preparata (mai "inviato" senza conferma del server). */
type Check = { name: string; test: (f: HTMLFormElement) => boolean; label: string };

const CHECKS: Check[] = [
  { name: 'nome', label: 'Nome e cognome', test: (f) => (f.elements.namedItem('nome') as HTMLInputElement).value.trim().length > 1 },
  {
    name: 'telefono',
    label: 'Telefono',
    test: (f) => /^[+\d][\d\s./-]{5,}$/.test((f.elements.namedItem('telefono') as HTMLInputElement).value.trim()),
  },
  {
    name: 'email',
    label: 'Email',
    test: (f) => {
      const v = (f.elements.namedItem('email') as HTMLInputElement).value.trim();
      return !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    },
  },
  { name: 'privacy', label: 'Consenso privacy', test: (f) => (f.elements.namedItem('privacy') as HTMLInputElement).checked },
];

const errId = (n: string) => `e-${n === 'telefono' ? 'tel' : n}`;

export function initForms() {
  document.querySelectorAll<HTMLFormElement>('[data-aform]').forEach((form) => {
    if (form.dataset.ready) return;
    form.dataset.ready = '1';
    const summary = form.querySelector<HTMLElement>('[data-aform-summary]')!;
    const list = form.querySelector<HTMLElement>('[data-aform-list]')!;
    const status = form.querySelector<HTMLElement>('[data-aform-status]')!;
    const endpoint = form.dataset.endpoint;
    const t0 = Date.now();

    const showField = (c: Check, ok: boolean) => {
      const el = form.elements.namedItem(c.name) as HTMLInputElement;
      const err = form.querySelector<HTMLElement>(`#${errId(c.name)}`);
      el.setAttribute('aria-invalid', String(!ok));
      if (err) err.hidden = ok;
    };
    // validazione al cambio, dopo il primo tentativo
    let tried = false;
    form.addEventListener('input', (e) => {
      if (!tried) return;
      const c = CHECKS.find((k) => k.name === (e.target as HTMLInputElement).name);
      if (c) showField(c, c.test(form));
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      tried = true;
      status.textContent = '';
      delete status.dataset.state;
      const failed = CHECKS.filter((c) => {
        const ok = c.test(form);
        showField(c, ok);
        return !ok;
      });
      if (failed.length) {
        list.replaceChildren(
          ...failed.map((c) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            const el = form.elements.namedItem(c.name) as HTMLElement;
            a.href = `#${el.id || ''}`;
            a.textContent = c.label;
            a.addEventListener('click', (ev) => {
              ev.preventDefault();
              el.focus();
            });
            li.append(a);
            return li;
          }),
        );
        summary.hidden = false;
        summary.focus();
        return;
      }
      summary.hidden = true;

      const data = new FormData(form);
      // honeypot o invio troppo rapido (bot): fingiamo nulla, non inviamo
      if ((data.get('sito_web') as string)?.trim() || Date.now() - t0 < 2500) {
        status.dataset.state = 'error';
        status.textContent = 'Non è stato possibile inviare la richiesta. Riprova tra qualche secondo o chiamaci.';
        return;
      }
      data.delete('sito_web');
      data.append('pagina', location.href);

      if (endpoint) {
        form.setAttribute('aria-busy', 'true');
        status.textContent = 'Invio in corso…';
        try {
          const res = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
          if (!res.ok) throw new Error(String(res.status));
          status.dataset.state = 'ok';
          status.textContent = 'Richiesta ricevuta dallo showroom. Ti richiamiamo per confermare l’appuntamento.';
          form.reset();
        } catch {
          status.dataset.state = 'error';
          status.textContent = 'La richiesta NON è partita (errore di rete o del server). Riprova, oppure chiama lo 0363 57152.';
        } finally {
          form.removeAttribute('aria-busy');
        }
        return;
      }

      // nessun backend: prepariamo l'email e lo diciamo chiaramente
      const lines = [
        `Tipo: ${data.get('tipo')}`,
        `Nome: ${data.get('nome')}`,
        `Telefono: ${data.get('telefono')}`,
        data.get('email') ? `Email: ${data.get('email')}` : '',
        data.get('giorno') ? `Giorno preferito: ${data.get('giorno')}` : '',
        data.get('fascia') ? `Fascia: ${data.get('fascia')}` : '',
        data.get('messaggio') ? `\n${data.get('messaggio')}` : '',
        '\nHo letto l’informativa privacy del sito.',
      ].filter(Boolean);
      const subject = `${data.get('tipo')} — ${data.get('nome')}`;
      const href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
      status.dataset.state = 'ok';
      status.innerHTML = '';
      const p = document.createElement('p');
      p.textContent =
        'Abbiamo preparato l’email: dovrebbe essersi aperto il tuo programma di posta. La richiesta parte solo quando premi «Invia» lì. Se non si è aperto nulla, ';
      const a = document.createElement('a');
      a.href = href;
      a.className = 'link';
      a.textContent = 'apri l’email da qui';
      p.append(a, ' oppure chiama lo 0363 57152.');
      status.append(p);
      window.location.href = href;
    });
  });
}
