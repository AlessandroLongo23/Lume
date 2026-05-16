import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Owner can pick a brand color in BrandingPanel. We use it for the header
// banner and CTA accents so the email feels native to the salon's brand.
// Fallback is Lume indigo so unset/invalid colors don't break the template.
const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const DEFAULT_BRAND = '#6366F1';

function safeColor(input: string | null | undefined): string {
  if (!input) return DEFAULT_BRAND;
  return HEX_RE.test(input.trim()) ? input.trim() : DEFAULT_BRAND;
}

/** Email variants:
 *  - 'created'           initial auto-confirm at booking time (no approval needed)
 *  - 'pending_approval'  initial "we received your request" at booking time
 *  - 'approved'          staff approved a previously pending booking
 *  - 'declined'          staff declined a previously pending booking
 *
 *  'created' and 'approved' both result in a confirmed booking but use slightly
 *  different copy because in the second case the visitor already received the
 *  "we received your request" email — the second mail should make it clear
 *  this is the outcome of that earlier request. */
export type BookingEmailVariant = 'created' | 'pending_approval' | 'approved' | 'declined';

export interface BookingConfirmationParams {
  toEmail: string;
  toFirstName: string;
  salonName: string;
  brandColor: string | null;
  serviceName: string;
  /** Human-readable date/time, e.g. "lunedì 18 maggio 2026 · 14:30". */
  whenLabel: string;
  status: BookingEmailVariant;
}

type VariantCopy = {
  subject: string;
  heading: string;
  intro: string;
  footer: string;
  pillBg: string;
  pillFg: string;
  pillLabel: string;
};

function variantCopy(variant: BookingEmailVariant, salonName: string): VariantCopy {
  switch (variant) {
    case 'created':
      return {
        subject: `Prenotazione confermata · ${salonName}`,
        heading: 'Prenotazione confermata',
        intro: `<strong>${esc(salonName)}</strong> ti aspetta. Trovi i dettagli qui sotto.`,
        footer: 'Per cambiare o cancellare la prenotazione, contatta direttamente il salone.',
        pillBg: '#dcfce7',
        pillFg: '#166534',
        pillLabel: 'Confermata',
      };
    case 'pending_approval':
      return {
        subject: `Richiesta ricevuta · ${salonName}`,
        heading: 'Richiesta ricevuta',
        intro: `Abbiamo ricevuto la tua richiesta a <strong>${esc(salonName)}</strong>. Ti scriviamo non appena viene confermata.`,
        footer: "Riceverai un'email non appena il salone conferma o, se necessario, ti propone un'alternativa.",
        pillBg: '#fef3c7',
        pillFg: '#92400e',
        pillLabel: 'In attesa',
      };
    case 'approved':
      return {
        subject: `Prenotazione confermata · ${salonName}`,
        heading: 'Buone notizie, sei confermato!',
        intro: `<strong>${esc(salonName)}</strong> ha appena confermato la tua richiesta. Ti aspettiamo.`,
        footer: 'Per cambiare o cancellare la prenotazione, contatta direttamente il salone.',
        pillBg: '#dcfce7',
        pillFg: '#166534',
        pillLabel: 'Confermata',
      };
    case 'declined':
      return {
        subject: `Prenotazione non confermata · ${salonName}`,
        heading: 'Prenotazione non confermata',
        intro: `Purtroppo <strong>${esc(salonName)}</strong> non può accogliere la tua richiesta per il giorno e orario indicati.`,
        footer: 'Puoi contattare il salone per trovare un orario alternativo o riprovare a prenotare online in un altro giorno.',
        pillBg: '#fee2e2',
        pillFg: '#991b1b',
        pillLabel: 'Non confermata',
      };
  }
}

export async function sendBookingConfirmationEmail(
  params: BookingConfirmationParams,
): Promise<void> {
  const { toEmail, toFirstName, salonName, brandColor, serviceName, whenLabel, status } = params;
  const brand = safeColor(brandColor);
  const copy = variantCopy(status, salonName);
  const { subject, heading, intro, footer, pillBg: statusPillBg, pillFg: statusPillFg, pillLabel: statusLabel } = copy;

  const html = `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,sans-serif;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="600"
    style="border-collapse:collapse;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <tr>
      <td style="background:${esc(brand)};padding:28px 40px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;letter-spacing:-0.3px;">${esc(salonName)}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:40px;">
        <p style="margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;">
          <span style="display:inline-block;background:${statusPillBg};color:${statusPillFg};padding:2px 10px;border-radius:9999px;font-size:11px;font-weight:600;letter-spacing:0.03em;">
            ${esc(statusLabel)}
          </span>
        </p>
        <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#18181b;letter-spacing:-0.3px;">${esc(heading)}</h2>
        <p style="margin:0 0 24px;font-size:15px;color:#27272a;line-height:1.6;">Ciao ${esc(toFirstName)},</p>
        <p style="margin:0 0 24px;font-size:15px;color:#27272a;line-height:1.6;">${intro}</p>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:#f4f5f7;border-radius:8px;margin-bottom:24px;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;">Servizio</p>
              <p style="margin:0 0 16px;font-size:15px;color:#18181b;font-weight:600;">${esc(serviceName)}</p>
              <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;">Quando</p>
              <p style="margin:0;font-size:15px;color:#18181b;font-weight:600;">${esc(whenLabel)}</p>
            </td>
          </tr>
        </table>

        <p style="margin:0;font-size:13px;color:#71717a;line-height:1.5;">${esc(footer)}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 40px;background:#f4f5f7;text-align:center;">
        <p style="margin:0;font-size:12px;color:#a1a1aa;">Prenotazione gestita con Lume · © ${new Date().getFullYear()}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: `${salonName} <noreply@lumeapp.it>`,
    to: [toEmail],
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}
