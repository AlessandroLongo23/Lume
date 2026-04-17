import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSuperAdmin } from '@/lib/gateway/requireSuperAdmin';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireSuperAdmin();
  if (guard.response) return guard.response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return NextResponse.json({ error: 'Nome mancante' }, { status: 400 });

  const supabaseAdmin = getAdminClient();
  const { error } = await supabaseAdmin.from('salons').update({ name }).eq('id', id);
  if (error) {
    console.error('Platform salon rename failed:', error);
    return NextResponse.json({ error: 'Rinomina fallita' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireSuperAdmin();
  if (guard.response) return guard.response;

  const { id } = await params;
  const supabaseAdmin = getAdminClient();

  // Hard delete. Tenant tables have salon_id FKs and should cascade via DB
  // constraints. If cascades are not configured, this will fail loudly and
  // the super-admin can clean up manually before retrying.
  const { error } = await supabaseAdmin.from('salons').delete().eq('id', id);
  if (error) {
    console.error('Platform salon delete failed:', error);
    return NextResponse.json({ error: 'Eliminazione fallita: ' + error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
