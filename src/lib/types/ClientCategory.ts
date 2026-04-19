import { DEFAULT_CATEGORY_COLOR } from '@/lib/const/category-colors';

export type RawClientCategory = {
  id: string;
  salon_id: string;
  name: string;
  color: string;
  clients: [{ count: number }];
};

export class ClientCategory {
  id: string;
  salon_id: string;
  name: string;
  color: string;
  client_count: number;

  constructor(raw: RawClientCategory | ClientCategory) {
    this.id = raw.id;
    this.salon_id = raw.salon_id;
    this.name = raw.name;
    this.color = raw.color ?? DEFAULT_CATEGORY_COLOR;
    this.client_count = 'clients' in raw ? (raw.clients?.[0]?.count ?? 0) : ((raw as ClientCategory).client_count ?? 0);
  }
}
