import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { deleteSalonCascade, isAuthUserOrphaned } from '@/lib/server/deleteSalonCascade';
import { canManageSalon } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/admin';

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

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from('profiles')
      .select('salon_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || !canManageSalon(profile.role)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Use the profile's own salon: only its owner may delete it (checked below).
    const salonId = profile.salon_id;
    if (!salonId) return NextResponse.json({ error: 'Salone non trovato' }, { status: 404 });

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
