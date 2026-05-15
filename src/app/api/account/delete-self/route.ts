import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { isAuthUserOrphaned } from '@/lib/server/deleteSalonCascade';

// GDPR Art. 17 — Right to erasure ("right to be forgotten").
// Self-service hard delete of the current user's auth identity + profile.
// Only available when the user is no longer attached to any salon — owners
// must delete their salon (cascade) first via /api/workspaces/delete; operators
// must call /api/account/leave-salon first.
//
// Logged in data_subject_requests for SLA proof.

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function DELETE() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const admin = getAdminClient();

  // Refuse if the user still owns or works at any salon. They must clean up
  // those bindings first, otherwise we'd silently orphan tenant data.
  const [{ count: ownerCount }, { count: operatorCount }, { count: clientCount }] = await Promise.all([
    admin.from('salons').select('*', { count: 'exact', head: true }).eq('owner_id', user.id),
    admin.from('operators').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    admin.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ]);

  if ((ownerCount ?? 0) > 0) {
    return NextResponse.json({
      error: 'Sei ancora proprietario di un salone. Elimina prima il salone dalla pagina account.',
      code: 'STILL_OWNER',
    }, { status: 409 });
  }
  if ((operatorCount ?? 0) > 0) {
    return NextResponse.json({
      error: 'Sei ancora operatore di un salone. Esci prima dal salone.',
      code: 'STILL_OPERATOR',
    }, { status: 409 });
  }
  if ((clientCount ?? 0) > 0) {
    return NextResponse.json({
      error: 'Sei registrato come cliente di uno o più saloni. Contatta il salone per la cancellazione, oppure scrivi a privacy@lumeapp.it.',
      code: 'STILL_CLIENT',
    }, { status: 409 });
  }

  // Log the request BEFORE the cascade — once the auth row is gone the
  // FK on data_subject_requests.user_id becomes NULL (on delete set null).
  await admin.from('data_subject_requests').insert({
    salon_id:          null,
    user_id:           user.id,
    request_type:      'erasure',
    requested_at:      new Date().toISOString(),
    fulfilled_at:      new Date().toISOString(),
    fulfillment_notes: 'self-service delete via /api/account/delete-self',
  });

  // Profile row first (cascades will handle the rest of the public schema).
  await admin.from('profiles').delete().eq('id', user.id);

  // Memberships and active-salon: clean up explicitly in case CASCADE isn't set.
  await admin.from('user_salon_memberships').delete().eq('user_id', user.id);
  await admin.from('user_active_salon').delete().eq('user_id', user.id);

  // Belt-and-suspenders: only delete the auth identity if it really is orphaned.
  if (await isAuthUserOrphaned(admin, user.id)) {
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error('delete-self auth deleteUser failed:', error);
      return NextResponse.json({ error: 'Errore durante la cancellazione dell\'account.' }, { status: 500 });
    }
  } else {
    // Should not happen given the checks above, but log loudly if it does.
    console.error('delete-self: user not orphaned after cleanup', user.id);
    return NextResponse.json({ error: 'Cancellazione incompleta. Contatta il supporto.' }, { status: 500 });
  }

  // Sign out is the caller's responsibility (POST /auth/logout).
  return NextResponse.json({ success: true });
}
