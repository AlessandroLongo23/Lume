import type { Tables } from '@/lib/supabase/types';

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

  constructor(row: Tables<'client_stats'>) {
    this.client_id = row.client_id;
    this.salon_id = row.salon_id;
    this.total_spent = row.total_spent;
    this.visit_count = row.visit_count;
    this.first_visit = row.first_visit ? new Date(row.first_visit) : null;
    this.last_visit = row.last_visit ? new Date(row.last_visit) : null;
    this.avg_ticket = row.avg_ticket;
    this.top_service_id = row.top_service_id;
    this.top_service_name = row.top_service_name;
    this.top_operator_id = row.top_operator_id;
    this.top_operator_name = row.top_operator_name;
  }

  daysSinceLastVisit(): number | null {
    if (!this.last_visit) return null;
    const ms = Date.now() - this.last_visit.getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  }
}
