import type { Tables } from '@/lib/supabase/types';

export class FicheProduct {
  id: string;
  salon_id: string;
  fiche_id: string;
  product_id: string;
  quantity: number;
  /** Catalog price of ONE piece. */
  list_price: number;
  /** What was charged for the WHOLE line (all pieces), exact to the cent. Never multiply by quantity. */
  final_price: number;

  constructor(row: Tables<'fiche_products'>) {
    this.id = row.id;
    this.salon_id = row.salon_id;
    this.fiche_id = row.fiche_id;
    this.product_id = row.product_id;
    this.quantity = row.quantity;
    this.list_price = row.list_price;
    this.final_price = row.final_price;
  }
}
