// src/lib/components/admin/statistiche/statHelpers.ts
import { Fiche } from '@/lib/types/Fiche';
import { FicheService } from '@/lib/types/FicheService';
import { FicheProduct } from '@/lib/types/FicheProduct';
import { FichePayment } from '@/lib/types/FichePayment';
import { FichePaymentMethod } from '@/lib/types/fichePaymentMethod';
import { Client } from '@/lib/types/Client';
import { Service } from '@/lib/types/Service';
import { Product } from '@/lib/types/Product';
import { Operator } from '@/lib/types/Operator';
import { ServiceCategory } from '@/lib/types/ServiceCategory';
import { ProductCategory } from '@/lib/types/ProductCategory';

// ── KPIs ────────────────────────────────────────────────────────────────────

export interface KpiResult {
  totalRevenue: number;
  ficheCount: number;
  avgTicket: number;
  activeClients: number;
}

export function computeKpis(
  fiches: Fiche[],
  ficheServices: FicheService[],
  ficheProducts: FicheProduct[],
): KpiResult {
  const serviceSums = new Map<string, number>();
  for (const fs of ficheServices) {
    serviceSums.set(fs.fiche_id, (serviceSums.get(fs.fiche_id) ?? 0) + fs.final_price);
  }
  const productSums = new Map<string, number>();
  for (const fp of ficheProducts) {
    productSums.set(fp.fiche_id, (productSums.get(fp.fiche_id) ?? 0) + fp.final_price * fp.quantity);
  }

  let totalRevenue = 0;
  for (const f of fiches) {
    totalRevenue += f.total_override ?? ((serviceSums.get(f.id) ?? 0) + (productSums.get(f.id) ?? 0));
  }

  const ficheCount = fiches.length;
  const avgTicket = ficheCount > 0 ? totalRevenue / ficheCount : 0;
  const activeClients = new Set(fiches.map((f) => f.client_id)).size;

  return { totalRevenue, ficheCount, avgTicket, activeClients };
}

export function computeTrend(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

// ── Payment breakdown ────────────────────────────────────────────────────────

export interface PaymentBreakdownItem {
  name: string;
  value: number;
}

export function computePaymentBreakdown(payments: FichePayment[]): PaymentBreakdownItem[] {
  const sums = { cash: 0, pos: 0, other: 0 };
  for (const p of payments) {
    if (p.method === FichePaymentMethod.CASH) sums.cash += p.amount;
    else if (p.method === FichePaymentMethod.POS) sums.pos += p.amount;
    else sums.other += p.amount;
  }
  return [
    { name: 'Contanti', value: sums.cash },
    { name: 'POS', value: sums.pos },
    { name: 'Altro', value: sums.other },
  ].filter((item) => item.value > 0);
}

// ── Day distribution ─────────────────────────────────────────────────────────

const IT_DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

export interface DayCount {
  day: string;
  count: number;
}

export function computeDayDistribution(fiches: Fiche[]): DayCount[] {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const f of fiches) {
    const jsDay = new Date(f.datetime).getDay(); // 0=Sun
    const itDay = (jsDay + 6) % 7; // 0=Mon...6=Sun
    counts[itDay]++;
  }
  return IT_DAYS.map((day, i) => ({ day, count: counts[i] }));
}

// ── Client leaderboard ───────────────────────────────────────────────────────

export interface ClientRow {
  clientId: string;
  name: string;
  presenze: number;
  incasso: number;
  avgTicket: number;
}

export function computeClientLeaderboard(
  fiches: Fiche[],
  ficheServices: FicheService[],
  ficheProducts: FicheProduct[],
  clients: Client[],
): ClientRow[] {
  const serviceSums = new Map<string, number>();
  for (const fs of ficheServices) {
    serviceSums.set(fs.fiche_id, (serviceSums.get(fs.fiche_id) ?? 0) + fs.final_price);
  }
  const productSums = new Map<string, number>();
  for (const fp of ficheProducts) {
    productSums.set(fp.fiche_id, (productSums.get(fp.fiche_id) ?? 0) + fp.final_price * fp.quantity);
  }

  const map = new Map<string, { presenze: number; incasso: number }>();
  for (const f of fiches) {
    const total = f.total_override ?? ((serviceSums.get(f.id) ?? 0) + (productSums.get(f.id) ?? 0));
    const curr = map.get(f.client_id) ?? { presenze: 0, incasso: 0 };
    map.set(f.client_id, { presenze: curr.presenze + 1, incasso: curr.incasso + total });
  }

  const clientMap = new Map(clients.map((c) => [c.id, c]));
  return Array.from(map.entries())
    .map(([clientId, stats]) => {
      const c = clientMap.get(clientId);
      return {
        clientId,
        name: c?.getFullName() ?? 'Cliente eliminato',
        presenze: stats.presenze,
        incasso: stats.incasso,
        avgTicket: stats.presenze > 0 ? stats.incasso / stats.presenze : 0,
      };
    })
    .sort((a, b) => b.incasso - a.incasso);
}

