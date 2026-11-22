// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Keystatic (pannello per news e progetti) gira in sviluppo locale (`npm run dev`)
// oppure in produzione con KEYSTATIC=true + un adapter (vedi README).
const isDev = process.argv.includes('dev');
const withCms = isDev || process.env.KEYSTATIC === 'true';

const integrations = [
  sitemap({
    filter: (page) => !page.includes('/keystatic') && !page.includes('/404'),
    i18n: undefined,
  }),
];

if (withCms) {
  const { default: react } = await import('@astrojs/react');
  const { default: keystatic } = await import('@keystatic/astro');
  integrations.push(react(), keystatic());
}

export default defineConfig({
  site: 'https://www.d-labdesign.it',
  trailingSlash: 'ignore',
  build: { format: 'directory', inlineStylesheets: 'always' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  image: { responsiveStyles: false },
  devToolbar: { enabled: false },
  integrations,
});
