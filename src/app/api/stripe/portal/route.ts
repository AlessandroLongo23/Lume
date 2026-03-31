import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe/client';

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

    if (!profile || profile.role !== 'owner') {
      return NextResponse.json({ error: 'Solo il proprietario può gestire l\'abbonamento.' }, { status: 403 });
    }

    const { data: salon } = await supabaseAdmin
      .from('salons')
      .select('stripe_customer_id')
      .eq('id', profile.salon_id)
      .single();

    if (!salon?.stripe_customer_id) {
      return NextResponse.json({ error: 'Nessun abbonamento attivo.' }, { status: 400 });
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || '';

    const session = await stripe.billingPortal.sessions.create({
      customer: salon.stripe_customer_id,
      return_url: `${origin}/admin/subscribe`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json({ error: 'Errore durante l\'apertura del portale.' }, { status: 500 });
  }
}