// ── New vs returning ─────────────────────────────────────────────────────────

export interface NewVsReturning {
  name: string;
  value: number;
}

export function computeNewVsReturning(
  periodFiches: Fiche[],
  allFiches: Fiche[],
): NewVsReturning[] {
  const periodClientIds = new Set(periodFiches.map((f) => f.client_id));
  const periodStart = periodFiches.reduce(
    (min, f) => Math.min(min, new Date(f.datetime).getTime()),
    Infinity,
  );

  // A client is "new" if their earliest fiche ever is within the period
  const firstVisit = new Map<string, number>();
  for (const f of allFiches) {
    const t = new Date(f.datetime).getTime();
    const curr = firstVisit.get(f.client_id);
    if (curr === undefined || t < curr) firstVisit.set(f.client_id, t);
  }

  let newClients = 0;
  let returningClients = 0;
  for (const clientId of periodClientIds) {
    const first = firstVisit.get(clientId) ?? Infinity;
    if (first >= periodStart) newClients++;
    else returningClients++;
  }

  return [
    { name: 'Nuovi', value: newClients },
    { name: 'Abituali', value: returningClients },
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

export function computeServiceLeaderboard(
  ficheServices: FicheService[],
  services: Service[],
  categories: ServiceCategory[],
): ServiceRow[] {
  const serviceMap = new Map(services.map((s) => [s.id, s]));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const map = new Map<string, { name: string; categoryName: string; count: number; incasso: number }>();
  for (const fs of ficheServices) {
    const svc = serviceMap.get(fs.service_id);
    const catName = svc ? (categoryMap.get(svc.category_id)?.name ?? '—') : '—';
    const curr = map.get(fs.service_id) ?? { name: fs.name, categoryName: catName, count: 0, incasso: 0 };
    map.set(fs.service_id, { ...curr, count: curr.count + 1, incasso: curr.incasso + fs.final_price });
  }

  const rows = Array.from(map.values()).sort((a, b) => b.incasso - a.incasso);
  const totalIncasso = rows.reduce((s, r) => s + r.incasso, 0);
  return rows.map((r, i) => ({
    serviceId: Array.from(map.keys())[i],
    ...r,
    pctIncasso: totalIncasso > 0 ? (r.incasso / totalIncasso) * 100 : 0,
  }));
}

// ── Services by category ─────────────────────────────────────────────────────

export interface CategoryBreakdown {
  name: string;
  value: number;
  count: number;
}

export function computeServicesByCategory(
  ficheServices: FicheService[],
  services: Service[],
  categories: ServiceCategory[],
): CategoryBreakdown[] {
  const serviceMap = new Map(services.map((s) => [s.id, s]));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const map = new Map<string, { name: string; value: number; count: number }>();
  for (const fs of ficheServices) {
    const svc = serviceMap.get(fs.service_id);
    if (!svc) continue;
    const catId = svc.category_id;
    const catName = categoryMap.get(catId)?.name ?? 'Senza categoria';
    const curr = map.get(catId) ?? { name: catName, value: 0, count: 0 };
    map.set(catId, { ...curr, value: curr.value + fs.final_price, count: curr.count + 1 });
  }

  return Array.from(map.values()).sort((a, b) => b.value - a.value);
}

// ── Services by operator ──────────────────────────────────────────────────────

export interface OperatorServiceRow {
  operatorName: string;
  serviceName: string;
  count: number;
  incasso: number;
}

export function computeServicesByOperator(
  ficheServices: FicheService[],
  operators: Operator[],
): OperatorServiceRow[] {
  const operatorMap = new Map(operators.map((o) => [o.id, o]));
  const map = new Map<string, { operatorName: string; serviceName: string; count: number; incasso: number }>();

  for (const fs of ficheServices) {
    const key = `${fs.operator_id}__${fs.service_id}`;
    const op = operatorMap.get(fs.operator_id);
    const curr = map.get(key) ?? {
      operatorName: op?.getFullName() ?? 'Operatore eliminato',
      serviceName: fs.name,
      count: 0,
      incasso: 0,
    };
    map.set(key, { ...curr, count: curr.count + 1, incasso: curr.incasso + fs.final_price });
  }

  return Array.from(map.values()).sort((a, b) => b.incasso - a.incasso);
}

// ── Product leaderboard ───────────────────────────────────────────────────────

export interface ProductRow {
  productId: string;
  name: string;
  categoryName: string;
  qty: number;
  incasso: number;
}

export function computeProductLeaderboard(
  ficheProducts: FicheProduct[],
  products: Product[],
  categories: ProductCategory[],
): ProductRow[] {
  const productMap = new Map(products.map((p) => [p.id, p]));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const map = new Map<string, { name: string; categoryName: string; qty: number; incasso: number }>();
  for (const fp of ficheProducts) {
    const prod = productMap.get(fp.product_id);
    const catName = prod ? (categoryMap.get(prod.product_category_id)?.name ?? '—') : '—';
    const curr = map.get(fp.product_id) ?? {
      name: prod?.name ?? 'Prodotto eliminato',
      categoryName: catName,
      qty: 0,
      incasso: 0,
    };
    map.set(fp.product_id, {
      ...curr,
      qty: curr.qty + fp.quantity,
      incasso: curr.incasso + fp.final_price * fp.quantity,
    });
  }

  return Array.from(map.entries())
    .map(([productId, r]) => ({ productId, ...r }))
    .sort((a, b) => b.incasso - a.incasso);
}

// ── Products by category ──────────────────────────────────────────────────────

export function computeProductsByCategory(
  ficheProducts: FicheProduct[],
  products: Product[],
  categories: ProductCategory[],
): CategoryBreakdown[] {
  const productMap = new Map(products.map((p) => [p.id, p]));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const map = new Map<string, { name: string; value: number; count: number }>();
  for (const fp of ficheProducts) {
    const prod = productMap.get(fp.product_id);
    if (!prod) continue;
    const catId = prod.product_category_id;
    const catName = categoryMap.get(catId)?.name ?? 'Senza categoria';
    const curr = map.get(catId) ?? { name: catName, value: 0, count: 0 };
    map.set(catId, { ...curr, value: curr.value + fp.final_price * fp.quantity, count: curr.count + fp.quantity });
  }

  return Array.from(map.values()).sort((a, b) => b.value - a.value);
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

export function computeOperatorSummary(
  fiches: Fiche[],
  ficheServices: FicheService[],
  ficheProducts: FicheProduct[],
  operators: Operator[],
): OperatorSummaryRow[] {
  const operatorMap = new Map(operators.map((o) => [o.id, o]));

  // Build per-fiche totals
  const serviceSums = new Map<string, number>();
  for (const fs of ficheServices) {
    serviceSums.set(fs.fiche_id, (serviceSums.get(fs.fiche_id) ?? 0) + fs.final_price);
  }
  const productSums = new Map<string, number>();
  for (const fp of ficheProducts) {
    productSums.set(fp.fiche_id, (productSums.get(fp.fiche_id) ?? 0) + fp.final_price * fp.quantity);
  }

  // Group fiches by primary operator (operator of the first service on the fiche)
  const ficheToOperator = new Map<string, string>();
  for (const fs of ficheServices) {
    if (!ficheToOperator.has(fs.fiche_id)) {
      ficheToOperator.set(fs.fiche_id, fs.operator_id);
    }
  }

  // Per-operator: service name counts (for top service)
  const opServiceCounts = new Map<string, Map<string, number>>();
  for (const fs of ficheServices) {
    let inner = opServiceCounts.get(fs.operator_id);
    if (!inner) { inner = new Map(); opServiceCounts.set(fs.operator_id, inner); }
    inner.set(fs.name, (inner.get(fs.name) ?? 0) + 1);
  }

  const opStats = new Map<string, { ficheCount: number; incasso: number; clients: Set<string> }>();
  for (const f of fiches) {
    const opId = ficheToOperator.get(f.id);
    if (!opId) continue;
    const total = f.total_override ?? ((serviceSums.get(f.id) ?? 0) + (productSums.get(f.id) ?? 0));
    const curr = opStats.get(opId) ?? { ficheCount: 0, incasso: 0, clients: new Set<string>() };
    curr.ficheCount++;
    curr.incasso += total;
    curr.clients.add(f.client_id);
    opStats.set(opId, curr);
  }

  return Array.from(opStats.entries())
    .map(([operatorId, stats]) => {
      const serviceCounter = opServiceCounts.get(operatorId);
      const topService = serviceCounter
        ? Array.from(serviceCounter.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
        : '—';
      return {
        operatorId,
        name: operatorMap.get(operatorId)?.getFullName() ?? 'Operatore eliminato',
        ficheCount: stats.ficheCount,
        incasso: stats.incasso,
        avgTicket: stats.ficheCount > 0 ? stats.incasso / stats.ficheCount : 0,
        topService,
        clientCount: stats.clients.size,
      };
    })
    .sort((a, b) => b.incasso - a.incasso);
}
