import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import type { ProfilePreferences } from '@/lib/types/Preferences';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function getUser() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const admin = getAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('first_name, last_name, email, avatar_url, preferences')
    .eq('id', user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Profilo non trovato' }, { status: 404 });
  }

  return NextResponse.json({
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    avatar_url: data.avatar_url,
    preferences: (data.preferences ?? {}) as ProfilePreferences,
  });
}

const ALLOWED_KEYS = new Set([
  'appearance',
  'defaultViews',
  'tabs',
  'calendar',
  'notifications',
]);

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function deepMerge<T extends Record<string, unknown>>(base: T, patch: Record<string, unknown>): T {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (isPlainObject(v) && isPlainObject(out[k])) {
      out[k] = deepMerge(out[k] as Record<string, unknown>, v);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!isPlainObject(body)) {
    return NextResponse.json({ error: 'Dati non validi' }, { status: 400 });
  }

  const admin = getAdminClient();

  // ── Profile-level fields (first_name, last_name, avatar_url) ──────────────
  const profileUpdates: Record<string, unknown> = {};
  if (typeof body.first_name === 'string') {
    const trimmed = body.first_name.trim();
    if (trimmed.length < 1 || trimmed.length > 80) {
      return NextResponse.json({ error: 'Nome non valido' }, { status: 400 });
    }
    profileUpdates.first_name = trimmed;
  }
  if (typeof body.last_name === 'string') {
    const trimmed = body.last_name.trim();
    if (trimmed.length < 1 || trimmed.length > 80) {
      return NextResponse.json({ error: 'Cognome non valido' }, { status: 400 });
    }
    profileUpdates.last_name = trimmed;
  }
  if (body.avatar_url === null || typeof body.avatar_url === 'string') {
    profileUpdates.avatar_url = body.avatar_url;
  }

  // ── Preferences merge ────────────────────────────────────────────────────
  let mergedPrefs: ProfilePreferences | undefined;
  if (isPlainObject(body.preferences)) {
    for (const k of Object.keys(body.preferences)) {
      if (!ALLOWED_KEYS.has(k)) {
        return NextResponse.json(
          { error: `Chiave non consentita: ${k}` },
          { status: 400 },
        );
      }
    }

    const { data: current, error: readErr } = await admin
      .from('profiles')
      .select('preferences')
      .eq('id', user.id)
      .single();
    if (readErr || !current) {
      return NextResponse.json({ error: 'Profilo non trovato' }, { status: 404 });
    }

    const base = (current.preferences ?? {}) as Record<string, unknown>;
    mergedPrefs = deepMerge(base, body.preferences) as ProfilePreferences;
  }

  if (mergedPrefs !== undefined) profileUpdates.preferences = mergedPrefs;

  if (Object.keys(profileUpdates).length === 0) {
    return NextResponse.json({ error: 'Nessun dato da aggiornare' }, { status: 400 });
  }

  const { error: updateErr } = await admin
    .from('profiles')
    .update(profileUpdates)
    .eq('id', user.id);

  if (updateErr) {
    console.error('Preferences update error:', updateErr);
    return NextResponse.json({ error: 'Errore durante il salvataggio' }, { status: 500 });
  }

  return NextResponse.json({ success: true, preferences: mergedPrefs });
}
