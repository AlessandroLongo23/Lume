import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { deleteSalonCascade, isAuthUserOrphaned } from '@/lib/server/deleteSalonCascade';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function DELETE(request: NextRequest) {
  try {
    // Self-delete is only for a salon's actual owner. Super-admins impersonating
    // another salon must use /api/platform/salons/[id] instead — otherwise they'd
    // end up nuking their own salon (profile.salon_id) while looking at someone else's.
    const cookieStore = await cookies();
    if (cookieStore.get('lume-impersonating')?.value === '1') {
      return NextResponse.json(
        { error: 'Impossibile eliminare durante l\'impersonazione. Usa la pagina Piattaforma.' },
        { status: 403 },
      );
    }

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const admin = getAdminClient();

    const { data: profile } = await admin
      .from('profiles')
      .select('salon_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'owner') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Use profile.salon_id directly — the cookie (getActiveSalonId) could point to
    // a salon this user is a client of, which would fail the owner_id check below.
    const salonId = profile.salon_id;

    const { data: salon } = await admin
      .from('salons')
      .select('name, owner_id')
      .eq('id', salonId)
      .single();

    if (!salon) return NextResponse.json({ error: 'Salone non trovato' }, { status: 404 });
    if (salon.owner_id !== user.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    const { confirmed_name } = await request.json();
    if (salon.name !== confirmed_name) {
      return NextResponse.json({ error: 'Il nome del salone non corrisponde' }, { status: 400 });
    }

    await deleteSalonCascade(salonId, admin);

    if (await isAuthUserOrphaned(admin, user.id)) {
      await admin.auth.admin.deleteUser(user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg =
      error instanceof Error
        ? error.message
        : error && typeof error === 'object' && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'Errore imprevisto';
    console.error('Delete workspace error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
