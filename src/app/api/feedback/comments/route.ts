import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeProfileRole, isSalonStaff } from '@/lib/auth/roles';
import { sanitizeRichText } from '@/lib/utils/sanitizeRichText';

const EDIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_IMAGES = 4;
const BUCKET = 'feedback-attachments';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getCallerProfile(supabase: Awaited<ReturnType<typeof createServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const supabaseAdmin = getAdminClient();
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (!profile) return null;
  const role = normalizeProfileRole(profile);
  if (!role) return null;
  return { id: profile.id as string, role };
}

function validateImagePaths(paths: unknown): string[] | null {
  if (paths === undefined || paths === null) return [];
  if (!Array.isArray(paths)) return null;
  if (paths.length > MAX_IMAGES) return null;
  if (!paths.every((p) => typeof p === 'string' && p.length > 0 && p.length < 500)) return null;
  return paths as string[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);

    if (!profile || !isSalonStaff(profile.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { feedback_id, body: commentBody, image_paths } = body ?? {};

    if (typeof feedback_id !== 'string' || feedback_id.length === 0) {
      return NextResponse.json({ success: false, error: 'feedback_id richiesto' }, { status: 400 });
    }
    const trimmed = typeof commentBody === 'string' ? commentBody.trim() : '';
    if (trimmed.length < 1 || trimmed.length > 4000) {
      return NextResponse.json({ success: false, error: 'Il commento deve avere tra 1 e 4000 caratteri.' }, { status: 400 });
    }
    const sanitized = sanitizeRichText(trimmed);
    if (sanitized.replace(/<[^>]*>/g, '').trim().length < 1) {
      return NextResponse.json({ success: false, error: 'Il commento non può essere vuoto.' }, { status: 400 });
    }
    const imgs = validateImagePaths(image_paths);
    if (imgs === null) {
      return NextResponse.json({ success: false, error: `Puoi allegare al massimo ${MAX_IMAGES} immagini.` }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    const { data: entryExists } = await supabaseAdmin
      .from('feedback_entries')
      .select('id')
      .eq('id', feedback_id)
      .single();
    if (!entryExists) {
      return NextResponse.json({ success: false, error: 'Feedback non trovato' }, { status: 404 });
    }

    const { data: inserted, error } = await supabase
      .from('feedback_comments')
      .insert({
        feedback_id,
        author_id: profile.id,
        body: sanitized,
        image_paths: imgs,
      })
      .select('id')
      .single();

    if (error) throw error;

    const { data: comment, error: viewErr } = await supabaseAdmin
      .from('feedback_comments_with_author')
      .select('*')
      .eq('id', inserted.id)
      .single();
    if (viewErr || !comment) throw viewErr ?? new Error('Commento non trovato dopo inserimento');

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[feedback/comments POST]', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);
    if (!profile) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id, body: nextBody, image_paths } = await request.json();
    if (typeof id !== 'string' || id.length === 0) {
      return NextResponse.json({ success: false, error: 'ID richiesto' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();
    const { data: existing } = await supabaseAdmin
      .from('feedback_comments')
      .select('id, author_id, created_at, image_paths')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Commento non trovato' }, { status: 404 });
    }
    if (existing.author_id !== profile.id) {
      return NextResponse.json({ success: false, error: 'Puoi modificare solo i tuoi commenti' }, { status: 403 });
    }

    const ageMs = Date.now() - new Date(existing.created_at).getTime();
    if (ageMs > EDIT_WINDOW_MS) {
      return NextResponse.json({ success: false, error: 'Il tempo per modificare questo commento è scaduto (15 minuti).' }, { status: 403 });
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof nextBody === 'string') {
      const trimmed = nextBody.trim();
      if (trimmed.length < 1 || trimmed.length > 4000) {
        return NextResponse.json({ success: false, error: 'Il commento deve avere tra 1 e 4000 caratteri.' }, { status: 400 });
      }
      const sanitized = sanitizeRichText(trimmed);
      if (sanitized.replace(/<[^>]*>/g, '').trim().length < 1) {
        return NextResponse.json({ success: false, error: 'Il commento non può essere vuoto.' }, { status: 400 });
      }
      patch.body = sanitized;
    }
    if (image_paths !== undefined) {
      const imgs = validateImagePaths(image_paths);
      if (imgs === null) {
        return NextResponse.json({ success: false, error: `Puoi allegare al massimo ${MAX_IMAGES} immagini.` }, { status: 400 });
      }
      patch.image_paths = imgs;

      // Clean up any images that were removed in the edit.
      const removedPaths = (existing.image_paths ?? []).filter((p: string) => !imgs.includes(p));
      if (removedPaths.length > 0) {
        await supabaseAdmin.storage.from(BUCKET).remove(removedPaths);
      }
    }

    if (Object.keys(patch).length === 1) {
      return NextResponse.json({ success: false, error: 'Nessun cambiamento' }, { status: 400 });
    }

    const { error: updateErr } = await supabaseAdmin
      .from('feedback_comments')
      .update(patch)
      .eq('id', id);
    if (updateErr) throw updateErr;

    const { data: comment, error: viewErr } = await supabaseAdmin
      .from('feedback_comments_with_author')
      .select('*')
      .eq('id', id)
      .single();
    if (viewErr || !comment) throw viewErr ?? new Error('Commento non trovato dopo aggiornamento');

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[feedback/comments PATCH]', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);
    if (!profile) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await request.json();
    if (typeof id !== 'string' || id.length === 0) {
      return NextResponse.json({ success: false, error: 'ID richiesto' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();
    const { data: existing } = await supabaseAdmin
      .from('feedback_comments')
      .select('id, author_id, image_paths')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Commento non trovato' }, { status: 404 });
    }
    if (existing.author_id !== profile.id) {
      return NextResponse.json({ success: false, error: 'Puoi eliminare solo i tuoi commenti' }, { status: 403 });
    }

    const { error } = await supabaseAdmin.from('feedback_comments').delete().eq('id', id);
    if (error) throw error;

    if (existing.image_paths && existing.image_paths.length > 0) {
      await supabaseAdmin.storage.from(BUCKET).remove(existing.image_paths);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[feedback/comments DELETE]', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
