#!/usr/bin/env node
/**
 * Rilievo dalla foto — estrae le linee principali dalle foto VERE del tour
 * e le salva come SVG "in registro" con la foto (stesso viewBox).
 *
 * Pipeline: scala di grigi → sfocatura leggera → Sobel → soppressione dei
 * non-massimi → soglia con isteresi → trasformata di Hough progressiva
 * (vota solo vicino alla direzione del gradiente) → segmenti lungo le rette
 * → ordinati per lunghezza, con un piccolo "sbordo" agli estremi, come nel
 * disegno a mano.
 *
 * Non altera la foto: legge i pixel e produce solo linee.
 *
 * Uso:  npm run tour:trace            (tutte le scene di src/data/tour.json)
 *       node scripts/trace-tour.mjs tour-02 --debug
 */
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOUR_DIR = path.join(ROOT, 'src/assets/tour');
const CONFIG = path.join(ROOT, 'src/data/tour.json');

const args = process.argv.slice(2);
const only = args.filter((a) => !a.startsWith('--'));
const DEBUG = args.includes('--debug');

const DEFAULTS = {
  work: 900, // larghezza di lavoro in px
  blur: 1.1,
  low: 0.08, // soglie isteresi (frazione del massimo gradiente)
  high: 0.2,
  minLen: 0.055, // lunghezza minima del segmento (frazione della larghezza)
  maxGap: 0.012, // salto massimo dentro un segmento
  maxLines: 90,
  minVotes: 40,
  overshoot: 0.012, // sbordo agli estremi (frazione della larghezza)
  angleSnap: 4, // gradi: rette quasi verticali/orizzontali vengono raddrizzate
};

async function loadGray(file, work) {
  const img = sharp(file).rotate();
  const meta = await img.metadata();
  const W = work;
  const H = Math.round((meta.height / meta.width) * W);
  const { data } = await sharp(file)
    .rotate()
    .resize(W, H)
    .greyscale()
    .blur(DEFAULTS.blur)
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { W, H, data, ow: meta.width, oh: meta.height };
}

function sobel({ W, H, data }) {
  const mag = new Float32Array(W * H);
  const ang = new Float32Array(W * H);
  let max = 0;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const tl = data[i - W - 1], t = data[i - W], tr = data[i - W + 1];
      const l = data[i - 1], r = data[i + 1];
      const bl = data[i + W - 1], b = data[i + W], br = data[i + W + 1];
      const gx = tr + 2 * r + br - tl - 2 * l - bl;
      const gy = bl + 2 * b + br - tl - 2 * t - tr;
      const m = Math.hypot(gx, gy);
      mag[i] = m;
      ang[i] = Math.atan2(gy, gx);
      if (m > max) max = m;
    }
  }
  return { mag, ang, max };
}

function canny({ W, H }, { mag, ang, max }, low, high) {
  const nms = new Float32Array(W * H);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const m = mag[i];
      if (m < low * max) continue;
      let a = (ang[i] * 180) / Math.PI;
      if (a < 0) a += 180;
      let n1, n2;
      if (a < 22.5 || a >= 157.5) { n1 = mag[i - 1]; n2 = mag[i + 1]; }
      else if (a < 67.5) { n1 = mag[i - W - 1]; n2 = mag[i + W + 1]; }
      else if (a < 112.5) { n1 = mag[i - W]; n2 = mag[i + W]; }
      else { n1 = mag[i - W + 1]; n2 = mag[i + W - 1]; }
      if (m >= n1 && m >= n2) nms[i] = m;
    }
  }
  // isteresi
  const edge = new Uint8Array(W * H);
  const stack = [];
  for (let i = 0; i < W * H; i++) if (nms[i] >= high * max) { edge[i] = 1; stack.push(i); }
  while (stack.length) {
    const i = stack.pop();
    for (const d of [-W - 1, -W, -W + 1, -1, 1, W - 1, W, W + 1]) {
      const j = i + d;
      if (j > 0 && j < W * H && !edge[j] && nms[j] >= low * max) { edge[j] = 1; stack.push(j); }
    }
  }
  return edge;
}

