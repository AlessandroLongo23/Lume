import type { Tables } from '@/lib/supabase/types';

export class FicheService {
  id: string;
  salon_id: string;
  fiche_id: string;
  service_id: string;
  name: string;
  operator_id: string;
  /** ISO timestamp. */
  start_time: string;
  /** ISO timestamp. */
  end_time: string;
  /** Minutes. */
  duration: number;
  list_price: number;
  final_price: number;
  abbonamento_id: string | null;

  constructor(row: Tables<'fiche_services'>) {
    this.id = row.id;
    this.salon_id = row.salon_id;
    this.fiche_id = row.fiche_id;
    this.service_id = row.service_id;
    this.name = row.name;
    this.operator_id = row.operator_id;
    this.start_time = row.start_time;
    this.end_time = row.end_time;
    this.duration = row.duration;
    this.list_price = row.list_price;
    this.final_price = row.final_price;
    this.abbonamento_id = row.abbonamento_id;
  }

  getDuration(): number {
    return Math.floor((new Date(this.end_time).getTime() - new Date(this.start_time).getTime()) / 60000);
  }
}
