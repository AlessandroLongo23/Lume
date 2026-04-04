import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);

const TYPE_LABELS: Record<string, string> = {
  bug: 'Non funziona',
  feature: "Ho un'idea",
  other: 'Altro',
};

export async function POST(request: NextRequest) {
  try {
    const { type, message, imageBase64, imageName } = await request.json();

    if (!type || !message?.trim()) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const { error: dbError } = await supabase.from('feedbacks').insert({
      user_id: user?.id ?? null,
      type,
      message: message.trim(),
    });

    if (dbError) {
      console.error('[feedback] DB insert error:', dbError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Send notification email — fire and forget, never break UX on failure
    const typeLabel = TYPE_LABELS[type] ?? type;
    const userEmail = user?.email ?? 'Utente non autenticato';
    const userId = user?.id ?? 'N/A';
    const timestamp = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' });

    const html = `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table align="center" width="600" cellpadding="0" cellspacing="0" style="margin:32px auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);background:#ffffff;">
    <tr>
      <td style="background:#6366f1;padding:32px 40px;">
        <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;letter-spacing:-0.5px;">
          Lume — Nuovo Feedback
        </h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">${timestamp}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 40px;">

        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom:24px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#71717a;">Tipo</p>
              <span style="display:inline-block;padding:4px 12px;border-radius:9999px;background:#eef2ff;color:#4f46e5;font-size:13px;font-weight:600;">${typeLabel}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:24px;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#71717a;">Messaggio</p>
              <div style="background:#f4f4f5;border-radius:8px;padding:16px 20px;font-size:15px;line-height:1.6;color:#18181b;white-space:pre-wrap;">${message.trim()}</div>
            </td>
          </tr>
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#71717a;">Utente</p>
              <table cellpadding="0" cellspacing="0">
                <tr><td style="padding:3px 0;font-size:14px;color:#3f3f46;width:80px;">Email</td><td style="padding:3px 0;font-size:14px;color:#18181b;font-weight:500;">${userEmail}</td></tr>
                <tr><td style="padding:3px 0;font-size:14px;color:#3f3f46;">ID</td><td style="padding:3px 0;font-size:13px;color:#71717a;font-family:monospace;">${userId}</td></tr>
              </table>
            </td>
          </tr>
        </table>

      </td>
    </tr>
    <tr>
      <td style="padding:16px 40px;background:#fafafa;border-top:1px solid #f0f0f0;">
        <p style="margin:0;font-size:12px;color:#a1a1aa;text-align:center;">Notifica automatica da Lume · lume.app</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text = `Lume — Nuovo Feedback\n\nTipo: ${typeLabel}\nUtente: ${userEmail} (ID: ${userId})\nData: ${timestamp}\n\nMessaggio:\n${message.trim()}`;

    const attachments =
      imageBase64 && imageName
        ? [{ filename: imageName, content: imageBase64 }]
        : undefined;

    resend.emails.send({
      from: 'Lume <onboarding@resend.dev>',
      to: [process.env.NOTIFICATION_EMAIL!],
      subject: `[Lume Feedback] ${typeLabel} da ${userEmail}`,
      html,
      text,
      attachments,
    }).catch((err) => {
      console.error('[feedback] Resend error:', err);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[feedback] Unexpected error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
