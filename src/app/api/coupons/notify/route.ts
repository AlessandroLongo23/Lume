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

export async function POST(request: NextRequest) {
  try {
    const { to, firstName, kind, validUntil, salonName, message } = await request.json() as {
      to: string;
      firstName?: string;
      kind: 'gift' | 'gift_card';
      validUntil: string;
      salonName: string;
      message: string;
    };

    if (!to || !message || !salonName || !validUntil) {
      return NextResponse.json({ success: false, error: 'Campi obbligatori mancanti' }, { status: 400 });
    }

    const safeFirstName = escapeHtml(firstName ?? '');
    const safeSalon = escapeHtml(salonName);
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br/>');
    const safeUntil = new Date(validUntil).toLocaleDateString('it-IT', {
      day: '2-digit', month: 'long', year: 'numeric',
    });

    const heading = kind === 'gift_card' ? 'Hai ricevuto una gift card!' : 'Hai ricevuto un coupon!';

    const html = `
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background:#f4f4f4;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; margin-top:24px; background:#ffffff; border-radius:8px; overflow:hidden;">
          <tr><td style="padding:32px 28px; background:#6366F1; color:#ffffff;">
            <h1 style="margin:0; font-size:22px; font-weight:600;">${heading}</h1>
            <p style="margin:6px 0 0; font-size:14px; opacity:0.9;">da ${safeSalon}</p>
          </td></tr>
          <tr><td style="padding:28px;">
            <p style="margin:0 0 16px; font-size:16px; color:#18181b;">Ciao ${safeFirstName || ''},</p>
            <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#3f3f46;">${safeMessage}</p>
            <p style="margin:0 0 8px; font-size:13px; color:#71717a;"><strong>Valido fino al:</strong> ${safeUntil}</p>
            <p style="margin:24px 0 0; font-size:13px; color:#a1a1aa;">Mostra questa email al salone per riscattare il tuo regalo.</p>
          </td></tr>
        </table>
      </body>
    `;

    const subject = kind === 'gift_card'
      ? `Hai ricevuto una gift card da ${salonName}`
      : `Hai ricevuto un coupon da ${salonName}`;

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
    console.error('Error sending coupon notification:', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
