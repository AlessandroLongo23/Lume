import type { Tables } from '@/lib/supabase/types';

export class Order {
  id: string;
  salon_id: string;
  supplier_id: string;
  /** ISO timestamp, or null when the order has no date yet. */
  datetime: string | null;
  status: string | null;

  constructor(row: Tables<'orders'>) {
    this.id = row.id;
    this.salon_id = row.salon_id;
    this.supplier_id = row.supplier_id;
    this.datetime = row.datetime;
    this.status = row.status;
  }
}
