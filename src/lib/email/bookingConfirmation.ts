import { Resend } from 'resend';
import {
  renderBookingEmail,
  type BookingEmailParams,
  type BookingEmailVariant,
} from './templates/bookingEmailTemplate';

const resend = new Resend(process.env.RESEND_API_KEY);

export type { BookingEmailVariant };

/**
 * Sends one of the booking-flow emails (created, pending_approval, approved,
 * declined, cancelled, reminder). The HTML/subject rendering lives in the
 * pure template module so the same code path is reused by the owner-side
 * preview modal in settings.
 *
 * Best-effort: callers are expected to wrap this in a try/catch and never
 * surface a Resend failure as a booking failure.
 */
export async function sendBookingEmail(params: BookingEmailParams): Promise<void> {
  const { subject, html } = renderBookingEmail(params);

  const { error } = await resend.emails.send({
    from: `${params.salon.name} <noreply@lumeapp.it>`,
    to: [params.toEmail],
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}
