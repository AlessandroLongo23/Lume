import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function DELETE(request: NextRequest) {
  try {
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

    // Verify the caller owns this salon and the confirmed name matches
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

    // ── Cascade deletion ──────────────────────────────────────────────────────

    // 1. Collect fiche IDs so we can delete fiche_services first
    const { data: fiches } = await admin
      .from('fiches')
      .select('id')
      .eq('salon_id', salonId);

    const ficheIds = (fiches ?? []).map((f: { id: string }) => f.id);

    if (ficheIds.length > 0) {
      const { error } = await admin.from('fiche_services').delete().in('fiche_id', ficheIds);
      if (error) throw error;
    }

    // 2. Fiches
    { const { error } = await admin.from('fiches').delete().eq('salon_id', salonId); if (error) throw error; }

    // 3. Orders (may reference products — delete before products)
    { const { error } = await admin.from('orders').delete().eq('salon_id', salonId); if (error) throw error; }

    // 4. Products
    { const { error } = await admin.from('products').delete().eq('salon_id', salonId); if (error) throw error; }

    // 5. Product categories
    { const { error } = await admin.from('product_categories').delete().eq('salon_id', salonId); if (error) throw error; }

    // 6. Services
    { const { error } = await admin.from('services').delete().eq('salon_id', salonId); if (error) throw error; }

    // 7. Service categories
    { const { error } = await admin.from('service_categories').delete().eq('salon_id', salonId); if (error) throw error; }

    // 8. Coupons
    { const { error } = await admin.from('coupons').delete().eq('salon_id', salonId); if (error) throw error; }

    // 9. Operators (bookable resources)
    { const { error } = await admin.from('operators').delete().eq('salon_id', salonId); if (error) throw error; }

    // 11. Manufacturers & suppliers (salon-scoped metadata)
    { const { error } = await admin.from('manufacturers').delete().eq('salon_id', salonId); if (error) throw error; }
    { const { error } = await admin.from('suppliers').delete().eq('salon_id', salonId); if (error) throw error; }

    // 12. Smart client deletion:
    //     Remove this salon's client rows, then garbage-collect any auth identities
    //     that are no longer referenced anywhere in the system.
    const { data: salonClients } = await admin
      .from('clients')
      .select('user_id')
      .eq('salon_id', salonId);

    const clientUserIds = [
      ...new Set(
        (salonClients ?? [])
          .map((c: { user_id: string | null }) => c.user_id)
          .filter((id): id is string => id !== null),
      ),
    ];

    { const { error } = await admin.from('clients').delete().eq('salon_id', salonId); if (error) throw error; }

    // For each former client, delete their auth identity only if they're now
    // completely orphaned (not an owner, operator, or client of any other salon).
    await Promise.all(
      clientUserIds.map(async (userId) => {
        const [
          { count: ownerCount },
          { count: operatorCount },
          { count: clientCount },
        ] = await Promise.all([
          admin.from('salons').select('*', { count: 'exact', head: true }).eq('owner_id', userId),
          admin.from('operators').select('*', { count: 'exact', head: true }).eq('user_id', userId),
          admin.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        ]);

        if ((ownerCount ?? 0) + (operatorCount ?? 0) + (clientCount ?? 0) === 0) {
          await admin.auth.admin.deleteUser(userId);
        }
      }),
    );

    // 14. Owner's profile
    { const { error } = await admin.from('profiles').delete().eq('salon_id', salonId); if (error) throw error; }

    // 15. Referral credits (either side)
    { const { error } = await admin.from('referral_credits').delete().or(`referrer_salon_id.eq.${salonId},referred_salon_id.eq.${salonId}`); if (error) throw error; }

    // 16. Delete the salon itself
    { const { error } = await admin.from('salons').delete().eq('id', salonId); if (error) throw error; }

    // 17. Garbage-collect the owner's auth identity if they have no other workspaces
    const [
      { count: remainingSalons },
      { count: remainingOperators },
      { count: remainingClients },
    ] = await Promise.all([
      admin.from('salons').select('*', { count: 'exact', head: true }).eq('owner_id', user.id),
      admin.from('operators').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      admin.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);

    if ((remainingSalons ?? 0) + (remainingOperators ?? 0) + (remainingClients ?? 0) === 0) {
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
