import { DEFAULT_CATEGORY_COLOR } from '@/lib/const/category-colors';

export type RawServiceCategory = {
  id: string;
  salon_id: string;
  name: string;
  description: string;
  color: string;
  service_count?: number;
  services?: { count: number }[];
  archived_at?: string | null;
};

export class ServiceCategory {
  id: string;
  salon_id: string;
  name: string;
  description: string;
  color: string;
  service_count: number;
  archived_at: string | null;

  constructor(data: RawServiceCategory) {
    this.id = data.id;
    this.salon_id = data.salon_id;
    this.name = data.name;
    this.description = data.description;
    this.color = data.color ?? DEFAULT_CATEGORY_COLOR;
    this.service_count = data.service_count ?? data.services?.[0]?.count ?? 0;
    this.archived_at = data.archived_at ?? null;
  }

  get isArchived(): boolean {
    return this.archived_at !== null;
  }
}
