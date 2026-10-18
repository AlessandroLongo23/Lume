import type { Tables } from '@/lib/supabase/types';

export type Stars = 1 | 2 | 3 | 4 | 5;

export class ClientRating {
  client_id: string;
  salon_id: string;
  total_spent: number;
  visit_count: number;
  spend_stars: Stars;
  visit_stars: Stars;

  constructor(row: Tables<'client_ratings'>) {
    this.client_id = row.client_id;
    this.salon_id = row.salon_id;
    this.total_spent = row.total_spent;
    this.visit_count = row.visit_count;
    this.spend_stars = row.spend_stars;
    this.visit_stars = row.visit_stars;
  }
}
