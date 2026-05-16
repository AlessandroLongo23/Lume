// Pure HTML renderer for the booking email family. Intentionally has no
// I/O (no Resend, no DB, no `server-only`) so the owner-side preview
// modal in settings can import and render it client-side without
// round-tripping through an API.
//
// Email-safe HTML rules followed below:
//   * Layout uses tables (Outlook still ignores most flex/grid).
//   * All styling is inline.
//   * Font stack uses the standard "system + fallbacks" so Apple Mail /
//     Gmail render with native typography.
//   * Pixel widths cap at 600px (de-facto email standard).
//   * Brand color is the only owner-controlled value injected into a
//     style attribute — we sanitise to a hex match before insertion so a
//     malformed brand_color value can't break out of the attribute.

import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export type BookingEmailVariant =
  | 'created'           // initial auto-confirm
  | 'pending_approval'  // initial "we received your request"
  | 'approved'          // staff approved a pending request
  | 'declined'          // staff declined a pending request
  | 'cancelled'         // client (or staff) cancelled an existing booking
  | 'reminder';         // pre-appointment reminder (optional v1)

export interface BookingEmailParams {
  toEmail: string;
  toFirstName: string;
  variant: BookingEmailVariant;
  salon: {
    name: string;
    brandColor: string | null;
    logoUrl: string | null;
    address: string | null;
    city: string | null;
    cap: string | null;
    province: string | null;
    phone: string | null;
  };
  booking: {
    serviceName: string;
    startAt: Date;
    durationMinutes: number;
  };
}

export interface RenderedEmail {
  subject: string;
  html: string;
}

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const DEFAULT_BRAND = '#6366F1';
const SYSTEM_FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function safeColor(input: string | null | undefined): string {
  if (!input) return DEFAULT_BRAND;
  const trimmed = input.trim();
  return HEX_RE.test(trimmed) ? trimmed : DEFAULT_BRAND;
}

