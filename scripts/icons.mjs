#!/usr/bin/env node
/** Genera favicon e icone dal marchio vettoriale (provvisorio) in public/. */
import sharp from 'sharp';
import fs from 'node:fs/promises';
const D = 'M175 8H300A190 227 0 0 1 300 462H175Z';
const S = 'M324 70C300 104 281 160 302 213C322 263 353 302 336 351C328 373 314 389 299 400';
const square = (bg, fg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${bg}"/>
  <g transform="translate(256 256) scale(0.82) translate(-333 -235)"><path d="${D}" fill="${fg}"/><path d="${S}" fill="none" stroke="${bg}" stroke-width="8" stroke-linecap="round"/></g></svg>`;
await fs.mkdir('public', { recursive: true });
// favicon.svg: con maschera, si adatta al tema scuro
await fs.writeFile('public/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="98 -20 470 520"><style>path.d{fill:#2a1c0a}@media (prefers-color-scheme: dark){path.d{fill:#eeede8}}</style><mask id="m"><rect x="0" y="-100" width="700" height="700" fill="#fff"/><path d="${S}" stroke="#000" stroke-width="9" fill="none" stroke-linecap="round"/></mask><path class="d" d="${D}" mask="url(#m)"/></svg>\n`);
const png = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
const sq = square('#eeede8', '#2a1c0a');
await fs.writeFile('public/apple-touch-icon.png', await png(sq, 180));
await fs.writeFile('public/icon-192.png', await png(sq, 192));
await fs.writeFile('public/icon-512.png', await png(sq, 512));
await fs.writeFile('public/icon-maskable-512.png', await sharp(Buffer.from(square('#2a1c0a', '#eeede8').replace('scale(0.82)', 'scale(0.62)'))).resize(512, 512).png().toBuffer());
// favicon.ico (PNG dentro ICO, 32×32)
const p32 = await png(sq, 32);
const head = Buffer.alloc(22);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(1, 4);
head.writeUInt8(32, 6); head.writeUInt8(32, 7); head.writeUInt8(0, 8); head.writeUInt8(0, 9);
head.writeUInt16LE(1, 10); head.writeUInt16LE(32, 12); head.writeUInt32LE(p32.length, 14); head.writeUInt32LE(22, 18);
await fs.writeFile('public/favicon.ico', Buffer.concat([head, p32]));
await fs.writeFile('public/site.webmanifest', JSON.stringify({
  name: 'D-Labdesign', short_name: 'D-Labdesign', lang: 'it', start_url: '/', display: 'browser',
  background_color: '#eeede8', theme_color: '#eeede8',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2) + '\n');
console.log('icone generate in public/');
