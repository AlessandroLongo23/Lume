import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendBookingEmail } from '@/lib/email/bookingConfirmation';

// Public, anon-callable endpoint hit by the booking wizard's submit button.
// All access control happens inside create_online_booking (SECURITY DEFINER):
// it rejects disabled salons, non-bookable services, non-whitelisted clients
// in `selected` access mode, and races on the same slot. We translate its
// thrown messages into HTTP responses with Italian copy the wizard can show.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PREFIX_RE = /^\+\d{1,4}$/;

const MAX = {
  name: 100,
  phone: 30,
  prefix: 8,
  email: 254,
  note: 500,
};

function badRequest(error: string) {
  return NextResponse.json({ success: false, error }, { status: 400 });
}

function trimOrNull(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (!t) return null;
  return t.length > max ? null : t;
}

function trim(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  const t = v.trim();
  return t.length > max ? '' : t;
}

// Maps the keyword raised inside create_online_booking to (HTTP status,
// Italian user-facing message). Anything else (network, DB outage,
// unexpected exception) collapses to a generic 500.
function mapRpcError(message: string): { status: number; error: string } {
  switch (message) {
    case 'booking_not_enabled':
      return { status: 404, error: 'Le prenotazioni online non sono più attive per questo salone.' };
    case 'service_not_bookable':
      return { status: 409, error: 'Questo servizio non è più disponibile online.' };
    case 'client_not_whitelisted':
      return {
        status: 403,
        error: 'Il tuo contatto non è abilitato alle prenotazioni online. Contatta il salone per assistenza.',
      };
    case 'slot_unavailable':
      return {
        status: 409,
        error: 'Questo orario è appena stato prenotato. Scegli un altro orario.',
      };
    default:
      return { status: 500, error: 'Errore durante la creazione della prenotazione. Riprova.' };
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

  const b = body as Record<string, unknown>;
  const slug = trim(b.slug, 63).toLowerCase();
  const serviceId = trim(b.service_id, 36);
  const operatorId = trim(b.operator_id, 36);
  const startAt = trim(b.start_at, 64);
  const firstName = trim(b.first_name, MAX.name);
  const lastName = trim(b.last_name, MAX.name);
  const phonePrefix = trim(b.phone_prefix, MAX.prefix);
  const phone = trim(b.phone, MAX.phone).replace(/\s/g, '');
  const email = trimOrNull(b.email, MAX.email);
  const note = trimOrNull(b.note, MAX.note);

  if (!SLUG_RE.test(slug)) return badRequest('Salone non valido.');
  if (!UUID_RE.test(serviceId)) return badRequest('Servizio non valido.');
  if (!UUID_RE.test(operatorId)) return badRequest('Operatore non valido.');
  if (!startAt || Number.isNaN(Date.parse(startAt))) return badRequest('Orario non valido.');
  if (!firstName) return badRequest('Inserisci il tuo nome.');
  if (!lastName) return badRequest('Inserisci il tuo cognome.');
  if (!PREFIX_RE.test(phonePrefix)) return badRequest('Prefisso telefonico non valido.');
  if (!/^\d{4,15}$/.test(phone)) return badRequest('Numero di telefono non valido.');
  if (email && !EMAIL_RE.test(email)) return badRequest("Indirizzo email non valido.");

  const supabase = await createClient();

  // Resolve salon_id from slug — also gates on booking_enabled because the
  // SECURITY DEFINER function only returns a row when the toggle is on.
  // Doing the lookup here (instead of trusting a salon_id from the client)
  // means a flipped-off toggle 404s immediately on the write path too.
  const { data: salon, error: salonError } = await supabase
    .rpc('get_salon_by_slug', { p_slug: slug })
    .maybeSingle();
  if (salonError || !salon) {
    return NextResponse.json(
      { success: false, error: 'Salone non trovato.' },
      { status: 404 },
    );
  }
  const salonRow = salon as {
    id: string;
    name: string;
    brand_color: string | null;
    logo_url: string | null;
    address: string | null;
    city: string | null;
    cap: string | null;
    province: string | null;
    phone: string | null;
  };

  const { data: rpcData, error: rpcError } = await supabase
    .rpc('create_online_booking', {
      p_salon_id: salonRow.id,
      p_service_id: serviceId,
      p_operator_id: operatorId,
      p_start_at: startAt,
      p_client_first: firstName,
      p_client_last: lastName,
      p_client_phone_prefix: phonePrefix,
      p_client_phone: phone,
      p_client_email: email,
      p_note: note,
    })
    .maybeSingle();

  if (rpcError) {
    const { status, error } = mapRpcError(rpcError.message ?? '');
    if (status === 500) {
      console.error('create_online_booking failed:', rpcError);
    }
    return NextResponse.json({ success: false, error }, { status });
  }

  const row = rpcData as { fiche_id: string; status: 'created' | 'pending_approval' } | null;
  if (!row) {
    return NextResponse.json(
      { success: false, error: 'Errore durante la creazione della prenotazione. Riprova.' },
      { status: 500 },
    );
  }

  // Fire the confirmation email when we have an address. Failure here must
  // not bubble up — the booking already exists in the DB; an email outage
  // shouldn't surface as a booking failure.
  let emailSent = false;
  if (email) {
    try {
      const service = await loadBookableService(supabase, salonRow.id, serviceId);
      await sendBookingEmail({
        toEmail: email,
        toFirstName: firstName,
        variant: row.status,
        salon: {
          name: salonRow.name,
          brandColor: salonRow.brand_color,
          logoUrl: salonRow.logo_url,
          address: salonRow.address,
          city: salonRow.city,
          cap: salonRow.cap,
          province: salonRow.province,
          phone: salonRow.phone,
        },
        booking: {
          serviceName: service?.name ?? 'Servizio prenotato',
          startAt: new Date(startAt),
          durationMinutes: service?.duration ?? 60,
        },
      });
      emailSent = true;
    } catch (err) {
      console.error('Booking confirmation email failed:', err);
    }
  }

  return NextResponse.json({
    success: true,
    status: row.status,
    fiche_id: row.fiche_id,
    email_sent: emailSent,
  });
}

// Anon callers don't have direct read access to public.services rows, but
// get_bookable_services exposes the subset they may see. We use it here so
// the email can show the actual service name + duration (for the calendar
// link) without granting any extra table access.
async function loadBookableService(
  supabase: Awaited<ReturnType<typeof createClient>>,
  salonId: string,
  serviceId: string,
): Promise<{ name: string; duration: number } | null> {
  const { data, error } = await supabase.rpc('get_bookable_services', { p_salon_id: salonId });
  if (error || !data) return null;
  const match = (data as Array<{ id: string; name: string; duration: number }>).find((s) => s.id === serviceId);
  return match ? { name: match.name, duration: match.duration } : null;
}
