#!/usr/bin/env node
/**
 * Verifica del sito costruito (dist/). Uso: npm run build && npm run verify [-- --external]
 * Controlla: dati coincidenti con la direzione artistica, nessun tracciamento prima del consenso,
 * link interni e ancore, alt delle immagini, meta title/description/canonical/OG,
 * etichette degli Studi, modulo con honeypot e senza falsi "inviato", 301 configurati.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const DIST = path.resolve('dist');
const EXTERNAL = process.argv.includes('--external');
const errors = [];
const warns = [];
const ok = (m) => console.log('  ✓ ' + m);
const fail = (m) => errors.push(m);

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}
const files = await walk(DIST);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const jsFiles = files.filter((f) => f.endsWith('.js'));
const pages = new Map();
for (const f of htmlFiles) pages.set(f, await fs.readFile(f, 'utf8'));
const urlOf = (f) => '/' + path.relative(DIST, f).replace(/index\.html$/, '').replace(/\\/g, '/');
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');

console.log(`\nVerifica di ${htmlFiles.length} pagine HTML\n`);

// 1. Dati della direzione artistica
console.log('1. Dati');
const FATTI = ['01624570162', '0363 301622', '0363 57152', 'info@d-labdesign.it', 'Via M.O. Giulio Setti 7e', '24047', 'Treviglio', 'Via C. Battisti 29'];
for (const [f, h] of pages) {
  if (f.endsWith('404.html')) continue;
  for (const fatto of ['01624570162', '0363 57152', 'info@d-labdesign.it', 'Via M.O. Giulio Setti 7e']) {
    if (!h.includes(fatto)) fail(`${urlOf(f)}: manca «${fatto}» (footer)`);
  }
  const tels = [...h.matchAll(/href="tel:([^"]+)"/g)].map((m) => m[1]);
  for (const t of tels) if (!['+390363301622', '+39036357152'].includes(t)) fail(`${urlOf(f)}: numero di telefono non previsto ${t}`);
  const mails = [...h.matchAll(/href="mailto:([^"?]+)/g)].map((m) => m[1]);
  for (const m of mails) if (m !== 'info@d-labdesign.it') fail(`${urlOf(f)}: email non prevista ${m}`);
}
const home = pages.get(path.join(DIST, 'index.html'));
for (const fatto of FATTI) if (!home.includes(fatto)) fail(`home: manca «${fatto}»`);
if (!/P\.IVA[^<]*01624570162/.test(home)) fail('home: P.IVA non visibile');
for (const segnaposto of ['REA', 'PEC', 'Capitale sociale']) if (!home.includes(segnaposto)) fail(`footer: manca il segnaposto ${segnaposto}`);
ok('P.IVA, telefoni, email e indirizzo presenti e coerenti; REA/PEC/capitale come segnaposto');

// 2. Tracciamento
console.log('2. Nessun tracciamento prima del consenso');
const TRACKERS = /googletagmanager|google-analytics|gtag\(|connect\.facebook|fbq\(|hotjar|clarity\.ms|hs-analytics|doubleclick|matomo\.js|plausible\.io\/js/i;
for (const [f, h] of pages) {
  if (TRACKERS.test(h)) fail(`${urlOf(f)}: script di tracciamento nel markup`);
  if (/<iframe/i.test(strip(h))) fail(`${urlOf(f)}: iframe nel markup iniziale (deve comparire solo dopo il consenso)`);
  const ext = [...h.matchAll(/<script[^>]+src="(https?:[^"]+)"/g)].map((m) => m[1]);
  if (ext.length) fail(`${urlOf(f)}: script esterni ${ext.join(', ')}`);
  const extCss = [...h.matchAll(/<link[^>]+href="(https?:\/\/(?!www\.d-labdesign\.it)[^"]+)"[^>]*rel="stylesheet"/g)].map((m) => m[1]);
  if (extCss.length) fail(`${urlOf(f)}: CSS esterni ${extCss.join(', ')}`);
}
for (const f of jsFiles) {
  const j = await fs.readFile(f, 'utf8');
  if (TRACKERS.test(j)) fail(`${path.basename(f)}: riferimento a tracciamento nel JS`);
}
ok('nessuno script di terzi, nessun iframe prima del consenso, font self-hosted');

// 3. Link interni e ancore
console.log('3. Link interni');
const exists = async (p) => !!(await fs.stat(p).catch(() => null));
const idsOf = (h) => new Set([...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
let nLinks = 0;
const externals = new Set();
for (const [f, h] of pages) {
  const body = strip(h);
  const refs = [...body.matchAll(/\s(?:href|src)="([^"]+)"/g), ...body.matchAll(/\ssrcset="([^"]+)"/g)].flatMap((m) =>
    m[0].includes('srcset') ? m[1].split(',').map((s) => s.trim().split(/\s+/)[0]) : [m[1]],
  );
  for (let r of refs) {
    if (/^(mailto:|tel:|data:|javascript:)/.test(r)) continue;
    if (/^https?:/.test(r)) {
      if (r.startsWith('https://www.d-labdesign.it')) r = r.replace('https://www.d-labdesign.it', '');
      else {
        externals.add(r);
        continue;
      }
    }
    nLinks++;
    const [p0, hash] = r.split('#');
    let target = f;
    if (p0) {
      const clean = decodeURIComponent(p0.split('?')[0]);
      const abs = clean.startsWith('/') ? path.join(DIST, clean) : path.join(path.dirname(f), clean);
      const cands = [abs, path.join(abs, 'index.html'), abs + '.html'];
      let found = null;
      for (const c of cands) if ((await exists(c)) && (await fs.stat(c)).isFile()) found = c;
      if (!found) {
        fail(`${urlOf(f)}: link rotto → ${r}`);
        continue;
      }
      target = found;
    }
    if (hash && target.endsWith('.html')) {
      const th = pages.get(target) ?? (await fs.readFile(target, 'utf8'));
      if (!idsOf(th).has(hash)) fail(`${urlOf(f)}: ancora mancante → ${r}`);
    }
  }
}
ok(`${nLinks} riferimenti interni controllati`);

// 4. Immagini, meta, intestazioni
console.log('4. Accessibilità e SEO di base');
for (const [f, h] of pages) {
  const u = urlOf(f);
  for (const m of strip(h).matchAll(/<img\b[^>]*>/g)) if (!/\salt(=|\s|>|\/)/.test(m[0])) fail(`${u}: <img> senza alt`);
  const title = h.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  const desc = h.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  if (!title) fail(`${u}: manca <title>`);
  if (title.length > 60) warns.push(`${u}: title di ${title.length} caratteri («${title}»)`);
  if (!desc) fail(`${u}: manca la meta description`);
  if (desc.length > 155) warns.push(`${u}: description di ${desc.length} caratteri`);
  if (!f.endsWith('404.html')) {
    if (!/<link rel="canonical" href="https:\/\/www\.d-labdesign\.it\/[^"]*\/?"/.test(h)) fail(`${u}: canonical mancante o errato`);
    if (!/property="og:image" content="https:\/\/www\.d-labdesign\.it\/_astro\/[^"]+\.jpg"/.test(h)) fail(`${u}: og:image mancante`);
  }
  const h1 = (strip(h).match(/<h1\b/g) || []).length;
  if (h1 !== 1) fail(`${u}: ${h1} elementi h1`);
  if (!/<html lang="it"/.test(h)) fail(`${u}: lang mancante`);
  if (!h.includes('class="skip-link"')) fail(`${u}: manca il link «Vai al contenuto»`);
  // il menu mobile deve stare fuori dall'header: il backdrop-filter dell'header lo renderebbe alto 0 px (link non cliccabili)
  const hdr = h.match(/<header\b[^>]*data-header[\s\S]*?<\/header>/)?.[0] ?? '';
  if (!h.includes('data-menu ') && !h.includes('data-menu>')) fail(`${u}: manca il menu mobile`);
  else if (/data-menu[\s>]/.test(hdr)) fail(`${u}: il menu mobile è dentro <header> (risulterebbe invisibile e non cliccabile)`);
}
ok('alt, title, description, canonical, og:image, un solo h1, lingua, skip link, menu mobile fuori dall\'header');

// 5. Contenuti: Studi etichettati, progetti realizzati senza dati inventati
console.log('5. Progetti e Studi');
for (const [f, h] of pages) {
  const u = urlOf(f);
  if (/\/progetti\/studio-/.test(u) && !h.includes('Studio concettuale, non realizzato')) fail(`${u}: studio senza etichetta`);
  if (/\/progetti\/studi\/$/.test(u) && (h.match(/Studio concettuale, non realizzato/g) || []).length < 2) fail(`${u}: etichette degli studi mancanti`);
}
const vm = home.includes('Schema illustrativo');
if (!vm) fail('home: l’esploso non è dichiarato «Schema illustrativo»');
const lab = pages.get(path.join(DIST, 'il-lab', 'index.html')) ?? '';
if (!lab.includes('Foto provvisorie')) warns.push('il-lab: le foto del tour non sono più dichiarate provvisorie (ok solo se sono arrivate le foto definitive)');
ok('studi etichettati, esploso dichiarato schema');

// 6. Moduli
console.log('6. Moduli e consenso');
const contatti = pages.get(path.join(DIST, 'contatti', 'index.html'));
if (!/name="sito_web"/.test(contatti)) fail('contatti: manca l’honeypot');
if (!/name="privacy"[^>]*required/.test(contatti)) fail('contatti: consenso privacy non obbligatorio');
if (/name="newsletter"/.test(contatti)) fail('contatti: la newsletter non deve stare nello stesso consenso');
for (const f of jsFiles) {
  const j = await fs.readFile(f, 'utf8');
  if (/\binviat[oa]\b/i.test(j) && !/NON è partita/.test(j)) warns.push(`${path.basename(f)}: contiene «inviato/a», controllare il contesto`);
}
for (const [f, h] of pages) if (!h.includes('data-cookie-open')) fail(`${urlOf(f)}: manca «Preferenze cookie» nel footer`);
ok('honeypot, consenso obbligatorio, newsletter separata, preferenze cookie ovunque');

// 7. File di pubblicazione
console.log('7. Pubblicazione');
for (const f of ['robots.txt', 'sitemap-index.xml', '404.html', '.htaccess', '_redirects', 'favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'site.webmanifest']) {
  if (!(await exists(path.join(DIST, f)))) fail(`manca ${f}`);
}
const ht = await fs.readFile(path.join(DIST, '.htaccess'), 'utf8');
for (const old of ['d-labdesign-chi-siamo', 'gallery-inaugurazione', 'contatti-d-labdesign', 'video-', 'casa-\\|-01']) if (!ht.includes(old)) fail(`.htaccess: manca il 301 per ${old}`);
const sm = await fs.readFile(path.join(DIST, 'sitemap-0.xml'), 'utf8');
if (/404/.test(sm)) fail('sitemap: contiene la 404');
if (/keystatic/.test(sm)) fail('sitemap: contiene keystatic');
// Vercel con trailingSlash aggiunge prima la barra finale e poi cerca la regola: ogni 301 deve esistere anche con la barra
const vc = JSON.parse(await fs.readFile(path.resolve('vercel.json'), 'utf8'));
const vSrc = new Set((vc.redirects || []).map((r) => r.source));
for (const s of vSrc) if (s !== '/' && !s.endsWith('/') && !vSrc.has(s + '/')) fail(`vercel.json: il redirect ${s} non ha la variante con la barra finale (su Vercel finirebbe in 404)`);
const vHead = JSON.stringify(vc.headers || []);
for (const h of ['X-Content-Type-Options', 'Referrer-Policy', 'X-Frame-Options']) if (!vHead.includes(h)) fail(`vercel.json: manca l'header ${h}`);
ok('robots, sitemap, 404, .htaccess con 301, _redirects, vercel.json (301 con e senza barra, header), icone, manifest');

// 8. Link esterni (opzionale, richiede rete)
if (EXTERNAL) {
  console.log('8. Link esterni');
  for (const u of externals) {
    if (u.includes('youtube-nocookie') || u.includes('openstreetmap.org/export/embed')) continue;
    try {
      const ctrl = AbortSignal.timeout(12000);
      let res = await fetch(u, { method: 'HEAD', redirect: 'follow', signal: ctrl, headers: { 'User-Agent': 'Mozilla/5.0 (link-check)' } });
      if (res.status >= 400) res = await fetch(u, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(12000), headers: { 'User-Agent': 'Mozilla/5.0 (link-check)' } });
      if (res.status >= 400) warns.push(`esterno ${res.status}: ${u}`);
      else console.log(`  ✓ ${res.status} ${u}`);
    } catch (e) {
      warns.push(`esterno non raggiungibile: ${u} (${e.message})`);
    }
  }
}

console.log('');
if (warns.length) console.log('Avvisi:\n' + warns.map((w) => '  ! ' + w).join('\n'));
if (errors.length) {
  console.log('\nERRORI:\n' + errors.map((e) => '  ✗ ' + e).join('\n'));
  process.exit(1);
}
console.log(`\nTutto a posto (${htmlFiles.length} pagine).`);
