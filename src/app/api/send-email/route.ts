import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function sanitize(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/<[^>]*>/g, '').trim();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();

    const level = sanitize(formData.level);
    const customSubject = sanitize(formData.customSubject);
    const frequency = sanitize(formData.frequency);
    const firstName = sanitize(formData.firstName);
    const lastName = sanitize(formData.lastName);
    const contact = sanitize(formData.contact);
    const contactType = sanitize(formData.contactType);
    const subjects: string[] = Array.isArray(formData.subjects)
      ? formData.subjects.map(sanitize)
      : [];

    const subjectList = subjects.includes('altro')
      ? subjects.filter((s) => s !== 'altro').concat(customSubject).join(', ')
      : subjects.join(', ');

    const emailHtml = `
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; margin-top: 20px; background-color: #ffffff; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          <tr><td align="center" style="padding: 40px 0 30px 0; background-color: #007bff; color: #ffffff;"><h1 style="margin: 0;">Nuova Richiesta</h1></td></tr>
          <tr><td style="padding: 40px 30px;">
            <h2 style="color: #333333; border-bottom: 2px solid #eeeeee; padding-bottom: 10px;">Dati del Richiedente</h2>
            <p style="font-size: 16px; line-height: 1.5;"><strong>Nome:</strong> ${firstName} ${lastName}</p>
            <p style="font-size: 16px; line-height: 1.5;"><strong>Contatto (${contactType}):</strong> ${contact}</p>
            <h2 style="color: #333333; border-bottom: 2px solid #eeeeee; padding-bottom: 10px; margin-top: 30px;">Dettagli della Richiesta</h2>
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr><td style="padding: 10px 0; font-size: 16px;"><strong>Livello:</strong></td><td style="padding: 10px 0; font-size: 16px;">${level}</td></tr>
              <tr><td style="padding: 10px 0; font-size: 16px;"><strong>Materie:</strong></td><td style="padding: 10px 0; font-size: 16px;">${subjectList}</td></tr>
              <tr><td style="padding: 10px 0; font-size: 16px;"><strong>Frequenza:</strong></td><td style="padding: 10px 0; font-size: 16px;">${frequency}</td></tr>
            </table>
          </td></tr>
        </table>
      </body>
    `;

    const { error } = await resend.emails.send({
      from: 'Lume <onboarding@resend.dev>',
      to: ['longoa02@gmail.com'],
      subject: `Nuova Richiesta da ${firstName} ${lastName}`,
      html: emailHtml,
    });

    if (error) {
      console.error({ error });
      return NextResponse.json({ error: 'Error sending email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
