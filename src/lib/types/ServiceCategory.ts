export type RawServiceCategory = {
  id: string;
  salon_id: string;
  name: string;
  description: string;
  color: string;
  service_count?: number;
  services?: { count: number }[];
};

export class ServiceCategory {
  id: string;
  salon_id: string;
  name: string;
  description: string;
  color: string;
  service_count: number;

  constructor(data: RawServiceCategory) {
    this.id = data.id;
    this.salon_id = data.salon_id;
    this.name = data.name;
    this.description = data.description;
    this.color = data.color ?? '#6366F1';
    this.service_count = data.service_count ?? data.services?.[0]?.count ?? 0;
  }
}
