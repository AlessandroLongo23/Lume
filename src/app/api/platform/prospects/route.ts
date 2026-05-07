import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/gateway/requireAdmin';
import type { ProspectStatus } from '@/lib/types/Prospect';
import { PROSPECT_STATUSES } from '@/lib/types/Prospect';

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

export async function GET() {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const admin = getAdminClient();
  const { data, error } = await admin
    .from('prospects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('GET /api/platform/prospects error:', error);
    return NextResponse.json({ error: 'Impossibile caricare i prospect' }, { status: 500 });
  }
  return NextResponse.json({ prospects: data ?? [] });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Corpo non valido' }, { status: 400 });
  }

  const name = pickText(body, 'name');
  if (!name) return NextResponse.json({ error: 'Il nome del salone è obbligatorio' }, { status: 400 });

  const insert: Record<string, unknown> = { name, created_by: guard.user.id };
  for (const f of TEXT_FIELDS) {
    if (f === 'name') continue;
    const v = pickText(body, f);
    if (v !== undefined) insert[f] = v;
  }

  // Optional initial status (rarely used — usually defaults to 'not_contacted')
  if (typeof body.status === 'string' && PROSPECT_STATUSES.includes(body.status as ProspectStatus)) {
    insert.status = body.status;
  }

  const admin = getAdminClient();
  const { data, error } = await admin
    .from('prospects')
    .insert(insert)
    .select()
    .single();

  if (error) {
    console.error('POST /api/platform/prospects error:', error);
    return NextResponse.json({ error: 'Impossibile creare il prospect' }, { status: 500 });
  }
  return NextResponse.json({ prospect: data });
}
