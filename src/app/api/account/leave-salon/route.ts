import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeProfileRole } from '@/lib/auth/roles';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * Lets an operator detach themselves from their current salon. Owners must
 * delete the workspace instead (existing flow), and admins (super-admins)
 * have no salon binding to leave. After success the client should sign out.
 */
export async function POST() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const admin = getAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, salon_id, role')
    .eq('id', user.id)
    .single();
  if (!profile) return NextResponse.json({ error: 'Profilo non trovato' }, { status: 404 });

  const role = normalizeProfileRole(profile);
  if (role !== 'operator') {
    return NextResponse.json(
      { error: 'Solo gli operatori possono lasciare il salone' },
      { status: 403 },
    );
  }
  if (!profile.salon_id) {
    return NextResponse.json({ error: 'Nessun salone associato' }, { status: 400 });
  }

  // Archive the operator record bound to this user (if any) so audit trails
  // and historical fiches still reference the original operator id.
  const nowIso = new Date().toISOString();
  await admin
    .from('operators')
    .update({ archived_at: nowIso, user_id: null })
    .eq('user_id', user.id)
    .eq('salon_id', profile.salon_id)
    .is('archived_at', null);

  // Detach the profile from the salon. Keep the row so historical references stay valid.
  const { error } = await admin
    .from('profiles')
    .update({ salon_id: null })
    .eq('id', user.id);
  if (error) {
    console.error('Leave salon update error:', error);
    return NextResponse.json({ error: 'Errore durante l\'operazione' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
