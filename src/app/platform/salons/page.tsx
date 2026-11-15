import Link from 'next/link';
import { Building2, Plus } from 'lucide-react';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { Button } from '@/lib/components/shared/ui/Button';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { SalonCard, type SalonCardRow } from '@/lib/components/platform/SalonCard';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

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
  const supabase = createAdminClient();

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
        actions={
          <Button asChild variant="primary" size="md">
            <Link href="/platform/salons/new">
              <Plus aria-hidden />
              <span>Nuovo salone</span>
            </Link>
          </Button>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nessun salone"
          description="Nessun salone è ancora registrato sulla piattaforma."
        />
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
