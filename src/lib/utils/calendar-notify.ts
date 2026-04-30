import type { Client } from '@/lib/types/Client';

function fmtDate(d: Date): string {
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
}
function fmtTime(d: Date): string {
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

export interface AppointmentChangeMessageArgs {
  client: { firstName: string };
  oldStart: Date;
  newStart: Date;
  newEnd: Date;
  salonName: string;
}

export function buildAppointmentChangeMessage(args: AppointmentChangeMessageArgs): string {
  const sameDay =
    args.oldStart.getFullYear() === args.newStart.getFullYear() &&
    args.oldStart.getMonth() === args.newStart.getMonth() &&
    args.oldStart.getDate() === args.newStart.getDate();
  const previous = sameDay
    ? `(precedente: ${fmtTime(args.oldStart)})`
    : `(precedente: ${fmtDate(args.oldStart)} alle ${fmtTime(args.oldStart)})`;
  return [
    `Ciao ${args.client.firstName}!`,
    `Il tuo appuntamento presso ${args.salonName} è stato spostato.`,
    `Nuovo orario: ${fmtDate(args.newStart)} dalle ${fmtTime(args.newStart)} alle ${fmtTime(args.newEnd)}.`,
    previous + '.',
    `A presto!`,
  ].join(' ');
}

export function buildAppointmentWhatsAppLink(
  client: Pick<Client, 'phonePrefix' | 'phoneNumber'>,
  message: string,
): string | null {
  if (!client.phonePrefix || !client.phoneNumber) return null;
  const phone = `${client.phonePrefix}${client.phoneNumber}`.replace(/[^0-9]/g, '');
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export interface SendAppointmentChangeEmailArgs {
  to: string;
  firstName: string;
  oldStart: Date;
  newStart: Date;
  newEnd: Date;
  salonName: string;
  message: string;
}

/**
 * Fire-and-forget — failures never surface to the operator. WhatsApp wa.me link
 * is the safety-net channel.
 */
export async function sendAppointmentChangeEmail(
  args: SendAppointmentChangeEmailArgs,
): Promise<{ success: boolean; error?: string }> {
  if (!args.to) return { success: false, error: 'Email destinatario mancante' };
  try {
    const res = await fetch('/api/calendar/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: args.to,
        firstName: args.firstName,
        oldStart: args.oldStart.toISOString(),
        newStart: args.newStart.toISOString(),
        newEnd: args.newEnd.toISOString(),
        salonName: args.salonName,
        message: args.message,
      }),
    });
    const json = await res.json();
    if (!json.success) return { success: false, error: json.error };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Errore invio email' };
  }
}
