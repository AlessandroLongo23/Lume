import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe/client';
import { canManageSalon } from '@/lib/auth/roles';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('salon_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || !canManageSalon(profile.role)) {
      return NextResponse.json({ error: 'Solo il proprietario può riattivare l\'abbonamento.' }, { status: 403 });
    }

    const { data: salon } = await supabaseAdmin
      .from('salons')
      .select('stripe_subscription_id')
      .eq('id', profile.salon_id)
      .single();

    if (!salon?.stripe_subscription_id) {
      return NextResponse.json({ error: 'Nessun abbonamento da riattivare.' }, { status: 400 });
    }

    await getStripe().subscriptions.update(salon.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    // Stamp the most recent open cancellation row as reactivated for retention reporting.
    const { data: latest } = await supabaseAdmin
      .from('subscription_cancellations')
      .select('id')
      .eq('salon_id', profile.salon_id)
      .is('reactivated_at', null)
      .order('canceled_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latest?.id) {
      await supabaseAdmin
        .from('subscription_cancellations')
        .update({ reactivated_at: new Date().toISOString() })
        .eq('id', latest.id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Reactivate error:', error);
    return NextResponse.json({ error: 'Errore durante la riattivazione dell\'abbonamento.' }, { status: 500 });
  }
}
