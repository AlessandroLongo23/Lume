import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveWorkspace } from '@/lib/gateway/resolveWorkspace';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const result = await resolveWorkspace(user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Gateway error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
