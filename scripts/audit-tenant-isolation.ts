/**
 * Tenant-isolation smoke test.
 *
 *   npx tsx scripts/audit-tenant-isolation.ts
 *
 * Signs in as two known users from two different salons (anon key, real
 * authenticated session — exercises RLS). For every tenant table:
 *   1. Reads visible rows; asserts every row's salon_id matches the user's salon.
 *   2. Compares visible row count against the service-role ground-truth count
 *      for that user's salon, so RLS isn't over-filtering either.
 *
 * Required env (loaded from .env.local via dotenv):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *   AUDIT_SALON_A_USER_EMAIL
 *   AUDIT_SALON_A_USER_PASSWORD
 *   AUDIT_SALON_B_USER_EMAIL
 *   AUDIT_SALON_B_USER_PASSWORD
 *
 * The two users MUST belong to different salons. Either of them being a
 * platform admin (no salon_id) is a misconfiguration and will be rejected.
 */
import { config as dotenvConfig } from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

dotenvConfig({ path: '.env.local' });
dotenvConfig();

const TENANT_TABLES = [
  'abbonamenti',
  'clients',
  'coupon_redemptions',
  'coupons',
  'fiche_payments',
  'fiche_products',
  'fiche_services',
  'fiches',
  'import_jobs',
  'manufacturers',
  'obiettivi',
  'operator_unavailabilities',
  'operators',
  'order_products',
  'orders',
  'product_categories',
  'product_price_history',
  'products',
  'profiles',
  'service_categories',
  'service_price_history',
  'service_products',
  'services',
  'spese',
  'suppliers',
] as const;

type Creds = { email: string; password: string };

function envOrDie(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env var: ${name}`);
    process.exit(2);
  }
  return v;
}

async function signedInClient(url: string, anon: string, creds: Creds): Promise<{ sb: SupabaseClient; userId: string }> {
  const sb = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword(creds);
  if (error || !data.session) throw new Error(`Sign-in failed for ${creds.email}: ${error?.message ?? 'no session'}`);
  return { sb, userId: data.user.id };
}

async function profileSalon(admin: SupabaseClient, userId: string): Promise<string> {
  const { data, error } = await admin.from('profiles').select('salon_id, role').eq('id', userId).maybeSingle();
  if (error) throw new Error(`Profile lookup failed for ${userId}: ${error.message}`);
  if (!data) throw new Error(`No profile row for ${userId}`);
  if (!data.salon_id) throw new Error(`Profile ${userId} has no salon_id (role=${data.role}); use a non-admin user.`);
  return data.salon_id;
}

async function groundTruthCount(admin: SupabaseClient, table: string, salonId: string): Promise<number> {
  const { count, error } = await admin
    .from(table)
    .select('salon_id', { count: 'exact', head: true })
    .eq('salon_id', salonId);
  if (error) throw new Error(`Ground-truth count failed on ${table}: ${error.message}`);
  return count ?? 0;
}

interface AuditResult {
  table: string;
  visible: number;
  expected: number;
  leakedRows: { salon_id: string }[];
  errorCode?: string;
  errorMessage?: string;
}

async function auditTableAsUser(
  sb: SupabaseClient,
  admin: SupabaseClient,
  table: string,
  expectedSalonId: string,
): Promise<AuditResult> {
  const expected = await groundTruthCount(admin, table, expectedSalonId);
  const { data, error } = await sb.from(table).select('salon_id');
  if (error) {
    return { table, visible: 0, expected, leakedRows: [], errorCode: error.code, errorMessage: error.message };
  }
  const rows = (data ?? []) as { salon_id: string | null }[];
  const leaked = rows.filter((r) => r.salon_id !== null && r.salon_id !== expectedSalonId);
  return {
    table,
    visible: rows.length,
    expected,
    leakedRows: leaked as { salon_id: string }[],
  };
}

function reportUser(label: string, salonId: string, results: AuditResult[]): number {
  console.log(`\n=== ${label} (salon=${salonId}) ===`);
  let fails = 0;
  for (const r of results) {
    if (r.errorCode) {
      // Errors aren't necessarily failures — e.g. profiles RLS may forbid
      // SELECT in some configs. Note them but don't count as leaks.
      console.log(`  ! ${r.table}: query error ${r.errorCode} (${r.errorMessage})`);
      continue;
    }
    if (r.leakedRows.length > 0) {
      fails++;
      console.error(
        `  X ${r.table}: ${r.leakedRows.length} cross-salon row(s) visible — RLS LEAK`,
        r.leakedRows.slice(0, 3),
      );
      continue;
    }
    if (r.visible !== r.expected) {
      // Note but don't auto-fail: some tables (e.g. profiles) have policies
      // that intentionally limit visibility further than salon_id alone.
      console.log(`  ~ ${r.table}: visible ${r.visible} vs ground-truth ${r.expected} for this salon`);
      continue;
    }
    console.log(`  v ${r.table}: ${r.visible} row(s), all scoped correctly`);
  }
  return fails;
}

async function main(): Promise<void> {
  const url = envOrDie('NEXT_PUBLIC_SUPABASE_URL');
  const anon = envOrDie('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const service = envOrDie('SUPABASE_SERVICE_ROLE_KEY');

  const a: Creds = {
    email: envOrDie('AUDIT_SALON_A_USER_EMAIL'),
    password: envOrDie('AUDIT_SALON_A_USER_PASSWORD'),
  };
  const b: Creds = {
    email: envOrDie('AUDIT_SALON_B_USER_EMAIL'),
    password: envOrDie('AUDIT_SALON_B_USER_PASSWORD'),
  };

  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

  const aSession = await signedInClient(url, anon, a);
  const aSalon = await profileSalon(admin, aSession.userId);
  console.log(`User A (${a.email}) -> salon ${aSalon}`);

  const bSession = await signedInClient(url, anon, b);
  const bSalon = await profileSalon(admin, bSession.userId);
  console.log(`User B (${b.email}) -> salon ${bSalon}`);

  if (aSalon === bSalon) {
    throw new Error(`Both audit users belong to the same salon (${aSalon}); pick users from different salons.`);
  }

  const aResults: AuditResult[] = [];
  for (const t of TENANT_TABLES) aResults.push(await auditTableAsUser(aSession.sb, admin, t, aSalon));

  const bResults: AuditResult[] = [];
  for (const t of TENANT_TABLES) bResults.push(await auditTableAsUser(bSession.sb, admin, t, bSalon));

  const fails = reportUser('Salon A view', aSalon, aResults) + reportUser('Salon B view', bSalon, bResults);

  await aSession.sb.auth.signOut();
  await bSession.sb.auth.signOut();

  console.log('\n=== Summary ===');
  if (fails === 0) {
    console.log('OK: no cross-salon leaks detected across', TENANT_TABLES.length, 'tenant tables.');
    process.exit(0);
  }
  console.error(`FAIL: ${fails} table(s) leaked cross-salon rows. See output above.`);
  process.exit(1);
}

main().catch((err) => {
  console.error('Audit script crashed:', err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
