import 'server-only';
import { SupabaseClient } from '@supabase/supabase-js';

// Tenant tables exported under GDPR Art. 20 (right to data portability).
// Source of truth: same list audited by scripts/audit-tenant-isolation.ts —
// keep in sync. Order doesn't matter for export, but for readability we put
// the "core entities" first and audit/history last.
const TENANT_TABLES = [
  // Core entities
  'clients',
  'operators',
  'services',
  'service_categories',
  'products',
  'product_categories',
  'manufacturers',
  'suppliers',
  // Operational
  'fiches',
  'fiche_services',
  'fiche_products',
  'fiche_payments',
  'fiche_edits',
  'orders',
  'order_products',
  'operator_unavailabilities',
  // Loyalty + financial
  'coupons',
  'coupon_redemptions',
  'abbonamenti',
  'spese',
  'obiettivi',
  // History
  'product_price_history',
  'service_price_history',
  'service_products',
  // Tenancy + identity
  'profiles',
  'user_salon_memberships',
  'pending_membership_invites',
  // Compliance
  'legal_acceptances',
  // Workflows
  'import_jobs',
] as const;

type Admin = SupabaseClient;

export interface SalonExport {
  exportedAt: string;
  generator: string;
  salonId: string;
  salon: Record<string, unknown> | null;
  tables: Record<string, Record<string, unknown>[]>;
  errors: { table: string; message: string }[];
}

/**
 * Builds a complete data dump of a salon, suitable for GDPR Art. 20 portability.
 * Uses the service-role client to bypass RLS — the caller MUST gate access
 * to the salon owner / authorised admin before calling this.
 */
export async function exportSalonData(salonId: string, admin: Admin): Promise<SalonExport> {
  const errors: { table: string; message: string }[] = [];

  const { data: salonRow, error: salonErr } = await admin
    .from('salons')
    .select('*')
    .eq('id', salonId)
    .maybeSingle();
  if (salonErr) errors.push({ table: 'salons', message: salonErr.message });

  const tables: Record<string, Record<string, unknown>[]> = {};

  for (const table of TENANT_TABLES) {
    const { data, error } = await admin.from(table).select('*').eq('salon_id', salonId);
    if (error) {
      errors.push({ table, message: error.message });
      tables[table] = [];
      continue;
    }
    tables[table] = (data ?? []) as Record<string, unknown>[];
  }

  return {
    exportedAt: new Date().toISOString(),
    generator: 'Lume — GDPR Art. 20 Data Portability Export v1',
    salonId,
    salon: salonRow as Record<string, unknown> | null,
    tables,
    errors,
  };
}

export const EXPORT_TENANT_TABLES = TENANT_TABLES;
