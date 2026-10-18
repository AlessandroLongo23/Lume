import type { FichePaymentMethod } from './fichePaymentMethod';
import type { Tables } from '@/lib/supabase/types';

export class FichePayment {
  id: string;
  fiche_id: string;
  salon_id: string;
  method: FichePaymentMethod;
  amount: number;
  /** ISO timestamp. */
  created_at: string;

  constructor(row: Tables<'fiche_payments'>) {
    this.id = row.id;
    this.fiche_id = row.fiche_id;
    this.salon_id = row.salon_id;
    this.method = row.method;
    this.amount = row.amount;
    this.created_at = row.created_at;
  }
}
