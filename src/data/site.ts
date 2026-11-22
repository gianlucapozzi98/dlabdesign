/**
 * Dati del sito. SOLO fatti presenti in DIREZIONE-ARTISTICA-D-LABDESIGN.md (sezione 1)
 * o pubblicati dal cliente sul sito attuale (segnalati in README come "da confermare").
 * `null` = dato mancante: viene mostrato come segnaposto evidente.
 */
export const SITE = {
  nome: 'D-Labdesign',
  nomeCompleto: 'D-Labdesign by Arredamenti Salini',
  url: 'https://www.d-labdesign.it',
  descrizione:
    'Spazio creativo dove nascono progetti e soluzioni sorprendenti e dove volumi e materiali si incontrano, per percorrere la strada dell’innovazione.',
  chiusura: 'Abbiamo avuto il coraggio di osare. E voi?',

  telefono: { testo: '0363 301622', href: 'tel:+390363301622' },
  appuntamenti: { testo: '0363 57152', href: 'tel:+39036357152' },
  email: 'info@d-labdesign.it',

  showroom: {
    via: 'Via M.O. Giulio Setti 7e',
    cap: '24047',
    citta: 'Treviglio',
    provincia: 'BG',
    complesso: 'Alcentro',
    angolo: 'Via De Gasperi e Via Monte Grappa',
    parcheggio: 'Parcheggio sotterraneo a più livelli con ingresso da Via Setti.',
    lat: 45.517068,
    lng: 9.58967,
  },

  /** Dati societari: da verificare con una visura (fonte: aziende.it / Registro Imprese) */
  societa: {
    ragioneSociale: 'S.r.l. Salini',
    piva: '01624570162',
    codiceFiscale: '01624570162',
    sedeLegale: 'Via C. Battisti 29, 24047 Treviglio (BG)',
    rea: null as string | null,
    pec: null as string | null,
    capitaleSociale: null as string | null,
  },

  social: {
    facebook: 'https://www.facebook.com/DLabdesignByArredamentiSalini',
  },
  newsletter: 'http://d-labdesign.invionews.net/user/register',
} as const;

export type Giorno = {
  giorno: string;
  breve: string;
  /** schema.org dayOfWeek */
  dow: string;
  fasce: [string, string][];
  appuntamento?: boolean;
  daConfermare?: boolean;
};

export const ORARI: Giorno[] = [
  { giorno: 'Lunedì', breve: 'Lun', dow: 'Monday', fasce: [['14:30', '19:30']] },
  { giorno: 'Martedì', breve: 'Mar', dow: 'Tuesday', fasce: [], appuntamento: true },
  { giorno: 'Mercoledì', breve: 'Mer', dow: 'Wednesday', fasce: [], appuntamento: true },
  { giorno: 'Giovedì', breve: 'Gio', dow: 'Thursday', fasce: [['14:30', '19:30']] },
  { giorno: 'Venerdì', breve: 'Ven', dow: 'Friday', fasce: [['10:00', '12:30'], ['15:00', '19:30']] },
  { giorno: 'Sabato', breve: 'Sab', dow: 'Saturday', fasce: [['10:00', '12:30'], ['15:00', '19:30']] },
  { giorno: 'Domenica', breve: 'Dom', dow: 'Sunday', fasce: [], daConfermare: true },
];

export const NAV = [
  { href: '/progetti/', label: 'Progetti' },
  { href: '/il-lab/', label: 'Il Lab' },
  { href: '/the-opening/', label: 'The Opening' },
  { href: '/news/', label: 'News' },
  { href: '/video/', label: 'Video' },
  { href: '/contatti/', label: 'Contatti' },
] as const;

export const CTA = { href: '/contatti/#appuntamento', label: 'Prenota un appuntamento' } as const;

export const indirizzoBreve = `${SITE.showroom.via}, ${SITE.showroom.cap} ${SITE.showroom.citta} (${SITE.showroom.provincia})`;