function hough({ W, H }, edge, ang, opt) {
  const T = 360; // passo 0,5°
  const diag = Math.ceil(Math.hypot(W, H));
  const R = diag * 2 + 1;
  const cos = new Float32Array(T), sin = new Float32Array(T);
  for (let t = 0; t < T; t++) { const th = (t * Math.PI) / T; cos[t] = Math.cos(th); sin[t] = Math.sin(th); }
  const acc = new Int32Array(T * R);
  const pts = [];
  const WIN = 16; // ±8° attorno alla normale del gradiente
  const vote = (x, y, gi, s) => {
    let a = ang[gi]; if (a < 0) a += Math.PI; if (a >= Math.PI) a -= Math.PI;
    const tc = Math.round((a / Math.PI) * T);
    for (let k = -WIN; k <= WIN; k++) {
      const t = (tc + k + T) % T;
      const r = Math.round(x * cos[t] + y * sin[t]) + diag;
      acc[t * R + r] += s;
    }
  };
  const alive = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (edge[i]) { alive[i] = 1; pts.push(i); vote(x, y, i, 1); }
  }
  const segs = [];
  const minLen = opt.minLen * W, maxGap = opt.maxGap * W;
  let guard = 0;
  while (segs.length < opt.maxLines && guard++ < opt.maxLines * 6) {
    // picco
    let best = -1, bv = 0;
    for (let k = 0; k < acc.length; k++) if (acc[k] > bv) { bv = acc[k]; best = k; }
    if (bv < opt.minVotes) break;
    const t = Math.floor(best / R), r = (best % R) - diag;
    const c = cos[t], s = sin[t];
    // direzione della retta
    const dx = -s, dy = c;
    // punti vivi vicini alla retta, ordinati lungo la direzione
    const near = [];
    for (const i of pts) {
      if (!alive[i]) continue;
      const x = i % W, y = (i / W) | 0;
      if (Math.abs(x * c + y * s - r) <= 1.6) near.push({ i, u: x * dx + y * dy, x, y });
    }
    near.sort((a, b) => a.u - b.u);
    let start = 0, found = false;
    const flush = (a, b) => {
      const seg = near.slice(a, b);
      if (!seg.length) return;
      const len = seg[seg.length - 1].u - seg[0].u;
      // togli i voti di questi punti in ogni caso
      for (const p of seg) { if (alive[p.i]) { alive[p.i] = 0; vote(p.x, p.y, p.i, -1); } }
      if (len >= minLen && seg.length >= len * (opt.density ?? 0.45)) {
        const p0 = seg[0], p1 = seg[seg.length - 1];
        // proietta sulla retta per avere estremi puliti
        const x0 = r * c + p0.u * dx, y0 = r * s + p0.u * dy;
        const x1 = r * c + p1.u * dx, y1 = r * s + p1.u * dy;
        segs.push({ x0, y0, x1, y1, len, theta: (t * 180) / T, votes: seg.length });
        found = true;
      }
    };
    for (let k = 1; k <= near.length; k++) {
      if (k === near.length || near[k].u - near[k - 1].u > maxGap) { flush(start, k); start = k; }
    }
    if (!found) acc[best] = 0; // evita di restare sullo stesso picco
  }
  return segs;
}

function snap(seg, deg) {
  // theta = angolo della normale: ~0/180 → retta verticale, ~90 → orizzontale
  const th = seg.theta;
  if (Math.min(th, 180 - th) <= deg) { const x = (seg.x0 + seg.x1) / 2; return { ...seg, x0: x, x1: x }; }
  if (Math.abs(th - 90) <= deg) { const y = (seg.y0 + seg.y1) / 2; return { ...seg, y0: y, y1: y }; }
  return seg;
}

function toSvg(segs, { W, ow, oh }, opt, scene) {
  const k = ow / W;
  const over = opt.overshoot * W;
  const sorted = [...segs].sort((a, b) => b.len - a.len);
  const nPrimary = Math.max(6, Math.round(sorted.length * 0.3));
  const f = (n) => (n * k).toFixed(1);
  const lines = sorted.map((s0, idx) => {
    const s = snap(s0, opt.angleSnap);
    const L = Math.hypot(s.x1 - s.x0, s.y1 - s.y0) || 1;
    const ux = (s.x1 - s.x0) / L, uy = (s.y1 - s.y0) / L;
    const x0 = s.x0 - ux * over, y0 = s.y0 - uy * over;
    const x1 = s.x1 + ux * over, y1 = s.y1 + uy * over;
    const cls = idx < nPrimary ? 'p' : 's';
    return `  <path class="${cls}" d="M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}"/>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ow} ${oh}" data-scene="${scene}" data-lines="${lines.length}" fill="none">
  <!-- Rilievo dalla foto: linee estratte automaticamente da ${scene}.jpg (scripts/trace-tour.mjs). Non è un disegno di progetto. -->
${lines.join('\n')}
</svg>
`;
}

async function main() {
  const cfg = JSON.parse(await fs.readFile(CONFIG, 'utf8'));
  const scenes = cfg.scenes.filter((s) => !only.length || only.includes(s.id));
  for (const scene of scenes) {
    const file = path.join(TOUR_DIR, `${scene.id}.jpg`);
    const opt = { ...DEFAULTS, ...(scene.trace || {}) };
    const t0 = Date.now();
    const img = await loadGray(file, opt.work);
    const g = sobel(img);
    const edge = canny(img, g, opt.low, opt.high);
    let segs = hough(img, edge, g.ang, opt);
    // escludi zone indicate (es. persone): i segmenti con il centro dentro un rettangolo [x,y,w,h] in frazioni
    if (scene.trace?.exclude) {
      segs = segs.filter((s) => {
        const cx = (s.x0 + s.x1) / 2 / img.W, cy = (s.y0 + s.y1) / 2 / img.H;
        return !scene.trace.exclude.some(([x, y, w, h]) => cx >= x && cx <= x + w && cy >= y && cy <= y + h);
      });
    }
    const svg = toSvg(segs, img, opt, scene.id);
    await fs.writeFile(path.join(TOUR_DIR, `${scene.id}.lines.svg`), svg);
    console.log(`${scene.id}: ${segs.length} linee in ${Date.now() - t0} ms`);
    if (DEBUG) {
      const overlay = Buffer.from(
        svg.replace('fill="none">', 'fill="none"><style>.p{stroke:#ff2d2d;stroke-width:3}.s{stroke:#00e5ff;stroke-width:2}</style>'),
      );
      await sharp(file).composite([{ input: overlay }]).jpeg({ quality: 80 }).toFile(path.join(process.env.TRACE_DEBUG_DIR || TOUR_DIR, `${scene.id}.debug.jpg`));
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
