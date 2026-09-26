/** Result of public.bilancio(dal, al): see supabase/migrations/2026_09_26_fiche_products_line_total.sql. */

export type Importo = { lordo: number; netto: number };

export type VoceEntrata = 'servizi' | 'prodotti' | 'pacchetti' | 'buoni_venduti' | 'sconti';

export type VoceUscita =
  | 'acquisto_prodotti'
  | 'servizi_esterni'
  | 'affitti_noleggi'
  | 'personale'
  | 'ammortamenti'
  | 'altre_spese';

export type BilancioMese = {
  mese: string; // YYYY-MM
  entrate_lordo: number;
  entrate_netto: number;
  uscite_lordo: number;
  uscite_netto: number;
};

export type BilancioResult = {
  dal: string;
  al: string;
  iva_pct: number;
  entrate: Importo & { voci: Partial<Record<VoceEntrata, Importo>> };
  uscite: Importo & {
    voci: Partial<Record<VoceUscita, Importo>>;
    categorie: { categoria: string; voce: VoceUscita; lordo: number; netto: number }[];
  };
  utile: Importo;
  mesi: BilancioMese[];
};

export const VOCI_ENTRATA: { key: VoceEntrata; label: string }[] = [
  { key: 'servizi', label: 'Servizi' },
  { key: 'prodotti', label: 'Prodotti venduti' },
  { key: 'pacchetti', label: 'Pacchetti venduti' },
  { key: 'buoni_venduti', label: 'Buoni regalo venduti' },
  { key: 'sconti', label: 'Sconti e buoni usati' },
];

/** The six P&L cost lines (Italian civil code B.6-B.14), in plain Italian. */
export const VOCI_USCITA: { key: VoceUscita; label: string }[] = [
  { key: 'acquisto_prodotti', label: 'Acquisto prodotti' },
  { key: 'servizi_esterni', label: 'Servizi esterni' },
  { key: 'affitti_noleggi', label: 'Affitti e noleggi' },
  { key: 'personale', label: 'Personale' },
  { key: 'ammortamenti', label: 'Ammortamenti' },
  { key: 'altre_spese', label: 'Altre spese di gestione' },
];
