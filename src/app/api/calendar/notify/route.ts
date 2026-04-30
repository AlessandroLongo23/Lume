import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtDateIt(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}
function fmtTimeIt(iso: string): string {
  return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      to: string;
      firstName?: string;
      oldStart: string;
      newStart: string;
      newEnd: string;
      salonName: string;
      message: string;
    };
    const { to, firstName, oldStart, newStart, newEnd, salonName, message } = body;

    if (!to || !message || !salonName || !newStart || !newEnd || !oldStart) {
      return NextResponse.json({ success: false, error: 'Campi obbligatori mancanti' }, { status: 400 });
    }

    const safeFirst = escapeHtml(firstName ?? '');
    const safeSalon = escapeHtml(salonName);
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br/>');
    const newDateLabel = fmtDateIt(newStart);
    const newTimeLabel = `${fmtTimeIt(newStart)}–${fmtTimeIt(newEnd)}`;
    const oldLabel = `${fmtDateIt(oldStart)} alle ${fmtTimeIt(oldStart)}`;

    const html = `
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background:#f4f4f4;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; margin-top:24px; background:#ffffff; border-radius:8px; overflow:hidden;">
          <tr><td style="padding:32px 28px; background:#6366F1; color:#ffffff;">
            <h1 style="margin:0; font-size:22px; font-weight:600;">Il tuo appuntamento è stato aggiornato</h1>
            <p style="margin:6px 0 0; font-size:14px; opacity:0.9;">${safeSalon}</p>
          </td></tr>
          <tr><td style="padding:28px;">
            <p style="margin:0 0 16px; font-size:16px; color:#18181b;">Ciao ${safeFirst || ''},</p>
            <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#3f3f46;">${safeMessage}</p>
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 16px;">
              <tr>
                <td style="padding:6px 0; font-size:13px; color:#71717a; width:120px;">Nuovo orario</td>
                <td style="padding:6px 0; font-size:14px; color:#18181b; font-weight:600;">${escapeHtml(newDateLabel)} · ${escapeHtml(newTimeLabel)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; font-size:13px; color:#71717a;">Precedente</td>
                <td style="padding:6px 0; font-size:14px; color:#71717a;">${escapeHtml(oldLabel)}</td>
              </tr>
            </table>
            <p style="margin:24px 0 0; font-size:13px; color:#a1a1aa;">Se non puoi più presentarti, contatta il salone il prima possibile.</p>
          </td></tr>
        </table>
      </body>
    `;

    const subject = `Nuovo orario per il tuo appuntamento da ${salonName}`;

    const { error } = await resend.emails.send({
      from: 'Lume <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error({ error });
      return NextResponse.json({ success: false, error: 'Invio email fallito' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending appointment-change notification:', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
