import { config, collection, fields } from '@keystatic/core';

/**
 * Pannello contenuti (Keystatic) — interfaccia in italiano.
 * In locale (`npm run dev` → /keystatic) salva i file nel progetto.
 * In produzione usa GitHub: imposta PUBLIC_KEYSTATIC_REPO e KEYSTATIC=true (vedi README).
 */
const repo = (import.meta.env.PUBLIC_KEYSTATIC_REPO || 'owner/d-labdesign') as `${string}/${string}`;
const useGithub = import.meta.env.PROD && import.meta.env.PUBLIC_KEYSTATIC_REPO;

const fase = fields.select({
  label: 'Fase',
  description: 'Prima, durante o dopo i lavori. "Disegno" per piante e disegni tecnici reali del progetto.',
  options: [
    { label: '—', value: '' },
    { label: 'Prima', value: 'prima' },
    { label: 'Durante', value: 'durante' },
    { label: 'Dopo', value: 'dopo' },
    { label: 'Disegno di progetto', value: 'disegno' },
  ],
  defaultValue: '',
});

export default config({
  locale: 'it-IT',
  storage: useGithub ? { kind: 'github', repo } : { kind: 'local' },
  ui: {
    brand: { name: 'D-Labdesign' },
    navigation: { Contenuti: ['progetti', 'news'], Idee: ['studi'] },
  },
  collections: {
    progetti: collection({
      label: 'Progetti realizzati',
      path: 'src/content/progetti/*',
      slugField: 'titolo',
      format: { data: 'yaml' },
      columns: ['categoria', 'ordine'],
      schema: {
        titolo: fields.slug({
          name: { label: 'Titolo', description: 'Es. "CASA | 02". Solo lavori VERI, realizzati da D-Labdesign.' },
          slug: { label: 'Indirizzo della pagina', description: 'Non usare "casa", "negozio" o "studi".' },
        }),
        categoria: fields.select({
          label: 'Categoria',
          options: [
            { label: 'Casa', value: 'casa' },
            { label: 'Negozio', value: 'negozio' },
          ],
          defaultValue: 'casa',
        }),
        ordine: fields.integer({ label: 'Ordine', description: 'Numero più basso = mostrato prima.', defaultValue: 10 }),
        sintesi: fields.text({ label: 'Sintesi (una riga)', validation: { length: { min: 1, max: 160 } } }),
        descrizione: fields.text({ label: 'Descrizione', multiline: true }),
        luogo: fields.text({ label: 'Luogo', description: 'Solo se il cliente ha dato il consenso.' }),
        anno: fields.text({ label: 'Anno', description: 'Solo se confermato.' }),
        fonte: fields.text({ label: 'Nota interna sulla fonte', description: 'Non viene mostrata sul sito.' }),
        copertina: fields.image({
          label: 'Foto di copertina',
          directory: 'src/assets/progetti',
          publicPath: '../../assets/progetti/',
          validation: { isRequired: true },
        }),
        copertinaAlt: fields.text({ label: 'Testo alternativo della copertina', description: 'Cosa si vede nella foto.' }),
        foto: fields.array(
          fields.object({
            immagine: fields.image({
              label: 'Foto',
              directory: 'src/assets/progetti',
              publicPath: '../../assets/progetti/',
              validation: { isRequired: true },
            }),
            alt: fields.text({ label: 'Testo alternativo', description: 'Cosa si vede nella foto.' }),
            fase,
            didascalia: fields.text({ label: 'Didascalia (facoltativa)' }),
          }),
          { label: 'Galleria', itemLabel: (p) => p.fields.alt.value || 'Foto' },
        ),
      },
    }),

    studi: collection({
      label: 'Studi (non realizzati)',
      path: 'src/content/studi/*',
      slugField: 'titolo',
      format: { data: 'yaml' },
      schema: {
        titolo: fields.slug({ name: { label: 'Titolo', description: 'Sul sito appare SEMPRE con l\'etichetta "Studio concettuale, non realizzato".' } }),
        ordine: fields.integer({ label: 'Ordine', defaultValue: 10 }),
        sintesi: fields.text({ label: 'Sintesi (una riga)' }),
        descrizione: fields.text({ label: 'Descrizione', multiline: true }),
        disegno: fields.select({
          label: 'Disegno',
          options: [
            { label: 'Soglia (portale)', value: 'soglia' },
            { label: 'Banco (esploso)', value: 'banco' },
          ],
          defaultValue: 'soglia',
        }),
        materiali: fields.array(fields.text({ label: 'Materiale' }), { label: 'Materiali', itemLabel: (p) => p.value }),
      },
    }),

    news: collection({
      label: 'News',
      path: 'src/content/news/*',
      slugField: 'titolo',
      format: { data: 'yaml' },
      columns: ['data'],
      schema: {
        titolo: fields.slug({ name: { label: 'Titolo' } }),
        data: fields.date({ label: 'Data', validation: { isRequired: true } }),
        sintesi: fields.text({ label: 'Sintesi (una riga)' }),
        testo: fields.text({ label: 'Testo', multiline: true }),
        immagine: fields.image({
          label: 'Immagine (facoltativa)',
          directory: 'src/assets/news',
          publicPath: '../../assets/news/',
        }),
        immagineAlt: fields.text({ label: 'Testo alternativo dell\'immagine' }),
        archivio: fields.checkbox({ label: 'Dall\'archivio del sito precedente', defaultValue: false }),
      },
    }),
  },
});
