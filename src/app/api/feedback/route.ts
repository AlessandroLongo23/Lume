import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeProfileRole, isAdmin as roleIsAdmin, isSalonStaff } from '@/lib/auth/roles';
import { sanitizeRichText } from '@/lib/utils/sanitizeRichText';

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

async function removeCommentsAttachments(supabaseAdmin: ReturnType<typeof getAdminClient>, feedbackId: string) {
  const { data: comments } = await supabaseAdmin
    .from('feedback_comments')
    .select('image_paths')
    .eq('feedback_id', feedbackId);
  if (!comments) return;
  const paths = comments
    .flatMap((c: { image_paths: string[] | null }) => c.image_paths ?? [])
    .filter(Boolean);
  if (paths.length > 0) {
    await supabaseAdmin.storage.from(BUCKET).remove(paths);
  }
}

const VALID_TYPES = ['suggestion', 'bug', 'idea'] as const;
const VALID_STATUSES = ['open', 'in_progress', 'completed', 'closed'] as const;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);

    if (!profile || !isSalonStaff(profile.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { type, title, description, image_paths } = body ?? {};

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ success: false, error: 'Tipo non valido' }, { status: 400 });
    }
    const trimmedTitle = typeof title === 'string' ? title.trim() : '';
    const trimmedDesc = typeof description === 'string' ? description.trim() : '';
    if (trimmedTitle.length < 3 || trimmedTitle.length > 120) {
      return NextResponse.json({ success: false, error: 'Il titolo deve avere tra 3 e 120 caratteri.' }, { status: 400 });
    }
    if (trimmedDesc.length < 1 || trimmedDesc.length > 4000) {
      return NextResponse.json({ success: false, error: 'La descrizione deve avere tra 1 e 4000 caratteri.' }, { status: 400 });
    }
    const sanitizedDesc = sanitizeRichText(trimmedDesc);
    if (sanitizedDesc.replace(/<[^>]*>/g, '').trim().length < 1) {
      return NextResponse.json({ success: false, error: 'La descrizione non può essere vuota.' }, { status: 400 });
    }
    const imgs = validateImagePaths(image_paths);
    if (imgs === null) {
      return NextResponse.json({ success: false, error: `Puoi allegare al massimo ${MAX_IMAGES} immagini.` }, { status: 400 });
    }

    const { data: inserted, error } = await supabase
      .from('feedback_entries')
      .insert({
        author_id: profile.id,
        type,
        title: trimmedTitle,
        description: sanitizedDesc,
        image_paths: imgs,
      })
      .select('id')
      .single();

    if (error) throw error;

    const supabaseAdmin = getAdminClient();
    const { data: entry } = await supabaseAdmin
      .from('feedback_entries_with_counts')
      .select('*')
      .eq('id', inserted.id)
      .single();

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[feedback POST]', error);
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

    const { id, status, title, description, image_paths, linked_branch, linked_pr_url } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID richiesto' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();
    const { data: existing } = await supabaseAdmin
      .from('feedback_entries')
      .select('author_id, status, image_paths')
      .eq('id', id)
      .single();
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Feedback non trovato' }, { status: 404 });
    }

    const isAuthor = existing.author_id === profile.id;
    const isAdminRole = roleIsAdmin(profile.role);
    const isAuthorOfOpenEntry = isAuthor && existing.status === 'open';

    const patch: Record<string, unknown> = {};

    // Status transitions: admin-only.
    if (status !== undefined) {
      if (!isAdminRole) {
        return NextResponse.json({ success: false, error: 'Solo gli admin possono cambiare lo stato' }, { status: 403 });
      }
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ success: false, error: 'Stato non valido' }, { status: 400 });
      }
      patch.status = status;
      patch.completed_at = status === 'completed' ? new Date().toISOString() : null;
    }

    // Title/description edits: admin-only (keeps existing behavior).
    if (typeof title === 'string') {
      if (!isAdminRole) {
        return NextResponse.json({ success: false, error: 'Solo gli admin possono modificare il titolo' }, { status: 403 });
      }
      const t = title.trim();
      if (t.length < 3 || t.length > 120) {
        return NextResponse.json({ success: false, error: 'Titolo non valido' }, { status: 400 });
      }
      patch.title = t;
    }
    if (typeof description === 'string') {
      if (!isAdminRole) {
        return NextResponse.json({ success: false, error: 'Solo gli admin possono modificare la descrizione' }, { status: 403 });
      }
      const d = description.trim();
      if (d.length < 1 || d.length > 4000) {
        return NextResponse.json({ success: false, error: 'Descrizione non valida' }, { status: 400 });
      }
      const sanitized = sanitizeRichText(d);
      if (sanitized.replace(/<[^>]*>/g, '').trim().length < 1) {
        return NextResponse.json({ success: false, error: 'La descrizione non può essere vuota.' }, { status: 400 });
      }
      patch.description = sanitized;
    }

    // image_paths: the entry's author may update them on an OPEN entry; admin any time.
    if (image_paths !== undefined) {
      if (!isAdminRole && !isAuthorOfOpenEntry) {
        return NextResponse.json({ success: false, error: 'Non puoi modificare gli allegati di questo feedback' }, { status: 403 });
      }
      const imgs = validateImagePaths(image_paths);
      if (imgs === null) {
        return NextResponse.json({ success: false, error: `Puoi allegare al massimo ${MAX_IMAGES} immagini.` }, { status: 400 });
      }
      patch.image_paths = imgs;

      const removedPaths = (existing.image_paths ?? []).filter((p: string) => !imgs.includes(p));
      if (removedPaths.length > 0) {
        await supabaseAdmin.storage.from(BUCKET).remove(removedPaths);
      }
    }

    // Agent scaffolding: admin-only.
    if (linked_branch !== undefined) {
      if (!isAdminRole) {
        return NextResponse.json({ success: false, error: 'Solo gli admin possono impostare linked_branch' }, { status: 403 });
      }
      if (linked_branch !== null && typeof linked_branch !== 'string') {
        return NextResponse.json({ success: false, error: 'linked_branch non valido' }, { status: 400 });
      }
      patch.linked_branch = linked_branch;
    }
    if (linked_pr_url !== undefined) {
      if (!isAdminRole) {
        return NextResponse.json({ success: false, error: 'Solo gli admin possono impostare linked_pr_url' }, { status: 403 });
      }
      if (linked_pr_url !== null && typeof linked_pr_url !== 'string') {
        return NextResponse.json({ success: false, error: 'linked_pr_url non valido' }, { status: 400 });
      }
      patch.linked_pr_url = linked_pr_url;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ success: false, error: 'Nessun cambiamento' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('feedback_entries').update(patch).eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[feedback PATCH]', error);
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
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID richiesto' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();
    const { data: entry } = await supabaseAdmin
      .from('feedback_entries')
      .select('author_id, status, image_paths')
      .eq('id', id)
      .single();

    if (!entry) {
      return NextResponse.json({ success: false, error: 'Feedback non trovato' }, { status: 404 });
    }

    const isAuthorOfOpenEntry = entry.author_id === profile.id && entry.status === 'open';
    if (!roleIsAdmin(profile.role) && !isAuthorOfOpenEntry) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // Gather every attachment (entry + comments) BEFORE the row/cascade deletion,
    // so the service role can sweep the storage bucket after the row delete succeeds.
    await removeCommentsAttachments(supabaseAdmin, id);

    const { error } = await supabaseAdmin.from('feedback_entries').delete().eq('id', id);
    if (error) throw error;

    if (entry.image_paths && entry.image_paths.length > 0) {
      await supabaseAdmin.storage.from(BUCKET).remove(entry.image_paths);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[feedback DELETE]', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