function formatLocation(salon: BookingEmailParams['salon']): string | null {
  const parts = [
    [salon.address, salon.cap].filter(Boolean).join(' '),
    [salon.city, salon.province].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ');
  return parts || null;
}

function whenLabel(startAt: Date): string {
  return `${format(startAt, "EEEE d MMMM yyyy", { locale: it })} · ${format(startAt, 'HH:mm')}`;
}

// Google Calendar's quick-add URL — works without any auth on the client.
// Dates encoded as UTC YYYYMMDDTHHMMSSZ (no separators, no fractional secs).
function googleCalendarUrl(params: BookingEmailParams): string {
  const start = params.booking.startAt;
  const end = new Date(start.getTime() + params.booking.durationMinutes * 60_000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const text = `${params.booking.serviceName} · ${params.salon.name}`;
  const location = formatLocation(params.salon) ?? params.salon.name;
  const details = params.salon.phone
    ? `Salone: ${params.salon.name}\nTelefono: ${params.salon.phone}`
    : `Salone: ${params.salon.name}`;
  const qs = new URLSearchParams({
    action: 'TEMPLATE',
    text,
    dates: `${fmt(start)}/${fmt(end)}`,
    location,
    details,
  });
  return `https://calendar.google.com/calendar/render?${qs.toString()}`;
}

type Copy = {
  subject: string;
  heading: string;
  intro: string;
  footer: string;
  pillBg: string;
  pillFg: string;
  pillLabel: string;
  showCalendarCta: boolean;
};

function variantCopy(variant: BookingEmailVariant, salonName: string): Copy {
  switch (variant) {
    case 'created':
      return {
        subject: `Prenotazione confermata · ${salonName}`,
        heading: 'Prenotazione confermata',
        intro: `<strong>${esc(salonName)}</strong> ti aspetta. Trovi i dettagli qui sotto — puoi aggiungerli direttamente al tuo calendario.`,
        footer: 'Per cambiare o cancellare la prenotazione, contatta direttamente il salone.',
        pillBg: '#dcfce7',
        pillFg: '#166534',
        pillLabel: 'Confermata',
        showCalendarCta: true,
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
        showCalendarCta: false,
      };
    case 'approved':
      return {
        subject: `Prenotazione confermata · ${salonName}`,
        heading: 'Buone notizie, sei confermato!',
        intro: `<strong>${esc(salonName)}</strong> ha appena confermato la tua richiesta. Aggiungi l'appuntamento al calendario per non dimenticarlo.`,
        footer: 'Per cambiare o cancellare la prenotazione, contatta direttamente il salone.',
        pillBg: '#dcfce7',
        pillFg: '#166534',
        pillLabel: 'Confermata',
        showCalendarCta: true,
      };
    case 'declined':
      return {
        subject: `Prenotazione non confermata · ${salonName}`,
        heading: 'Prenotazione non confermata',
        intro: `Purtroppo <strong>${esc(salonName)}</strong> non può accogliere la tua richiesta per il giorno e orario indicati.`,
        footer: 'Puoi contattare il salone per concordare un orario alternativo o riprovare a prenotare online in un altro giorno.',
        pillBg: '#fee2e2',
        pillFg: '#991b1b',
        pillLabel: 'Non confermata',
        showCalendarCta: false,
      };
    case 'cancelled':
      return {
        subject: `Prenotazione annullata · ${salonName}`,
        heading: 'Prenotazione annullata',
        intro: `Abbiamo annullato la tua prenotazione presso <strong>${esc(salonName)}</strong>. L'orario è di nuovo libero per altri clienti.`,
        footer: 'Quando vuoi, puoi prenotare di nuovo online o chiamare direttamente il salone.',
        pillBg: '#f4f4f5',
        pillFg: '#3f3f46',
        pillLabel: 'Annullata',
        showCalendarCta: false,
      };
    case 'reminder':
      return {
        subject: `Promemoria appuntamento · ${salonName}`,
        heading: 'Promemoria appuntamento',
        intro: `Ti ricordiamo il tuo appuntamento presso <strong>${esc(salonName)}</strong>. Ci vediamo presto!`,
        footer: 'Se non riesci a venire, contatta il salone il prima possibile così possiamo liberare il tuo orario.',
        pillBg: '#dbeafe',
        pillFg: '#1e3a8a',
        pillLabel: 'Promemoria',
        showCalendarCta: true,
      };
  }
}

export function renderBookingEmail(params: BookingEmailParams): RenderedEmail {
  const brand = safeColor(params.salon.brandColor);
  const copy = variantCopy(params.variant, params.salon.name);
  const location = formatLocation(params.salon);
  const gcalUrl = copy.showCalendarCta ? googleCalendarUrl(params) : null;

  const logoCell = params.salon.logoUrl
    ? `<img src="${esc(params.salon.logoUrl)}" alt="${esc(params.salon.name)}"
            width="56" height="56"
            style="display:block;width:56px;height:56px;border-radius:9999px;border:2px solid rgba(255,255,255,0.75);background:#ffffff;object-fit:contain;margin:0 auto 12px;" />`
    : '';

  const calendarCta = gcalUrl
    ? `
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin:0 0 24px;">
        <tr>
          <td align="center">
            <a href="${esc(gcalUrl)}"
               style="display:inline-block;background:${esc(brand)};color:#ffffff;font-size:14px;font-weight:600;
                      text-decoration:none;padding:12px 24px;border-radius:8px;letter-spacing:-0.01em;">
              Aggiungi al calendario
            </a>
          </td>
        </tr>
      </table>`
    : '';

  const footerSalonLine = location
    ? `${esc(params.salon.name)} · ${esc(location)}${params.salon.phone ? ` · ${esc(params.salon.phone)}` : ''}`
    : params.salon.phone
    ? `${esc(params.salon.name)} · ${esc(params.salon.phone)}`
    : esc(params.salon.name);

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(copy.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:${SYSTEM_FONT_STACK};">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%"
    style="border-collapse:collapse;background:#f4f5f7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="600"
          style="border-collapse:collapse;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(15,23,42,0.06);">
          <tr>
            <td style="background:${esc(brand)};padding:32px 40px;text-align:center;">
              ${logoCell}
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;letter-spacing:-0.3px;line-height:1.2;">${esc(params.salon.name)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px 32px;">
              <p style="margin:0 0 14px;font-size:13px;">
                <span style="display:inline-block;background:${copy.pillBg};color:${copy.pillFg};padding:4px 12px;border-radius:9999px;font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;">
                  ${esc(copy.pillLabel)}
                </span>
              </p>
              <h2 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#18181b;letter-spacing:-0.4px;line-height:1.25;">${esc(copy.heading)}</h2>
              <p style="margin:0 0 16px;font-size:15px;color:#27272a;line-height:1.55;">Ciao ${esc(params.toFirstName)},</p>
              <p style="margin:0 0 28px;font-size:15px;color:#27272a;line-height:1.55;">${copy.intro}</p>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:22px 24px;">
                    <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;font-weight:600;">Servizio</p>
                    <p style="margin:0 0 18px;font-size:15px;color:#0f172a;font-weight:600;line-height:1.4;">${esc(params.booking.serviceName)}</p>
                    <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;font-weight:600;">Quando</p>
                    <p style="margin:0;font-size:15px;color:#0f172a;font-weight:600;line-height:1.4;">${esc(whenLabel(params.booking.startAt))}</p>
                  </td>
                </tr>
              </table>

              ${calendarCta}

              <p style="margin:0;font-size:13px;color:#64748b;line-height:1.55;">${esc(copy.footer)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#475569;font-weight:500;">${footerSalonLine}</p>
              <p style="margin:0;font-size:11px;color:#94a3b8;">Prenotazione gestita con Lume · © ${new Date().getFullYear()}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject: copy.subject, html };
}
