export interface RawClientStat {
  client_id: string;
  salon_id: string;
  total_spent: number | string;
  visit_count: number;
  first_visit: string | null;
  last_visit: string | null;
  avg_ticket: number | string;
  top_service_id: string | null;
  top_service_name: string | null;
  top_operator_id: string | null;
  top_operator_name: string | null;
}

export class ClientStat {
  client_id: string;
  salon_id: string;
  total_spent: number;
  visit_count: number;
  first_visit: Date | null;
  last_visit: Date | null;
  avg_ticket: number;
  top_service_id: string | null;
  top_service_name: string | null;
  top_operator_id: string | null;
  top_operator_name: string | null;

  constructor(raw: RawClientStat) {
    this.client_id = raw.client_id;
    this.salon_id = raw.salon_id;
    this.total_spent = typeof raw.total_spent === 'string' ? parseFloat(raw.total_spent) : raw.total_spent;
    this.visit_count = raw.visit_count;
    this.first_visit = raw.first_visit ? new Date(raw.first_visit) : null;
    this.last_visit = raw.last_visit ? new Date(raw.last_visit) : null;
    this.avg_ticket = typeof raw.avg_ticket === 'string' ? parseFloat(raw.avg_ticket) : raw.avg_ticket;
    this.top_service_id = raw.top_service_id;
    this.top_service_name = raw.top_service_name;
    this.top_operator_id = raw.top_operator_id;
    this.top_operator_name = raw.top_operator_name;
  }

  daysSinceLastVisit(): number | null {
    if (!this.last_visit) return null;
    const ms = Date.now() - this.last_visit.getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  }
}
