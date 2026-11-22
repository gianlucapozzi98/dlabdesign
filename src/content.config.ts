import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** Testo vuoto di Keystatic ('') → undefined */
const opt = () =>
  z
    .string()
    .nullish()
    .transform((v) => (v && v.trim() ? v.trim() : undefined));

const progetti = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/progetti' }),
  schema: ({ image }) =>
    z.object({
      titolo: z.string(),
      categoria: z.enum(['casa', 'negozio']),
      ordine: z.number().default(10),
      sintesi: z.string(),
      descrizione: z.string(),
      luogo: opt(),
      anno: opt(),
      fonte: opt(),
      copertina: image(),
      copertinaAlt: z.string(),
      foto: z
        .array(
          z.object({
            immagine: image(),
            alt: z.string(),
            fase: z.enum(['', 'prima', 'durante', 'dopo', 'disegno']).default(''),
            didascalia: opt(),
          }),
        )
        .default([]),
    }),
});

const studi = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/studi' }),
  schema: z.object({
    titolo: z.string(),
    ordine: z.number().default(10),
    sintesi: z.string(),
    descrizione: z.string(),
    disegno: z.enum(['soglia', 'banco']),
    materiali: z.array(z.string()).default([]),
  }),
});

const news = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/news' }),
  schema: ({ image }) =>
    z.object({
      titolo: z.string(),
      data: z.coerce.date(),
      sintesi: opt(),
      testo: z.string(),
      immagine: image().nullish(),
      immagineAlt: opt(),
      archivio: z.boolean().default(false),
    }),
});

export const collections = { progetti, studi, news };
