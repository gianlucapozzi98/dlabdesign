# D-Labdesign — sito

Nuovo sito di **D-Labdesign by Arredamenti Salini**, studio e showroom di design a Treviglio (BG).
Concept: **«Lucido»**. Il sito si apre come una tavola da disegno: su una foto vera dello studio una matita ricalca le linee estratte dalla foto stessa, il lucido si solleva, la tavola si apre e si entra dalla porta fino all'interno. Analisi del riferimento, tre concept e scelta in [`CONCEPT.md`](CONCEPT.md).

Fonti: [`DIREZIONE-ARTISTICA-D-LABDESIGN.md`](DIREZIONE-ARTISTICA-D-LABDESIGN.md) e il sito attuale del cliente (vedi «Dati presi dal sito attuale»). Immagini: [`IMMAGINI.md`](IMMAGINI.md). Crediti: [`CREDITS.md`](CREDITS.md). Screenshot: `docs/screenshots/`.

---

## Stato in breve

- **Pronto da vedere e da far approvare**, non da pubblicare così com'è: mancano le foto definitive del tour, il logo vettoriale, alcuni dati societari e la validazione dei testi legali (elenco più sotto).
- Il tour usa **foto provvisorie vere** dello studio (inaugurazione 2012, Melting Studio), dichiarate come provvisorie nella pagina Il Lab (non nell'hero, per scelta del cliente).
- I moduli **non hanno ancora un backend**: senza `PUBLIC_FORM_ENDPOINT` preparano un'email e lo dicono chiaramente, senza mai scrivere «inviato».

## Comandi

Richiede Node ≥ 22.23.4 (in questa macchina: `~/.local/node-v22.23.5-darwin-arm64/bin`).

```bash
npm install
```

```bash
npm run dev
```
Sviluppo su http://localhost:4321, con il pannello contenuti su http://localhost:4321/keystatic.

```bash
npm run build
```

```bash
npm run verify
```
Controlli automatici sul sito costruito (aggiungi `-- --external` per verificare anche i link esterni).

```bash
npm run tour:trace
```
Rigenera il rilievo a linee dalle foto del tour.

## Stack

Astro 7 + TypeScript · GSAP + ScrollTrigger · Lenis (spento con *riduci movimento*) · SVG con `stroke-dashoffset` · content collections + Keystatic (interfaccia in italiano) · sharp in build (AVIF/WebP) · font self-hosted (Hanken Grotesk, IBM Plex Mono). Niente WebGL e niente 3D: la profondità viene dalla parallasse a strati e dal passaggio attraverso la porta.

```
src/
  components/   Tour, Esploso, ProjectStrip, ContactSheet, Cartiglio, CookieBanner, AppointmentForm…
  content/      progetti/ studi/ news/   ← YAML modificabili da Keystatic
  data/         site.ts (dati del cliente), tour.json, opening.ts, faq.ts
  scripts/      motion.ts (Lenis+GSAP, curve uniche), tour.ts, consent.ts, forms.ts…
  styles/       tokens.css (palette, tipografia, spaziature, curve e durate), global.css
scripts/        trace-tour.mjs (rilievo dalle foto), icons.mjs (favicon), verify.mjs (controlli)
public/         .htaccess, _redirects, _headers, robots.txt, icone
```

## Sostituire le foto del tour (quando arrivano)

1. Salva le 4 foto originali, in ordine dall'esterno all'interno, come `src/assets/tour/tour-01.jpg` … `tour-04.jpg` (lato lungo almeno 2400 px).
2. In `src/data/tour.json` aggiorna, per ogni scena, `alt`, `titolo`, `luogo` e `focus` (il punto verso cui avanza la camera, in frazioni 0–1). Nella scena con la porta aggiorna `door` (`[x, y, larghezza, altezza]` in frazioni): è il rettangolo che diventa la finestra sulla scena successiva. Aggiorna gli `hotspots` dell'interno, con etichette solo su ciò che si vede. Imposta `"provvisorio": false`.
3. Esegui `npm run tour:trace` (aggiungi `-- --debug` per vedere le linee sovrapposte alla foto). Se una zona dà rumore (persone, piante), escludila con `trace.exclude`.
4. Esegui `npm run build` e `npm run verify`.

Se il cliente fornisce panorami 360° o un video di cammino, si aggiunge «Esplora lo studio» con un visualizzatore leggero (Photo Sphere Viewer). Oggi quella pagina non c'è, perché il materiale non c'è.

## Pannello contenuti (Keystatic)

- **In locale**: con `npm run dev`, apri `/keystatic`. Si modificano **Progetti realizzati**, **Studi (non realizzati)** e **News**. I file vengono salvati in `src/content/` e le foto in `src/assets/`.
- **In produzione (modalità GitHub)**:
  1. Metti il progetto su un repository GitHub.
  2. Aggiungi un adapter per l'hosting scelto (per esempio `npx astro add netlify`).
  3. Imposta `KEYSTATIC=true` e `PUBLIC_KEYSTATIC_REPO=owner/nome`.
  4. Crea la GitHub App da `/keystatic` e salva `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET` e `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` (vedi `.env.example`).

  Senza questi passi il sito pubblicato resta statico e il pannello si usa solo in locale.
- Regole già scritte nel pannello: i progetti sono **solo lavori veri**; luogo e anno compaiono solo se compilati (con il consenso del cliente); gli Studi escono **sempre** con l'etichetta «Studio concettuale, non realizzato»; gli slug `casa`, `negozio` e `studi` sono riservati.

## Moduli, analytics, hosting

- **Modulo appuntamento/contatti**: imposta `PUBLIC_FORM_ENDPOINT` (Formspree, Basin, una funzione serverless o il gestionale: POST `multipart/form-data`, con CORS). Il messaggio «Richiesta ricevuta» compare **solo** con una risposta 2xx. Senza endpoint il modulo apre un'email già compilata e lo dice. Il modulo ha un honeypot, rifiuta gli invii troppo rapidi e chiede il consenso privacy obbligatorio. La newsletter è separata: link alla pagina Invionews, con il suo consenso.
- **Analytics**: nessuno attivo. Se servono, `PUBLIC_ANALYTICS_SRC` (consigliato uno strumento senza cookie, come Plausible o Umami) viene caricato **solo** dopo il consenso «Statistiche».
- **Hosting**: il sito è statico (`dist/`). Per i 301 dai vecchi URL, https e www:
  - Apache: `public/.htaccess`, con 301, `www` + `https`, 410 per la vecchia area riservata, cache e header di sicurezza (CSP pronta ma commentata);
  - Netlify o Cloudflare: `public/_redirects` e `_headers`;
  - Vercel: `vercel.json`.

### 301 dai vecchi URL

| Vecchio | Nuovo |
|---|---|
| `/d-labdesign-chi-siamo` | `/il-lab/` |
| `/progetti`, `/progetti/casa`, `/progetti/negozio` | stessi percorsi |
| `/progetti/casa/casa-\|-01` | `/progetti/casa-01/` |
| `/progetti/negozio/negozio-\|-abbigliamento` · `…-tabaccheria` | `/progetti/negozio-abbigliamento/` · `/progetti/negozio-tabaccheria/` |
| `/gallery-inaugurazione/opening/opening`, `/apertura-d-labdesign-chi-c-era` | `/the-opening/` |
| `/video-\|`, `/video-inaugurazione-d---labdesign-a-treviglio` | `/video/` |
| `/contatti-d-labdesign`, `/orari-apertura`, `/iscriviti-alla-newsletter` | `/contatti/` |
| `/il-coraggio-di-osare`, `/news//notte-rosa`, `/news//d-labdesign-al-salone…` | le news corrispondenti |
| altre `/news//…` | `/news/` |
| `/backoffice` (area riservata pubblica) | 410 Gone |

---

## Cosa serve ancora dal cliente

1. **Le 4 foto originali del tour** (`tour-01…04`, dall'esterno all'interno), con autore e diritti. Le foto di Google Foto non si possono incorporare via link. Meglio ancora: **panorami 360°** o un breve **video di cammino** stabilizzato.
2. **Logo vettoriale ufficiale** (SVG o PDF), colori e carattere del marchio. Quello nel sito è una ricostruzione provvisoria.
3. **Pianta e disegni reali** dello showroom e dei progetti (CAD o PDF). Oggi l'unico disegno reale è la pianta a mano di CASA | 01.
4. **Progetti realizzati** oltre ai tre del sito attuale: foto originali ad alta risoluzione, descrizione, materiali, e cosa si può dire su luogo, anno e cliente.
5. **Ragione sociale e forma da usare** (S.r.l. Salini? D-Labdesign come insegna?), **REA**, **capitale sociale**, **PEC**, eventuale socio unico o liquidazione. Oggi sono segnaposto rossi nel footer.
6. **GREEN Project**: che cos'è? Marchi o produttori trattati? Servizi esatti (progettazione, arredo su misura, ristrutturazioni, negozi)?
7. **Orari definitivi**: la domenica è indicata come «da confermare». Come si prendono gli appuntamenti (telefono, modulo, calendario)?
8. **Endpoint del modulo** (dove devono arrivare le richieste) e chi risponde.
9. **Newsletter**: Invionews resta? Chi la manda?
10. **Liberatorie** per le persone riconoscibili nelle foto dell'inaugurazione (oppure foto sostitutive) e conferma dei diritti di Melting Studio.
11. **Persone del Lab** da presentare (con consenso) e una breve intervista su come nasce un progetto.
12. Conferma del **video** YouTube dell'inaugurazione (`s1OqLSYq2kc`) come video ufficiale.
13. Hosting attuale (Apache?) e accesso al DNS, per i 301 e https.

## Dati presi dal sito attuale (non presenti nella direzione artistica): da confermare

Sono pubblicati dal cliente stesso su d-labdesign.it (letto il 22/11/2026). Li ho usati perché non sono inventati, ma vanno confermati:
- Due progetti di **Negozio** (abbigliamento, tabaccheria), con i testi e le foto delle loro pagine. Il nome del negozio di abbigliamento (citato in una vecchia news) **non** è usato.
- **The Opening**: inaugurazione di giovedì 20 settembre 2012, «oltre 200 invitati», media partner Qui Bergamo, catering San Martino, «Foto Melting Studio, Treviglio».
- CASA | 01: «progetto e arredamento realizzati a disegno e prodotti nella nostra falegnameria» (frase della pagina del progetto, usata anche in una FAQ).
- 4 news d'archivio (2012–2017), marcate «Dall'archivio»; il video YouTube; la frase scritta sulla parete d'ingresso (letta dalla foto).

## Testi legali: tutti BOZZE da validare

Ogni pagina legale mostra in alto «BOZZA DA VALIDARE»; i campi mancanti sono evidenziati.
- `/privacy/` — informativa art. 13 GDPR: titolare (da visura), PEC, hosting, fornitore del modulo, tempi di conservazione, base giuridica delle statistiche.
- `/cookie/` — cookie policy secondo le Linee guida del Garante 2021 (strumenti tecnici, contenuti esterni su consenso).
- `/termini/` — note legali: dati societari, condizioni di vendita, preventivo e garanzia (testi del cliente).
- `/accessibilita/` — dichiarazione di accessibilità (verifica con utenti da fare).
- Footer: REA, capitale sociale e PEC come segnaposto.

---

## Verifica (22/11/2026)

**Build**: `astro check` 0 errori, 0 avvisi; `astro build` 24 pagine senza avvisi; `npm run verify` superato (dati, tracciamento, 1369 riferimenti interni, alt, meta, Studi, moduli, file di pubblicazione); link esterni raggiungibili.

**Lighthouse mobile** (Chrome 158, 4G simulato, build di produzione):

| Pagina | Perf. | Access. | Best pr. | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| `/` | 99 | 100 | 100 | 100 | 2,0 s | 0 |
| `/il-lab/` | 98 | 100 | 100 | 100 | 2,4 s | 0 |
| `/progetti/` | 98 | 100 | 100 | 100 | 2,4 s | 0 |
| `/progetti/casa/` | 99 | 100 | 100 | 100 | 2,1 s | 0 |
| `/progetti/negozio/` | 98 | 100 | 100 | 100 | 2,4 s | 0 |
| `/progetti/studi/` | 99 | 100 | 100 | 100 | 2,0 s | 0 |
| `/progetti/casa-01/` | 100 | 100 | 100 | 100 | 1,9 s | 0 |
| `/progetti/negozio-abbigliamento/` | 99 | 100 | 100 | 100 | 2,0 s | 0 |
| `/progetti/negozio-tabaccheria/` | 100 | 100 | 100 | 100 | 1,9 s | 0 |
| `/progetti/studio-01-soglia/` | 99 | 100 | 100 | 100 | 2,0 s | 0 |
| `/the-opening/` | 100 | 100 | 100 | 100 | 0,8 s | 0 |
| `/news/` | 99 | 100 | 100 | 100 | 2,0 s | 0 |
| `/video/` | 100 | 100 | 100 | 100 | 1,7 s | 0 |
| `/contatti/` | 99 | 100 | 100 | 100 | 2,0 s | 0 |
| `/privacy/` · `/cookie/` · `/accessibilita/` | 99–100 | 100 | 100 | 100 | ≤ 2,0 s | 0 |

LCP oscilla di ±0,3 s tra un'esecuzione e l'altra (simulazione Lantern). Come si tiene sotto 2,5 s:
- la prima foto è nel markup, AVIF da ~41 KB, con `fetchpriority=high`;
- il CSS è inline;
- GSAP e Lenis si caricano **dopo** che la prima foto è dipinta;
- le altre foto del tour entrano nel layout solo quando lo script è pronto.

**Prove eseguite** (Chrome headless con Puppeteer e pannello browser):
- **Modulo**:
  - invio vuoto → riepilogo errori con focus e `aria-invalid`;
  - senza endpoint → email preparata, con il testo che lo spiega;
  - endpoint simulato 200 → «Richiesta ricevuta»;
  - endpoint 500 → «La richiesta NON è partita».
- **Consenso**:
  - senza scelta il browser contatta **solo** il dominio del sito (home, video, contatti, the-opening);
  - Accetta e Rifiuta hanno pari evidenza, la × rifiuta;
  - il video si carica solo al clic (youtube-nocookie);
  - «Preferenze cookie» riapre le scelte.
- **Tour**:
  - da tastiera: le tappe sono raggiungibili con Tab, Invio porta alla tappa, focus visibile, «Salta il tour» porta al Lab;
  - al tocco (390 px): lo swipe guida il tour, il tap sulla tappa 04 porta all'interno, il tap sull'hotspot apre la descrizione.
- **Riduci movimento**: niente Lenis né animazioni; il tour diventa 4 foto in colonna con le descrizioni; l'esploso è già aperto; i disegni sono completi.
- **Mobile 360–390 px**: nessuno scorrimento orizzontale. Ho corretto un overflow di 28 px trovato durante la prova al tocco.

Screenshot a 1440 e 390 px, con movimento ridotto e banner cookie: `docs/screenshots/finale/`. Anteprima dell'hero: `docs/screenshots/anteprima-hero/`.

## Conformità e pubblicazione (20 punti)

| # | Punto | Stato |
|---|---|---|
| 1 | Privacy art. 13 | ✅ bozza, campi mancanti evidenziati |
| 2 | Termini / note legali | ✅ bozza; condizioni di vendita dal cliente |
| 3 | Cookie (Garante 2021) | ✅ Accetta/Rifiuta/Personalizza, × = rifiuta, nulla prima del consenso, «Preferenze cookie» nel footer |
| 4 | Dati societari nel footer, P.IVA anche in home | ✅ REA, capitale e PEC come segnaposto |
| 5 | Accessibilità WCAG 2.2 AA + pagina | ✅ Lighthouse 100, tastiera, riduci movimento; test con utenti da fare |
| 6 | CTA «Prenota un appuntamento» in nav, hero e chiusura | ✅ |
| 7 | FAQ con `FAQPage` | ✅ in `/contatti/`, solo risposte vere |
| 8 | Alt descrittivi, decorativi `alt=""`/`aria-hidden` | ✅ |
| 9 | Analytics senza cookie o dopo consenso | ✅ nessuno attivo; predisposto su consenso |
| 10 | Meta title ≤ 60 | ✅ (accorciato in automatico) |
| 11 | Meta description ≤ 155 con CTA | ✅ |
| 12 | Open Graph / Twitter 1200×630 con foto vera | ✅ generata in build dalla foto del cortile |
| 13 | Favicon completa | ⚠️ generata dal logo ricostruito: rigenerare col vettoriale ufficiale (`node scripts/icons.mjs`) |
| 14 | Canonical, www/https, 301, LocalBusiness | ✅ `FurnitureStore` con orari confermati, senza valutazioni |
| 15 | robots.txt | ✅ |
| 16 | sitemap.xml | ✅ (senza 404 né pannello) |
| 17 | 404 a tema | ✅ disegno a linea |
| 18 | Mobile da 360 px, tour al tocco | ✅ |
| 19 | Form: validazione, errori, honeypot, consenso, invio reale | ⚠️ manca solo l'endpoint del cliente; oggi è dichiarato «via email» |
| 20 | Link rotti e prestazioni | ✅ `npm run verify --external`, Lighthouse ≥ 98 |

**Da verificare nel settore**:
- diritti sulle foto (Melting Studio, Google Foto);
- liberatorie per le persone ritratte;
- marchi dei produttori visibili nelle foto: ho escluso quelle più evidenti;
- informazioni ai consumatori e garanzie;
- correttezza delle affermazioni sui materiali: oggi solo i testi del cliente.
