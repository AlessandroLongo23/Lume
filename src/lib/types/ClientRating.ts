export type Stars = 1 | 2 | 3 | 4 | 5;

export interface RawClientRating {
  client_id: string;
  salon_id: string;
  total_spent: number | string;
  visit_count: number;
  spend_stars: number;
  visit_stars: number;
}

export class ClientRating {
  client_id: string;
  salon_id: string;
  total_spent: number;
  visit_count: number;
  spend_stars: Stars;
  visit_stars: Stars;

  constructor(raw: RawClientRating) {
    this.client_id = raw.client_id;
    this.salon_id = raw.salon_id;
    this.total_spent = typeof raw.total_spent === 'string' ? parseFloat(raw.total_spent) : raw.total_spent;
    this.visit_count = raw.visit_count;
    this.spend_stars = raw.spend_stars as Stars;
    this.visit_stars = raw.visit_stars as Stars;
  }
}
