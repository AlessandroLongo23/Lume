import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import type { ReviewWithAuthor } from '@/lib/types/Review';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const MIN_RATING = 1;
const MAX_RATING = 5;
const MIN_MESSAGE = 1;
const MAX_MESSAGE = 2000;
const PUBLIC_MIN_RATING = 4;
const PUBLIC_LIMIT = 50;

export async function GET(request: NextRequest) {
  const mine = request.nextUrl.searchParams.get('mine') === '1';

  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (mine) {
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('author_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return NextResponse.json({ success: true, review: data ?? null });
    }

    // Public list — denormalized with author + salon using the admin client.
    // reviews.author_id FKs auth.users (not profiles), so PostgREST can't
    // infer the nested join; do it manually in two steps.
    return await publicList();
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[reviews GET]', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

async function publicList() {
  const admin = getAdminClient();
  const { data: rows, error } = await admin
    .from('reviews')
    .select('id, author_id, rating, message, created_at, updated_at')
    .gte('rating', PUBLIC_MIN_RATING)
    .order('created_at', { ascending: false })
    .limit(PUBLIC_LIMIT);
  if (error) throw error;

  const authorIds = [...new Set((rows ?? []).map((r) => r.author_id))];
  if (authorIds.length === 0) {
    return NextResponse.json({ success: true, reviews: [] });
  }

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, first_name, last_name, role, salon_id')
    .in('id', authorIds);

  const salonIds = [...new Set((profiles ?? []).map((p) => p.salon_id).filter(Boolean))];
  const { data: salons } = salonIds.length
    ? await admin.from('salons').select('id, name').in('id', salonIds)
    : { data: [] as { id: string; name: string | null }[] };

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const salonById = new Map((salons ?? []).map((s) => [s.id, s.name]));

  const reviews: ReviewWithAuthor[] = (rows ?? []).map((r) => {
    const p = profileById.get(r.author_id);
    return {
      id: r.id,
      author_id: r.author_id,
      rating: r.rating,
      message: r.message,
      created_at: r.created_at,
      updated_at: r.updated_at,
      author_first_name: p?.first_name ?? null,
      author_last_name: p?.last_name ?? null,
      author_role: (p?.role as 'owner' | 'operator') ?? 'operator',
      salon_name: p?.salon_id ? salonById.get(p.salon_id) ?? null : null,
    };
  });

  return NextResponse.json({ success: true, reviews });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Only owners/operators — clients should not leave platform reviews.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (!profile || (profile.role !== 'owner' && profile.role !== 'operator')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const rating = Number(body?.rating);
    const messageRaw = typeof body?.message === 'string' ? body.message.trim() : '';

    if (!Number.isInteger(rating) || rating < MIN_RATING || rating > MAX_RATING) {
      return NextResponse.json(
        { success: false, error: 'Il voto deve essere un intero tra 1 e 5.' },
        { status: 400 },
      );
    }
    if (messageRaw.length < MIN_MESSAGE || messageRaw.length > MAX_MESSAGE) {
      return NextResponse.json(
        { success: false, error: `Il messaggio deve avere tra ${MIN_MESSAGE} e ${MAX_MESSAGE} caratteri.` },
        { status: 400 },
      );
    }

    // Upsert on the unique author_id. RLS enforces author_id === auth.uid().
    const { data, error } = await supabase
      .from('reviews')
      .upsert(
        { author_id: user.id, rating, message: messageRaw },
        { onConflict: 'author_id' },
      )
      .select('*')
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, review: data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[reviews POST]', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase.from('reviews').delete().eq('author_id', user.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[reviews DELETE]', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
