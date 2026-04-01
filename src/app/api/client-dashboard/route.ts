import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Returns all upcoming fiches for the authenticated user across ALL salons.
 *
 * Uses the authenticated client (not admin) so Supabase RLS is respected.
 *
 * REQUIRED RLS POLICY on `fiches`:
 *   CREATE POLICY "clients_can_view_own_fiches"
 *   ON fiches FOR SELECT
 *   USING (
 *     client_id IN (
 *       SELECT id FROM clients WHERE user_id = auth.uid()
 *     )
 *   );
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    // Step 1: find all client records linked to this auth user, with salon info
    const { data: clientRows, error: clientError } = await supabase
      .from('clients')
      .select('id, salon_id, salons(id, name)')
      .eq('user_id', user.id);

    if (clientError) {
      console.error('client-dashboard clients query error:', clientError);
      return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
    }

    if (!clientRows?.length) {
      return NextResponse.json([]);
    }

    // Build a map from client_id → salon info for enriching fiche results
    const clientSalonMap = new Map<string, { id: string; name: string }>(
      clientRows.map((c) => {
        const salon = c.salons as { id: string; name: string } | null;
        return [c.id, salon ?? { id: c.salon_id, name: 'Salone' }];
      }),
    );

    const clientIds = clientRows.map((c) => c.id);

    // Step 2: fetch upcoming fiches for all client IDs (RLS enforces ownership)
    const { data: fiches, error: fichesError } = await supabase
      .from('fiches')
      .select('id, date, total, status, client_id')
      .in('client_id', clientIds)
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true });

    if (fichesError) {
      console.error('client-dashboard fiches query error:', fichesError);
      return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
    }

    // Step 3: enrich each fiche with the salon name
    const result = (fiches ?? []).map((f) => {
      const salon = clientSalonMap.get(f.client_id);
      return {
        id:        f.id,
        date:      f.date,
        total:     f.total,
        status:    f.status,
        salonId:   salon?.id   ?? null,
        salonName: salon?.name ?? 'Salone',
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('client-dashboard error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
