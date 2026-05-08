import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export interface MembershipInviteParams {
  toEmail: string;
  toFirstName: string;
  ownerName: string;
  salonName: string;
  token: string;
  baseUrl: string;
}

export async function sendMembershipInviteEmail(params: MembershipInviteParams): Promise<void> {
  const { toEmail, toFirstName, ownerName, salonName, token, baseUrl } = params;
  const inviteUrl = `${baseUrl}/account/inviti/${token}`;

  const html = `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,sans-serif;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="600"
    style="border-collapse:collapse;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <tr>
      <td style="background:#6366F1;padding:32px 40px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Lume</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:40px;">
        <p style="margin:0 0 16px;font-size:16px;color:#18181b;">Ciao ${esc(toFirstName)},</p>
        <p style="margin:0 0 24px;font-size:16px;color:#18181b;line-height:1.6;">
          <strong>${esc(ownerName)}</strong> ti ha invitato a unirti a <strong>${esc(salonName)}</strong> su Lume come operatore.
        </p>
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="padding:8px 0 32px;">
              <a href="${esc(inviteUrl)}"
                style="display:inline-block;background:#6366F1;color:#ffffff;font-size:15px;font-weight:600;
                       text-decoration:none;padding:14px 32px;border-radius:8px;">
                Accetta invito
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 8px;font-size:13px;color:#71717a;">L'invito scade tra 7 giorni.</p>
        <p style="margin:0;font-size:13px;color:#71717a;">
          Se non riesci a cliccare il pulsante, copia questo link nel browser:<br>
          <a href="${esc(inviteUrl)}" style="color:#6366F1;word-break:break-all;">${esc(inviteUrl)}</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 40px;background:#f4f5f7;text-align:center;">
        <p style="margin:0;font-size:12px;color:#a1a1aa;">© ${new Date().getFullYear()} Lume. Tutti i diritti riservati.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: 'Lume <noreply@lumeapp.it>',
    to: [toEmail],
    subject: `${esc(ownerName)} ti ha invitato su Lume`,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}
