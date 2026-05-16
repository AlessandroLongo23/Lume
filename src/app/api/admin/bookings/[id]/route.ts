import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getCallerProfile } from '@/lib/gateway/getCallerProfile';
import { isSalonStaff, canManageSalon } from '@/lib/auth/roles';
import { sendBookingEmail } from '@/lib/email/bookingConfirmation';

// Sub-project G: staff-side approve / decline for online bookings.
//
// Inputs: { action: 'approve' | 'decline' }
// Outputs: { success, status, email_sent } | { success: false, error }
//
// Auth:
//   * Caller must be salon staff (owner / operator / impersonating admin).
//   * Fiche must belong to caller's active salon.
//   * Fiche.status must currently be 'pending_approval'.
//   * approval_scope (from salons.booking_config) decides who may act:
//       - 'chosen_operator' (default): the assigned operator OR an owner/admin.
//       - 'any_staff': any active staff member.
//
// Side effects:
//   * Updates fiche status via update_fiche_with_audit (audit row inserted).
//   * Best-effort confirmation/decline email via Resend.

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

type BookingConfig = {
  approval_scope?: 'chosen_operator' | 'any_staff';
};

type FicheRow = {
  id: string;
  salon_id: string;
  status: string;
  datetime: string;
  client_id: string;
};

type ServiceRow = {
  operator_id: string;
  service_id: string;
  name: string | null;
  duration: number;
};

type ClientRow = {
  email: string | null;
  firstName: string;
};

type SalonRow = {
  name: string;
  brand_color: string | null;
  logo_url: string | null;
  address: string | null;
  city: string | null;
  cap: string | null;
  province: string | null;
  phone: string | null;
  booking_config: BookingConfig | null;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: ficheId } = await params;
  if (!ficheId) {
    return NextResponse.json({ success: false, error: 'ID prenotazione mancante.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Richiesta non valida.' }, { status: 400 });
  }
  const action = (body as { action?: unknown })?.action;
  if (action !== 'approve' && action !== 'decline') {
    return NextResponse.json({ success: false, error: 'Azione non valida.' }, { status: 400 });
  }

  const supabase = await createServerClient();
  const profile = await getCallerProfile(supabase);
  if (!profile) {
    return NextResponse.json({ success: false, error: 'Non autenticato.' }, { status: 401 });
  }
  if (!isSalonStaff(profile.role)) {
    return NextResponse.json({ success: false, error: 'Non autorizzato.' }, { status: 403 });
  }

  const admin = getAdminClient();

  // Pull fiche + fiche_services + salon + client in three small queries so
  // each one is a clear failure surface. Fiche has 1:N services but for
  // online bookings there's always exactly one — guarded by an explicit
  // assertion below.
  const { data: fiche, error: ficheErr } = await admin
    .from('fiches')
    .select('id, salon_id, status, datetime, client_id')
    .eq('id', ficheId)
    .maybeSingle<FicheRow>();
  if (ficheErr || !fiche) {
    return NextResponse.json({ success: false, error: 'Prenotazione non trovata.' }, { status: 404 });
  }
  if (fiche.salon_id !== profile.salon_id) {
    return NextResponse.json({ success: false, error: 'Non autorizzato.' }, { status: 403 });
  }
  if (fiche.status !== 'pending_approval') {
    return NextResponse.json(
      { success: false, error: 'Questa prenotazione non è in attesa di approvazione.' },
      { status: 409 },
    );
  }

  const { data: services, error: svcErr } = await admin
    .from('fiche_services')
    .select('operator_id, service_id, name, duration')
    .eq('fiche_id', ficheId)
    .order('start_time', { ascending: true });
  if (svcErr || !services?.length) {
    return NextResponse.json({ success: false, error: 'Dati prenotazione incompleti.' }, { status: 500 });
  }
  const firstService = services[0] as ServiceRow;

  const { data: salon, error: salonErr } = await admin
    .from('salons')
    .select('name, brand_color, logo_url, address, city, cap, province, phone, booking_config')
    .eq('id', fiche.salon_id)
    .maybeSingle<SalonRow>();
  if (salonErr || !salon) {
    return NextResponse.json({ success: false, error: 'Salone non trovato.' }, { status: 500 });
  }

  const approvalScope = salon.booking_config?.approval_scope ?? 'chosen_operator';

  // 'chosen_operator': caller must be the operator on the booking, OR
  // anyone allowed to manage the salon (owner / impersonating admin).
  if (approvalScope === 'chosen_operator' && !canManageSalon(profile.role)) {
    const { data: op, error: opErr } = await admin
      .from('operators')
      .select('user_id')
      .eq('id', firstService.operator_id)
      .maybeSingle<{ user_id: string | null }>();
    if (opErr || op?.user_id !== profile.id) {
      return NextResponse.json(
        { success: false, error: 'Solo l\'operatore assegnato (o il titolare) può gestire questa prenotazione.' },
        { status: 403 },
      );
    }
  }
  // 'any_staff' is already covered by the isSalonStaff guard above; owners
  // get the canManageSalon shortcut in the 'chosen_operator' branch.

  const newStatus = action === 'approve' ? 'created' : 'cancelled';
  const reason = action === 'approve' ? 'Prenotazione online approvata' : 'Prenotazione online rifiutata';

  const { error: rpcErr } = await supabase.rpc('update_fiche_with_audit', {
    p_fiche_id: ficheId,
    p_patch: { status: newStatus },
    p_reason: reason,
  });
  if (rpcErr) {
    console.error('update_fiche_with_audit failed:', rpcErr);
    return NextResponse.json(
      { success: false, error: 'Impossibile aggiornare la prenotazione.' },
      { status: 500 },
    );
  }

  // Email is best-effort: a delivery failure must not bubble up as a booking
  // failure — the status change is already committed.
  let emailSent = false;
  const { data: client } = await admin
    .from('clients')
    .select('email, "firstName"')
    .eq('id', fiche.client_id)
    .maybeSingle<ClientRow>();
  if (client?.email) {
    try {
      await sendBookingEmail({
        toEmail: client.email,
        toFirstName: client.firstName,
        variant: action === 'approve' ? 'approved' : 'declined',
        salon: {
          name: salon.name,
          brandColor: salon.brand_color,
          logoUrl: salon.logo_url,
          address: salon.address,
          city: salon.city,
          cap: salon.cap,
          province: salon.province,
          phone: salon.phone,
        },
        booking: {
          serviceName: firstService.name ?? 'Servizio prenotato',
          startAt: new Date(fiche.datetime),
          durationMinutes: firstService.duration,
        },
      });
      emailSent = true;
    } catch (err) {
      console.error('Booking approval/decline email failed:', err);
    }
  }

  return NextResponse.json({ success: true, status: newStatus, email_sent: emailSent });
}
