import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/gateway/requireAdmin';
import { deleteSalonCascade, isAuthUserOrphaned } from '@/lib/server/deleteSalonCascade';

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
  const guard = await requireAdmin();
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const { id } = await params;
  const admin = getAdminClient();

  try {
    const { data: salon, error: salonErr } = await admin
      .from('salons')
      .select('name, owner_id')
      .eq('id', id)
      .single();
    if (salonErr || !salon) {
      return NextResponse.json({ error: 'Salone non trovato' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const confirmedName = typeof body.confirmed_name === 'string' ? body.confirmed_name : '';
    if (salon.name !== confirmedName) {
      return NextResponse.json({ error: 'Il nome del salone non corrisponde' }, { status: 400 });
    }

    const { ownerId } = await deleteSalonCascade(id, admin);

    if (ownerId && await isAuthUserOrphaned(admin, ownerId)) {
      await admin.auth.admin.deleteUser(ownerId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Errore imprevisto';
    console.error('Platform salon delete failed:', error);
    return NextResponse.json({ error: 'Eliminazione fallita: ' + msg }, { status: 500 });
  }
}
