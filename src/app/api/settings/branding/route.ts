import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { getActiveSalonId } from '@/lib/utils/getActiveSalonId';
import { normalizeProfileRole, canManageSalon } from '@/lib/auth/roles';

const BUCKET = 'salon-branding';
const MAX_BYTES = 5 * 1024 * 1024;
const LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
const FAVICON_TYPES = new Set(['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml']);

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function getAuthContext() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = getAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('salon_id, role')
    .eq('id', user.id)
    .single();
  if (!profile) return null;
  const role = normalizeProfileRole(profile);
  const salonId = await getActiveSalonId(profile.salon_id, role === 'admin');
  return { user, role, salonId, admin };
}

function extFromMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/svg+xml') return 'svg';
  if (mime === 'image/x-icon' || mime === 'image/vnd.microsoft.icon') return 'ico';
  return 'bin';
}

function pathFromPublicUrl(url: string): string | null {
  // ".../storage/v1/object/public/salon-branding/<path>"
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  if (!canManageSalon(ctx.role)) return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Dati non validi' }, { status: 400 });

  const kind = form.get('kind');
  const file = form.get('file');
  if (kind !== 'logo' && kind !== 'favicon') {
    return NextResponse.json({ error: 'Tipo non valido' }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File mancante' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File troppo grande (max 5 MB)' }, { status: 400 });
  }
  const allowed = kind === 'logo' ? LOGO_TYPES : FAVICON_TYPES;
  if (!allowed.has(file.type)) {
    return NextResponse.json({ error: 'Formato non supportato' }, { status: 400 });
  }

  const ext = extFromMime(file.type);
  const path = `${ctx.salonId}/${kind}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await ctx.admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true, cacheControl: '3600' });
  if (upErr) {
    console.error('Branding upload error:', upErr);
    return NextResponse.json({ error: 'Errore durante il caricamento' }, { status: 500 });
  }

  const { data: pub } = ctx.admin.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = pub.publicUrl;

  // Read previous URL to clean up the old object after a successful replace.
  const column = kind === 'logo' ? 'logo_url' : 'favicon_url';
  const { data: existing } = await ctx.admin
    .from('salons')
    .select(column)
    .eq('id', ctx.salonId)
    .single();
  const prev = (existing as Record<string, string | null> | null)?.[column] ?? null;

  const { error: dbErr } = await ctx.admin
    .from('salons')
    .update({ [column]: publicUrl })
    .eq('id', ctx.salonId);
  if (dbErr) {
    console.error('Branding DB update error:', dbErr);
    return NextResponse.json({ error: 'Errore durante il salvataggio' }, { status: 500 });
  }

  if (prev) {
    const oldPath = pathFromPublicUrl(prev);
    if (oldPath && oldPath !== path) {
      await ctx.admin.storage.from(BUCKET).remove([oldPath]).catch(() => {});
    }
  }

  return NextResponse.json({ success: true, url: publicUrl });
}

export async function DELETE(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  if (!canManageSalon(ctx.role)) return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });

  const url = new URL(req.url);
  const kind = url.searchParams.get('kind');
  if (kind !== 'logo' && kind !== 'favicon') {
    return NextResponse.json({ error: 'Tipo non valido' }, { status: 400 });
  }
  const column = kind === 'logo' ? 'logo_url' : 'favicon_url';

  const { data: existing } = await ctx.admin
    .from('salons')
    .select(column)
    .eq('id', ctx.salonId)
    .single();
  const prev = (existing as Record<string, string | null> | null)?.[column] ?? null;

  const { error } = await ctx.admin
    .from('salons')
    .update({ [column]: null })
    .eq('id', ctx.salonId);
  if (error) {
    console.error('Branding DB clear error:', error);
    return NextResponse.json({ error: 'Errore durante il salvataggio' }, { status: 500 });
  }

  if (prev) {
    const oldPath = pathFromPublicUrl(prev);
    if (oldPath) {
      await ctx.admin.storage.from(BUCKET).remove([oldPath]).catch(() => {});
    }
  }

  return NextResponse.json({ success: true });
}
