// src/lib/components/admin/statistiche/statHelpers.ts
//
// The numbers are computed in the database by public.statistiche(); these helpers
// only reshape that result into the rows each chart and table takes.
import type { StatisticheResult } from '@/lib/types/Statistiche';

// ── KPIs ────────────────────────────────────────────────────────────────────

export interface KpiResult {
  totalRevenue: number;
  ficheCount: number;
  avgTicket: number;
  activeClients: number;
}

export function toKpis(data: StatisticheResult | null): KpiResult {
  const totalRevenue = data?.kpi.incasso ?? 0;
  const ficheCount = data?.kpi.fiche ?? 0;
  return {
    totalRevenue,
    ficheCount,
    avgTicket: ficheCount > 0 ? totalRevenue / ficheCount : 0,
    activeClients: data?.kpi.clienti_attivi ?? 0,
  };
}

// ── Payment breakdown ────────────────────────────────────────────────────────

export interface PaymentBreakdownItem {
  name: string;
  value: number;
}

export function toPaymentBreakdown(data: StatisticheResult | null): PaymentBreakdownItem[] {
  if (!data) return [];
  return [
    { name: 'Contanti', value: data.pagamenti.contanti },
    { name: 'POS', value: data.pagamenti.pos },
    { name: 'Altro', value: data.pagamenti.altro },
  ].filter((item) => item.value > 0);
}

// ── Day distribution ─────────────────────────────────────────────────────────

const IT_DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

export interface DayCount {
  day: string;
  count: number;
}

export function toDayDistribution(data: StatisticheResult | null): DayCount[] {
  return IT_DAYS.map((day, i) => ({ day, count: data?.giorni[i] ?? 0 }));
}

// ── Client leaderboard ───────────────────────────────────────────────────────

export interface ClientRow {
  clientId: string;
  name: string;
  presenze: number;
  incasso: number;
  avgTicket: number;
}

/** Sorted by incasso, highest first. */
export function toClientLeaderboard(data: StatisticheResult | null): ClientRow[] {
  return (data?.clienti ?? []).map((c) => ({
    clientId: c.id ?? '',
    name: c.nome,
    presenze: c.presenze,
    incasso: c.incasso,
    avgTicket: c.presenze > 0 ? c.incasso / c.presenze : 0,
  }));
}

// ── New vs returning ─────────────────────────────────────────────────────────

export interface NewVsReturning {
  name: string;
  value: number;
}

/** "Nuovi" had no fiche at the salon before the period started. */
export function toNewVsReturning(data: StatisticheResult | null): NewVsReturning[] {
  if (!data) return [];
  return [
    { name: 'Nuovi', value: data.nuovi_abituali.nuovi },
    { name: 'Abituali', value: data.nuovi_abituali.abituali },
  ].filter((item) => item.value > 0);
}

// ── Service leaderboard ───────────────────────────────────────────────────────

export interface ServiceRow {
  serviceId: string;
  name: string;
  categoryName: string;
  count: number;
  incasso: number;
  pctIncasso: number;
}

export function toServiceLeaderboard(data: StatisticheResult | null): ServiceRow[] {
  const rows = data?.servizi ?? [];
  const totalIncasso = rows.reduce((s, r) => s + r.incasso, 0);
  return rows.map((r) => ({
    serviceId: r.id ?? '',
    name: r.nome,
    categoryName: r.categoria,
    count: r.numero,
    incasso: r.incasso,
    pctIncasso: totalIncasso > 0 ? (r.incasso / totalIncasso) * 100 : 0,
  }));
}

// ── Breakdown by category (services and products) ────────────────────────────

export interface CategoryBreakdown {
  name: string;
  value: number;
  count: number;
}

export function toCategoryBreakdown(rows: { nome: string; incasso: number; numero: number }[] | undefined): CategoryBreakdown[] {
  return (rows ?? []).map((r) => ({ name: r.nome, value: r.incasso, count: r.numero }));
}

// ── Services by operator ──────────────────────────────────────────────────────

export interface OperatorServiceRow {
  operatorName: string;
  serviceName: string;
  count: number;
  incasso: number;
}

export function toServicesByOperator(data: StatisticheResult | null): OperatorServiceRow[] {
  return (data?.servizi_operatori ?? []).map((r) => ({
    operatorName: r.operatore,
    serviceName: r.servizio,
    count: r.numero,
    incasso: r.incasso,
  }));
}

// ── Product leaderboard ───────────────────────────────────────────────────────

export interface ProductRow {
  productId: string;
  name: string;
  categoryName: string;
  qty: number;
  incasso: number;
}

export function toProductLeaderboard(data: StatisticheResult | null): ProductRow[] {
  return (data?.prodotti ?? []).map((r) => ({
    productId: r.id ?? '',
    name: r.nome,
    categoryName: r.categoria,
    qty: r.quantita,
    incasso: r.incasso,
  }));
}

// ── Operator summary ──────────────────────────────────────────────────────────

export interface OperatorSummaryRow {
  operatorId: string;
  name: string;
  ficheCount: number;
  incasso: number;
  avgTicket: number;
  topService: string;
  clientCount: number;
}

/** A fiche counts for the operator of its earliest service. */
export function toOperatorSummary(data: StatisticheResult | null): OperatorSummaryRow[] {
  return (data?.operatori ?? []).map((r) => ({
    operatorId: r.id,
    name: r.nome,
    ficheCount: r.fiche,
    incasso: r.incasso,
    avgTicket: r.fiche > 0 ? r.incasso / r.fiche : 0,
    topService: r.top_servizio,
    clientCount: r.clienti,
  }));
}
