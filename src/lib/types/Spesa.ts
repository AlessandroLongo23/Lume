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

  constructor(data: Record<string, unknown>) {
    this.id = data.id as string;
    this.salon_id = data.salon_id as string;
    this.data = data.data as string;
    this.fornitore = data.fornitore as string;
    this.categoria = data.categoria as string;
    this.importo = Number(data.importo);
    this.imponibile = data.imponibile == null ? null : Number(data.imponibile);
    this.created_at = data.created_at as string;
  }
}
