import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/gateway/requireAdmin';
import { PROSPECT_STATUSES, type ProspectStatus } from '@/lib/types/Prospect';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const TEXT_FIELDS = [
  'name', 'phone_shop', 'phone_personal', 'owner_name', 'google_maps_url',
  'comune_code', 'city', 'province', 'region', 'address',
  'current_software', 'notes',
] as const;

type TextField = typeof TEXT_FIELDS[number];

function pickText(body: Record<string, unknown>, key: TextField): string | null | undefined {
  if (!(key in body)) return undefined;
  const v = body[key];
  if (v === null) return null;
  if (typeof v !== 'string') return undefined;
  const trimmed = v.trim();
  return trimmed === '' ? null : trimmed;
}

// Statuses that imply we just made a phone call (bumps last_call_at and call_count).
const CALL_STAMPING_STATUSES: ProspectStatus[] = [
  'no_answer',
  'callback_scheduled',
  'not_interested',
  'no_pc',
  'interested',
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Corpo non valido' }, { status: 400 });
  }

  const admin = getAdminClient();

  // Read current row to know whether transitions imply timestamps.
  const { data: current, error: fetchError } = await admin
    .from('prospects')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !current) {
    return NextResponse.json({ error: 'Prospect non trovato' }, { status: 404 });
  }

  const patch: Record<string, unknown> = {};

  for (const f of TEXT_FIELDS) {
    const v = pickText(body, f);
    if (v !== undefined) patch[f] = v;
  }

  // Status transitions auto-stamp call timestamps and counters.
  if (typeof body.status === 'string') {
    if (!PROSPECT_STATUSES.includes(body.status as ProspectStatus)) {
      return NextResponse.json({ error: 'Stato non valido' }, { status: 400 });
    }
    const next = body.status as ProspectStatus;
    patch.status = next;

    if (CALL_STAMPING_STATUSES.includes(next)) {
      patch.last_call_at = new Date().toISOString();
      patch.call_count   = (current.call_count ?? 0) + 1;
    }
    if (next === 'materials_sent') {
      // Allow caller to override, otherwise stamp now
      if (!('materials_sent_at' in body)) patch.materials_sent_at = new Date().toISOString();
    }
    // Clear callback when moving past the callback_scheduled state
    if (next !== 'callback_scheduled' && current.callback_at && !('callback_at' in body)) {
      patch.callback_at = null;
    }
  }

  // Explicit callback_at handling (datetime picker payload)
  if ('callback_at' in body) {
    const v = body.callback_at;
    if (v === null || v === '') {
      patch.callback_at = null;
    } else if (typeof v === 'string' && !Number.isNaN(Date.parse(v))) {
      patch.callback_at = new Date(v).toISOString();
    } else {
      return NextResponse.json({ error: 'Data di richiamo non valida' }, { status: 400 });
    }
  }

  // Explicit materials_sent_at handling (rare)
  if ('materials_sent_at' in body) {
    const v = body.materials_sent_at;
    if (v === null || v === '') {
      patch.materials_sent_at = null;
    } else if (typeof v === 'string' && !Number.isNaN(Date.parse(v))) {
      patch.materials_sent_at = new Date(v).toISOString();
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ prospect: current });
  }

  const { data, error } = await admin
    .from('prospects')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('PATCH /api/platform/prospects/[id] error:', error);
    return NextResponse.json({ error: 'Impossibile aggiornare il prospect' }, { status: 500 });
  }
  return NextResponse.json({ prospect: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 });

  const admin = getAdminClient();
  const { error } = await admin.from('prospects').delete().eq('id', id);

  if (error) {
    console.error('DELETE /api/platform/prospects/[id] error:', error);
    return NextResponse.json({ error: 'Impossibile eliminare il prospect' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
