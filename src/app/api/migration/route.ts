import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getActiveSalonId } from '@/lib/utils/getActiveSalonId';

const resend = new Resend(process.env.RESEND_API_KEY);

function getAdminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(request: NextRequest) {
  try {
    const { files } = await request.json() as { files: { fileBase64: string; fileName: string }[] };

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Securely resolve user identity from the session cookie
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Read profile to get the fallback salon_id
    const admin = getAdminSupabase();
    const { data: profile } = await admin
      .from('profiles')
      .select('salon_id, is_super_admin')
      .eq('id', user.id)
      .single();

    const salonId = await getActiveSalonId(profile?.salon_id ?? 'N/A', profile?.is_super_admin ?? false);
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
          Lume — Richiesta Migrazione Dati
        </h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">${timestamp}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom:24px;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#71717a;">Identità utente</p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:#3f3f46;width:90px;">User ID</td>
                  <td style="padding:4px 0;font-size:13px;color:#18181b;font-family:monospace;font-weight:600;">${user.id}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:#3f3f46;">Email</td>
                  <td style="padding:4px 0;font-size:14px;color:#18181b;">${user.email ?? 'N/A'}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:24px;border-top:1px solid #f0f0f0;padding-top:24px;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#71717a;">Salone da importare</p>
              <div style="display:inline-block;padding:8px 16px;border-radius:8px;background:#eef2ff;border:1px solid #c7d2fe;">
                <span style="font-size:15px;font-family:monospace;font-weight:700;color:#4f46e5;">${salonId}</span>
              </div>
              <p style="margin:8px 0 0;font-size:12px;color:#71717a;">Usa questo salon_id per eseguire gli script SQL di seed.</p>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #f0f0f0;padding-top:24px;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#71717a;">File allegati (${files.length})</p>
              ${files.map((f, i) => `<p style="margin:${i > 0 ? '4px' : '0'} 0 0;font-size:14px;color:#18181b;">${f.fileName}</p>`).join('')}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 40px;background:#fafafa;border-top:1px solid #f0f0f0;">
        <p style="margin:0;font-size:12px;color:#a1a1aa;text-align:center;">Notifica automatica da Lume · lumeapp.it</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const fileList = files.map((f) => `  - ${f.fileName}`).join('\n');
    const text = `Lume — Richiesta Migrazione Dati\n\nData: ${timestamp}\n\nUser ID: ${user.id}\nEmail: ${user.email ?? 'N/A'}\nSalon ID (usa questo per il seed SQL): ${salonId}\n\nFile allegati (${files.length}):\n${fileList}`;

    resend.emails.send({
      from: 'Lume <onboarding@resend.dev>',
      to: [process.env.NOTIFICATION_EMAIL!],
      subject: `[Lume Migration] Dati da importare — salon ${salonId}`,
      html,
      text,
      attachments: files.map((f) => ({ filename: f.fileName, content: f.fileBase64 })),
    }).catch((err) => {
      console.error('[migration] Resend error:', err);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[migration] Unexpected error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
