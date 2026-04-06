export class Spesa {
  id: string;
  salon_id: string;
  data: string;
  fornitore: string;
  categoria: string;
  importo: number;
  created_at: string;

  constructor(data: Record<string, unknown>) {
    this.id = data.id as string;
    this.salon_id = data.salon_id as string;
    this.data = data.data as string;
    this.fornitore = data.fornitore as string;
    this.categoria = data.categoria as string;
    this.importo = Number(data.importo);
    this.created_at = data.created_at as string;
  }
}
