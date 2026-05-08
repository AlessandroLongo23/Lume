import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
    }

    const { token } = await request.json();
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ success: false, error: 'Token mancante' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();
    const { data, error } = await supabaseAdmin.rpc('claim_membership_invite', { p_token: token });

    if (error) {
      console.error('claim_membership_invite rpc error:', error);
      return NextResponse.json({ success: false, error: 'Errore interno' }, { status: 500 });
    }

    const result = data as { success?: boolean; error?: string; salon_id?: string };

    if (result.error) {
      const messages: Record<string, string> = {
        invite_not_found:       "Invito non trovato o già utilizzato.",
        invite_expired:         "L'invito è scaduto. Chiedi al titolare di inviarne uno nuovo.",
        invite_already_claimed: "Questo invito è già stato accettato.",
        invite_wrong_user:      "Questo invito è destinato a un altro account.",
        invite_declined:        "Questo invito è stato revocato.",
      };
      return NextResponse.json(
        { success: false, error: messages[result.error] ?? 'Richiesta non valida.' },
        { status: 400 },
      );
    }

    if (result.salon_id) {
      await supabaseAdmin
        .from('user_active_salon')
        .upsert(
          { user_id: user.id, salon_id: result.salon_id, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' },
        );
    }

    return NextResponse.json({ success: true, salon_id: result.salon_id });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error claiming invite:', msg);
    return NextResponse.json({ success: false, error: 'Errore interno' }, { status: 500 });
  }
}
