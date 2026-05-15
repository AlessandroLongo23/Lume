// Catalog of pre-filled legal templates ("deliberatorie") that the salon can
// generate from Lume to comply with GDPR Art. 13 / Art. 9 / Codice Privacy /
// L. 633/1941 (image rights).
//
// The salon is the Titolare for these documents; Lume is the Responsabile.
// Each template is rendered server-side as printable HTML and signed offline
// by the salon's client.

export type DeliberatoriaSlug =
  | 'informativa-cliente'
  | 'consenso-dati-particolari'
  | 'consenso-foto'
  | 'consenso-marketing'
  | 'consenso-fedelta'
  | 'consenso-minore';

export interface DeliberatoriaMeta {
  slug: DeliberatoriaSlug;
  title: string;
  shortTitle: string;
  description: string;
  legalBasis: string;
  required: boolean;
}

export const DELIBERATORIE: DeliberatoriaMeta[] = [
  {
    slug: 'informativa-cliente',
    title: 'Informativa al cliente del salone',
    shortTitle: 'Informativa privacy',
    description:
      "Da consegnare a ogni nuovo cliente. Spiega chi tratta i dati, perché, per quanto tempo e quali diritti ha l'interessato.",
    legalBasis: 'Art. 13 GDPR',
    required: true,
  },
  {
    slug: 'consenso-dati-particolari',
    title: 'Consenso al trattamento di dati particolari (allergie, condizioni cutanee, gravidanza)',
    shortTitle: 'Consenso art. 9',
    description:
      'Necessario quando registri allergie, condizioni della cute o del cuoio capelluto, gravidanza, terapie in corso. Senza questo consenso non puoi annotare nessun dato sanitario.',
    legalBasis: 'Art. 9.2.a GDPR',
    required: true,
  },
  {
    slug: 'consenso-foto',
    title: 'Consenso a fotografie pre/post trattamento',
    shortTitle: 'Consenso fotografie',
    description:
      'Due opzioni separate: solo per la cartella tecnica interna, oppure anche per uso promozionale (social, sito, brochure).',
    legalBasis: 'Art. 9 GDPR + artt. 96-97 L. 633/1941',
    required: false,
  },
  {
    slug: 'consenso-marketing',
    title: 'Consenso a comunicazioni di marketing diretto',
    shortTitle: 'Consenso marketing',
    description:
      'Per inviare promozioni via email, SMS, WhatsApp o telefono. Una spunta separata per ciascun canale.',
    legalBasis: 'Art. 130 Codice Privacy',
    required: false,
  },
  {
    slug: 'consenso-fedelta',
    title: 'Consenso al programma fedeltà / profilazione',
    shortTitle: 'Consenso fedeltà',
    description:
      "Necessario se attivi un programma fedeltà o profili l'interessato per offerte personalizzate.",
    legalBasis: 'Art. 6.1.a GDPR',
    required: false,
  },
  {
    slug: 'consenso-minore',
    title: 'Autorizzazione del genitore per cliente minorenne',
    shortTitle: 'Cliente minorenne',
    description:
      'Da firmare dal genitore/tutore quando il cliente ha meno di 14 anni (Art. 2-quinquies Codice Privacy).',
    legalBasis: 'Art. 8 GDPR + Art. 2-quinquies Codice Privacy',
    required: false,
  },
];

export function getDeliberatoria(slug: string): DeliberatoriaMeta | null {
  return DELIBERATORIE.find((d) => d.slug === slug) ?? null;
}
