// Shape mirrors public.notifications (see
// supabase/migrations/2026_05_16_05_notifications.sql).

export type NotificationType =
  | 'booking.created'
  | 'booking.requested'   // pending_approval
  | 'booking.cancelled';  // future: client cancel flow (sub-project I)

export interface Notification {
  id: string;
  salon_id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  action_required: boolean;
  read_at: string | null;
  created_at: string;
}
