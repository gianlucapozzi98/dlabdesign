/**
 * Assonometria isometrica minima per disegni a linea in SVG.
 * x → destra-basso, y → sinistra-basso, z → alto.
 */
export const C30 = Math.cos(Math.PI / 6);
export const S30 = 0.5;

export type P3 = [number, number, number];
export const iso = ([x, y, z]: P3): [number, number] => [(x - y) * C30, (x + y) * S30 - z];
const f = (n: number) => +n.toFixed(1);
export const pts = (ps: P3[]) => ps.map((p) => iso(p).map(f).join(',')).join(' ');
export const pathOf = (ps: P3[], close = true) =>
  'M' + ps.map((p) => iso(p).map(f).join(' ')).join('L') + (close ? 'Z' : '');

export type Box = { x: number; y: number; z: number; w: number; d: number; h: number };

/** Facce visibili di un parallelepipedo: superiore, frontale (y = d) e destra (x = w). */
export function faces(b: Box) {
  const { x, y, z, w, d, h } = b;
  const t = z + h;
  return {
    top: [
      [x, y, t],
      [x + w, y, t],
      [x + w, y + d, t],
      [x, y + d, t],
    ] as P3[],
    front: [
      [x, y + d, t],
      [x + w, y + d, t],
      [x + w, y + d, z],
      [x, y + d, z],
    ] as P3[],
    right: [
      [x + w, y, t],
      [x + w, y + d, t],
      [x + w, y + d, z],
      [x + w, y, z],
    ] as P3[],
  };
}

/** Linee parallele dentro una faccia (venature, tratteggi). u,v = lati della faccia come vettori 3D. */
export function hatch(origin: P3, u: P3, v: P3, n: number, jitter = 0, seed = 1): string {
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280 - 0.5) * 2;
  const out: string[] = [];
  for (let i = 1; i < n; i++) {
    const k = i / n + (jitter ? rnd() * jitter : 0);
    const a: P3 = [origin[0] + v[0] * k, origin[1] + v[1] * k, origin[2] + v[2] * k];
    const b: P3 = [a[0] + u[0], a[1] + u[1], a[2] + u[2]];
    // leggera ondulazione: tre segmenti
    const m1: P3 = [a[0] + u[0] * 0.33, a[1] + u[1] * 0.33, a[2] + u[2] * 0.33];
    const m2: P3 = [a[0] + u[0] * 0.66, a[1] + u[1] * 0.66, a[2] + u[2] * 0.66];
    const w = jitter ? rnd() * 1.2 : 0;
    const [ax, ay] = iso(a),
      [bx, by] = iso(b),
      [c1x, c1y] = iso(m1),
      [c2x, c2y] = iso(m2);
    out.push(`M${f(ax)} ${f(ay)}C${f(c1x)} ${f(c1y + w)} ${f(c2x)} ${f(c2y - w)} ${f(bx)} ${f(by)}`);
  }
  return out.join('');
}

export function bbox(points: [number, number][], pad = 20) {
  const xs = points.map((p) => p[0]),
    ys = points.map((p) => p[1]);
  const minX = Math.min(...xs) - pad,
    minY = Math.min(...ys) - pad;
  return { x: f(minX), y: f(minY), w: f(Math.max(...xs) - minX + pad), h: f(Math.max(...ys) - minY + pad) };
}
