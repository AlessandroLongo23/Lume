import Link from 'next/link';
import { Building2, Plus } from 'lucide-react';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { SalonCard, type SalonCardRow } from '@/lib/components/platform/SalonCard';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

type SalonRow = {
  id:                   string;
  name:                 string;
  owner_id:             string;
  trial_ends_at:        string;
  created_at:           string;
  subscription_status:  string;
  subscription_plan:    string | null;
  subscription_ends_at: string | null;
  logo_url:             string | null;
  is_test:              boolean;
};

type ProfileRow = { id: string; email: string; first_name: string; last_name: string };

export default async function SalonsPage() {
  const supabase = getAdminClient();

  const { data: salons } = await supabase
    .from('salons')
    .select('id, name, owner_id, trial_ends_at, created_at, subscription_status, subscription_plan, subscription_ends_at, logo_url, is_test')
    .order('created_at', { ascending: false })
    .returns<SalonRow[]>();

  const salonIds = (salons ?? []).map((s) => s.id);
  const ownerIds = [...new Set((salons ?? []).map((s) => s.owner_id))];

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  type StatsRow = {
    salon_id:          string;
    clients_count:     number;
    fiches_this_month: number;
    services_revenue:  number;
    products_revenue:  number;
  };

  const [ownersRes, statsRaw] = await Promise.all([
    ownerIds.length
      ? supabase.from('profiles').select('id, email, first_name, last_name').in('id', ownerIds).returns<ProfileRow[]>()
      : Promise.resolve({ data: [] as ProfileRow[] }),
    salonIds.length
      ? supabase.rpc('platform_salon_stats', { p_salon_ids: salonIds, p_month_start: monthStart.toISOString() })
      : Promise.resolve({ data: null }),
  ]);

  const ownerById = new Map((ownersRes.data ?? []).map((o) => [o.id, o]));
  const statsRows = (statsRaw.data ?? []) as StatsRow[];

  const statsBySalon = new Map(
    statsRows.map((r) => [
      r.salon_id,
      {
        clients: Number(r.clients_count),
        fiches:  Number(r.fiches_this_month),
        revenue: Number(r.services_revenue) + Number(r.products_revenue),
      },
    ])
  );

  const rows: SalonCardRow[] = (salons ?? []).map((s) => {
    const owner = ownerById.get(s.owner_id);
    return {
      id:                   s.id,
      name:                 s.name,
      logoUrl:              s.logo_url,
      ownerEmail:           owner?.email ?? '—',
      ownerName:            owner ? `${owner.first_name} ${owner.last_name}`.trim() : '',
      subscriptionStatus:   s.subscription_status,
      subscriptionPlan:     s.subscription_plan,
      subscriptionEndsAt:   s.subscription_ends_at,
      trialEndsAt:          s.trial_ends_at,
      createdAt:            s.created_at,
      clientsCount:         statsBySalon.get(s.id)?.clients ?? 0,
      fichesThisMonth:      statsBySalon.get(s.id)?.fiches ?? 0,
      revenueThisMonth:     statsBySalon.get(s.id)?.revenue ?? 0,
      isTest:               s.is_test,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Saloni"
        subtitle={`${rows.length} ${rows.length === 1 ? 'salone' : 'saloni'} sulla piattaforma`}
        icon={Building2}
        actions={
          <Link
            href="/platform/salons/new"
            className="flex flex-row items-center whitespace-nowrap justify-center px-4 py-2 gap-2 text-sm font-thin transition-all bg-black hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-lg border border-zinc-500/25"
          >
            <Plus className="size-5" />
            <span>Nuovo salone</span>
          </Link>
        }
      />

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500 dark:text-zinc-400">
          <Building2 className="size-10 mb-3" strokeWidth={1.5} />
          <p className="text-sm">Nessun salone ancora registrato.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((row) => (
            <SalonCard key={row.id} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}
