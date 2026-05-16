import 'server-only';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

// Server-side notification fan-out used by the booking flow endpoints (and
// later the client-cancel endpoint in sub-project I). All inserts go
// through the service-role client so RLS doesn't block them — the
// notifications table has no INSERT policy by design (see
// supabase/migrations/2026_05_16_05_notifications.sql).
//
// Fan-out matrix (matches PLAN.md "Notification fan-out (defaults)"):
//
//   booking.created          → owner + assigned operator
//   booking.requested        → owner + (assigned operator | all staff)
//                              depending on approval_scope
//   booking.cancelled        → owner + assigned operator
//                              (used by sub-project I)
//
// Failures are non-fatal: the caller logs and moves on. A missing
// notification is a recoverable UX miss, not a booking failure.

function getAdminClient(): SupabaseClient {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

type ApprovalScope = 'chosen_operator' | 'any_staff';

export interface BookingEventContext {
  salonId: string;
  ficheId: string;
  operatorId: string;
  /** The chosen operator's account, if any. operators.user_id is nullable. */
  operatorUserId?: string | null;
  /** For pending_approval — drives "chosen operator vs all staff" branch. */
  approvalScope?: ApprovalScope;
  /** Free-form body text (e.g. "Giulia Bianchi · martedì 18 maggio · 14:30"). */
  body: string;
}

interface NotificationInsert {
  salon_id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  action_required: boolean;
}

async function recipientsForFanout(
  admin: SupabaseClient,
  salonId: string,
  operatorUserId: string | null,
  includeAllStaff: boolean,
): Promise<Set<string>> {
  const recipients = new Set<string>();

  // Always include the owner(s) of the salon. user_salon_memberships rows
  // for staff use the same 'owner' / 'operator' role enum that profiles.role
  // uses for non-admin members.
  const { data: owners } = await admin
    .from('user_salon_memberships')
    .select('user_id')
    .eq('salon_id', salonId)
    .eq('role', 'owner');
  (owners ?? []).forEach((r: { user_id: string }) => recipients.add(r.user_id));

  if (includeAllStaff) {
    const { data: staff } = await admin
      .from('user_salon_memberships')
      .select('user_id')
      .eq('salon_id', salonId);
    (staff ?? []).forEach((r: { user_id: string }) => recipients.add(r.user_id));
  } else if (operatorUserId) {
    recipients.add(operatorUserId);
  }

  return recipients;
}

async function fanout(
  ctx: BookingEventContext,
  build: (recipient: string) => Omit<NotificationInsert, 'user_id' | 'salon_id'>,
  includeAllStaff: boolean,
): Promise<void> {
  const admin = getAdminClient();
  const recipients = await recipientsForFanout(
    admin,
    ctx.salonId,
    ctx.operatorUserId ?? null,
    includeAllStaff,
  );
  if (recipients.size === 0) return;

  const rows: NotificationInsert[] = [...recipients].map((user_id) => ({
    salon_id: ctx.salonId,
    user_id,
    ...build(user_id),
  }));

  const { error } = await admin.from('notifications').insert(rows);
  if (error) {
    console.error('notification fan-out failed:', error);
  }
}

/** Auto-confirmed booking (no approval required). */
export async function emitBookingCreated(ctx: BookingEventContext): Promise<void> {
  await fanout(
    ctx,
    () => ({
      type: 'booking.created',
      title: 'Nuova prenotazione online',
      body: ctx.body,
      link: `/admin/prenotazioni`,
      action_required: false,
    }),
    false,
  );
}

/** Booking that needs approval. */
export async function emitBookingRequested(ctx: BookingEventContext): Promise<void> {
  // 'any_staff' broadens the recipient list to every member; 'chosen_operator'
  // (default) restricts to owner + the assigned operator.
  const includeAllStaff = ctx.approvalScope === 'any_staff';
  await fanout(
    ctx,
    () => ({
      type: 'booking.requested',
      title: 'Richiesta di prenotazione da approvare',
      body: ctx.body,
      link: `/admin/prenotazioni`,
      action_required: true,
    }),
    includeAllStaff,
  );
}

/** Reserved for sub-project I (client cancel flow). Keeps the surface
 *  complete so the cancel endpoint can call into the same module. */
export async function emitBookingCancelled(ctx: BookingEventContext): Promise<void> {
  await fanout(
    ctx,
    () => ({
      type: 'booking.cancelled',
      title: 'Prenotazione annullata dal cliente',
      body: ctx.body,
      link: `/admin/prenotazioni`,
      action_required: false,
    }),
    false,
  );
}
