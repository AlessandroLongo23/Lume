import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { canManageSalon, isSalonStaff } from '@/lib/auth/roles';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function getCallerProfile(supabase: Awaited<ReturnType<typeof createServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = getAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, salon_id, role')
    .eq('id', user.id)
    .single();
  return profile;
}

type IncomingAbbonamento = {
  client_id: string;
  scope_service_ids: string[];
  total_treatments: number;
  pricing_mode: 'percent' | 'manual';
  discount_percent?: number | null;
  total_paid: number;
  sale_payment_method: 'cash' | 'card' | 'transfer';
  valid_from?: string | null;
  valid_until?: string | null;
  notes?: string | null;
  is_active?: boolean;
};

function validateCreate(a: Partial<IncomingAbbonamento>): string | null {
  if (!a.client_id) return 'Cliente mancante';
  if (!a.scope_service_ids || a.scope_service_ids.length === 0) return 'Seleziona almeno un servizio';
  if (!a.total_treatments || a.total_treatments < 1) return 'Numero di sedute non valido';
  if (!a.pricing_mode || !['percent', 'manual'].includes(a.pricing_mode)) return 'Modalità di prezzo non valida';
  if (a.pricing_mode === 'percent' && (a.discount_percent == null || a.discount_percent < 0 || a.discount_percent > 100)) {
    return 'Percentuale di sconto non valida (0–100)';
  }
  if (a.total_paid == null || a.total_paid < 0) return 'Importo incassato non valido';
  if (!a.sale_payment_method || !['cash', 'card', 'transfer'].includes(a.sale_payment_method)) {
    return 'Metodo di pagamento non valido';
  }
  if (a.valid_from && a.valid_until && new Date(a.valid_from) > new Date(a.valid_until)) {
    return 'La data di inizio deve precedere la scadenza';
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);
    if (!profile || !isSalonStaff(profile.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { abbonamento } = await request.json() as { abbonamento: Partial<IncomingAbbonamento> };
    const err = validateCreate(abbonamento);
    if (err) return NextResponse.json({ success: false, error: err }, { status: 400 });

    const admin = getAdminClient();

    const insertRow = {
      salon_id: profile.salon_id,
      client_id: abbonamento.client_id!,
      scope_service_ids: abbonamento.scope_service_ids!,
      total_treatments: abbonamento.total_treatments!,
      pricing_mode: abbonamento.pricing_mode!,
      discount_percent: abbonamento.pricing_mode === 'percent' ? abbonamento.discount_percent : null,
      total_paid: abbonamento.total_paid!,
      sale_payment_method: abbonamento.sale_payment_method!,
      valid_from: abbonamento.valid_from ?? new Date().toISOString().slice(0, 10),
      valid_until: abbonamento.valid_until ?? null,
      notes: abbonamento.notes?.trim() || null,
      is_active: true,
      created_by: profile.id,
    };

    const { data, error } = await admin
      .from('abbonamenti')
      .insert(insertRow)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, abbonamento: data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating abbonamento:', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);
    if (!profile || !isSalonStaff(profile.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id, abbonamento } = await request.json() as {
      id: string;
      abbonamento: Partial<IncomingAbbonamento>;
    };
    if (!id) return NextResponse.json({ success: false, error: 'id mancante' }, { status: 400 });

    const admin = getAdminClient();

    // Operators can flip is_active or edit notes; owners can adjust everything else.
    const updates: Record<string, unknown> = {};
    if (typeof abbonamento.is_active === 'boolean') updates.is_active = abbonamento.is_active;
    if (abbonamento.notes !== undefined) updates.notes = abbonamento.notes?.trim() || null;

    if (canManageSalon(profile.role)) {
      const allowed: (keyof IncomingAbbonamento)[] = [
        'scope_service_ids',
        'total_treatments',
        'pricing_mode',
        'discount_percent',
        'total_paid',
        'sale_payment_method',
        'valid_from',
        'valid_until',
      ];
      for (const k of allowed) {
        if ((abbonamento as Record<string, unknown>)[k] !== undefined) {
          updates[k] = (abbonamento as Record<string, unknown>)[k];
        }
      }
      // Guard: when lowering total_treatments, refuse if it would go below the count already redeemed
      if (updates.total_treatments !== undefined) {
        const { count } = await admin
          .from('fiche_services')
          .select('*', { count: 'exact', head: true })
          .eq('abbonamento_id', id);
        if ((count ?? 0) > Number(updates.total_treatments)) {
          return NextResponse.json(
            { success: false, error: `Non puoi portare il totale sotto le ${count} sedute già utilizzate.` },
            { status: 400 },
          );
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'Nessun campo da aggiornare' }, { status: 400 });
    }

    const { data, error } = await admin
      .from('abbonamenti')
      .update(updates)
      .eq('id', id)
      .eq('salon_id', profile.salon_id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, abbonamento: data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating abbonamento:', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const profile = await getCallerProfile(supabase);
    if (!profile || !canManageSalon(profile.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await request.json() as { id: string };
    if (!id) return NextResponse.json({ success: false, error: 'id mancante' }, { status: 400 });

    const admin = getAdminClient();
    const { error } = await admin
      .from('abbonamenti')
      .delete()
      .eq('id', id)
      .eq('salon_id', profile.salon_id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting abbonamento:', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
