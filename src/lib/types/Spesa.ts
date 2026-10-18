import type { Tables } from '@/lib/supabase/types';

export class Spesa {
  id: string;
  salon_id: string;
  data: string;
  fornitore: string;
  categoria: string;
  /** Amount paid, VAT included. */
  importo: number;
  /** Amount without VAT, when known. The Bilancio falls back to importo when null. */
  imponibile: number | null;
  created_at: string;

  constructor(row: Tables<'spese'>) {
    this.id = row.id;
    this.salon_id = row.salon_id;
    this.data = row.data;
    this.fornitore = row.fornitore;
    this.categoria = row.categoria;
    this.importo = row.importo;
    this.imponibile = row.imponibile;
    this.created_at = row.created_at;
  }
}
