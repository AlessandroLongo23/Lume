import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getCallerProfile } from '@/lib/gateway/getCallerProfile';
import { isOwner } from '@/lib/auth/roles';
import OnboardingImportClient from './OnboardingImportClient';

export const dynamic = 'force-dynamic';

/**
 * Server-side gate for /onboarding/import.
 *
 * - Non-owners are bounced to the public landing.
 * - Owners with `salons.onboarded_at IS NOT NULL` AND no open onboarding go to
 *   the calendar (defends against a bookmarked URL after the flow's done).
 * - Owners with an open onboarding (or no onboarded_at yet) see the wizard.
 */
export default async function OnboardingImportPage() {
  const supabase = await createServerClient();
  const profile = await getCallerProfile(supabase);
  if (!profile || !isOwner(profile.role)) redirect('/');

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const [{ data: salon }, { data: openOnboarding }] = await Promise.all([
    admin
      .from('salons')
      .select('id, name, onboarded_at')
      .eq('id', profile.salon_id)
      .maybeSingle(),
    admin
      .from('onboarding_imports')
      .select('id, status')
      .eq('salon_id', profile.salon_id)
      .not('status', 'in', '(completed,skipped,failed)')
      .maybeSingle(),
  ]);

  if (!salon) redirect('/');
  if (salon.onboarded_at && !openOnboarding) redirect('/admin/calendario');

  return (
    <OnboardingImportClient
      salonName={salon.name}
      existingOnboardingId={openOnboarding?.id ?? null}
    />
  );
}
