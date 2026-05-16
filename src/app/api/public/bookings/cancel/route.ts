import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/server';
import { sendBookingEmail } from '@/lib/email/bookingConfirmation';
import { emitBookingCancelled } from '@/lib/notifications/emit';

// Public, anon-callable cancel endpoint hit by the "Sì, annulla" button on
// `(public)/[slug]/prenotazione/[token]`. All access control happens inside
// cancel_online_booking_by_token (SECURITY DEFINER): it rejects unknown
// tokens, statuses outside the live state, and post-window attempts. We
// translate its thrown messages into HTTP responses + Italian copy.

const TOKEN_RE = /^[0-9a-f]{16,64}$/i;

function badRequest(error: string) {
  return NextResponse.json({ success: false, error }, { status: 400 });
}

function mapRpcError(message: string): { status: number; error: string } {
  switch (message) {
    case 'booking_not_found':
      return { status: 404, error: 'Prenotazione non trovata.' };
    case 'already_cancelled':
      return { status: 409, error: 'Questa prenotazione è già stata annullata.' };
    case 'not_cancellable':
      return {
        status: 409,
        error: 'Questa prenotazione non può più essere annullata online.',
      };
    case 'cancel_window_passed':
      return {
        status: 409,
        error: "È troppo tardi per annullare online. Contatta direttamente il salone.",
      };
    default:
      return { status: 500, error: 'Errore durante la cancellazione. Riprova.' };
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('Richiesta non valida.');
  }
  if (!body || typeof body !== 'object') return badRequest('Richiesta non valida.');

  const token = typeof (body as Record<string, unknown>).token === 'string'
    ? ((body as { token: string }).token).trim()
    : '';
  if (!TOKEN_RE.test(token)) return badRequest('Token non valido.');

  const supabase = await createClient();

  const { data: rpcData, error: rpcError } = await supabase
    .rpc('cancel_online_booking_by_token', { p_token: token })
    .maybeSingle();

  if (rpcError) {
    const { status, error } = mapRpcError(rpcError.message ?? '');
    if (status === 500) {
      console.error('cancel_online_booking_by_token failed:', rpcError);
    }
    return NextResponse.json({ success: false, error }, { status });
  }

  const row = rpcData as {
    fiche_id: string;
    salon_id: string;
    operator_id: string | null;
    service_name: string;
    start_at: string;
    client_first: string | null;
    client_last: string | null;
    client_email: string | null;
  } | null;

  if (!row) {
    return NextResponse.json(
      { success: false, error: 'Errore durante la cancellazione. Riprova.' },
      { status: 500 },
    );
  }

  // Best-effort client-side confirmation email. Even if this fails, the
  // booking is already cancelled in the DB — surface success regardless.
  if (row.client_email) {
    try {
      const { data: salon } = await loadSalonForEmail(row.salon_id);
      await sendBookingEmail({
        toEmail: row.client_email,
        toFirstName: row.client_first ?? '',
        variant: 'cancelled',
        salon: {
          name: salon?.name ?? 'Salone',
          brandColor: salon?.brand_color ?? null,
          logoUrl: salon?.logo_url ?? null,
          address: salon?.address ?? null,
          city: salon?.city ?? null,
          cap: salon?.cap ?? null,
          province: salon?.province ?? null,
          phone: salon?.phone ?? null,
        },
        booking: {
          serviceName: row.service_name,
          startAt: new Date(row.start_at),
          durationMinutes: 60,
        },
      });
    } catch (err) {
      console.error('Booking cancellation email failed:', err);
    }
  }

  // Fire staff notifications (owner + assigned operator). Best-effort.
  try {
    const start = new Date(row.start_at);
    const whenLabel = `${format(start, "EEEE d MMMM", { locale: it })} · ${format(start, 'HH:mm')}`;
    const clientName = [row.client_first, row.client_last].filter(Boolean).join(' ').trim();
    const body = `${clientName || 'Cliente'} · ${whenLabel}`;
    const operatorUserId = row.operator_id ? await loadOperatorUserId(row.operator_id) : null;
    await emitBookingCancelled({
      salonId: row.salon_id,
      ficheId: row.fiche_id,
      operatorId: row.operator_id ?? '',
      operatorUserId,
      body,
    });
  } catch (err) {
    console.error('Cancel notification fan-out failed:', err);
  }

  return NextResponse.json({ success: true, fiche_id: row.fiche_id });
}

// Service-role read for the salon's email-render fields. Anon callers can't
// touch most of these columns (booking_enabled may be off, RLS doesn't expose
// city/cap/etc by default), and using service-role for this one read is safe:
// the response goes through the typed email template, not back to the caller.
async function loadSalonForEmail(salonId: string) {
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  return admin
    .from('salons')
    .select('name, brand_color, logo_url, address, city, cap, province, phone')
    .eq('id', salonId)
    .maybeSingle<{
      name: string;
      brand_color: string | null;
      logo_url: string | null;
      address: string | null;
      city: string | null;
      cap: string | null;
      province: string | null;
      phone: string | null;
    }>();
}

async function loadOperatorUserId(operatorId: string): Promise<string | null> {
  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data, error } = await admin
    .from('operators')
    .select('user_id')
    .eq('id', operatorId)
    .maybeSingle<{ user_id: string | null }>();
  if (error || !data) return null;
  return data.user_id;
}
