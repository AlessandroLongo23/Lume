import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

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
    .select('id, role, is_super_admin')
    .eq('id', user.id)
    .single();

  return profile as { id: string; role: string; is_super_admin: boolean } | null;
}

const VALID_TYPES = ['suggestion', 'bug', 'idea'] as const;
const VALID_STATUSES = ['open', 'in_progress', 'completed', 'closed'] as const;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);

    if (!profile || (profile.role !== 'owner' && profile.role !== 'operator')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { type, title, description } = body ?? {};

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

    const { data: inserted, error } = await supabase
      .from('feedback_entries')
      .insert({
        author_id: profile.id,
        type,
        title: trimmedTitle,
        description: trimmedDesc,
      })
      .select('id')
      .single();

    if (error) throw error;

    // Re-read from the view so the response carries author_first_name/last_name
    // and a derived upvote_count (0 at this point).
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

    if (!profile || !profile.is_super_admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id, status, title, description } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID richiesto' }, { status: 400 });
    }

    const patch: Record<string, unknown> = {};
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ success: false, error: 'Stato non valido' }, { status: 400 });
      }
      patch.status = status;
      patch.completed_at = status === 'completed' ? new Date().toISOString() : null;
    }
    if (typeof title === 'string') {
      const t = title.trim();
      if (t.length < 3 || t.length > 120) {
        return NextResponse.json({ success: false, error: 'Titolo non valido' }, { status: 400 });
      }
      patch.title = t;
    }
    if (typeof description === 'string') {
      const d = description.trim();
      if (d.length < 1 || d.length > 4000) {
        return NextResponse.json({ success: false, error: 'Descrizione non valida' }, { status: 400 });
      }
      patch.description = d;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ success: false, error: 'Nessun cambiamento' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();
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
      .select('author_id, status')
      .eq('id', id)
      .single();

    if (!entry) {
      return NextResponse.json({ success: false, error: 'Feedback non trovato' }, { status: 404 });
    }

    const isAuthorOfOpenEntry = entry.author_id === profile.id && entry.status === 'open';
    if (!profile.is_super_admin && !isAuthorOfOpenEntry) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { error } = await supabaseAdmin.from('feedback_entries').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[feedback DELETE]', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
