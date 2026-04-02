import type { FichePaymentMethod } from './fichePaymentMethod';

export class FichePayment {
  id: string;
  fiche_id: string;
  salon_id: string;
  method: FichePaymentMethod;
  amount: number;
  created_at: Date;

  constructor(fp: FichePayment) {
    this.id = fp.id;
    this.fiche_id = fp.fiche_id;
    this.salon_id = fp.salon_id;
    this.method = fp.method;
    this.amount = fp.amount;
    this.created_at = fp.created_at;
  }
}
