import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const { client_name, rating, review, isEdit } = await request.json();

    const starRating = '★'.repeat(rating) + '☆'.repeat(5 - rating);

    const emailHtml = `
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; margin-top: 20px; background-color: #ffffff; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          <tr><td align="center" style="padding: 40px 0 30px 0; background-color: #8b5cf6; color: #ffffff;"><h1 style="margin: 0;">${isEdit ? 'Recensione Aggiornata' : 'Nuova Recensione'}</h1></td></tr>
          <tr><td style="padding: 40px 30px;">
            <h2 style="color: #333333; border-bottom: 2px solid #eeeeee; padding-bottom: 10px;">Dettagli della Recensione</h2>
            <p style="font-size: 16px; line-height: 1.5;"><strong>Cliente:</strong> ${client_name}</p>
            <p style="font-size: 16px; line-height: 1.5;"><strong>Valutazione:</strong> <span style="color: #fbbf24; font-size: 24px;">${starRating}</span> (${rating}/5)</p>
            <h2 style="color: #333333; border-bottom: 2px solid #eeeeee; padding-bottom: 10px; margin-top: 30px;">Recensione</h2>
            <div style="background-color: #f9f9f9; padding: 20px; border-left: 4px solid #8b5cf6; margin: 15px 0;">
              <p style="font-size: 16px; line-height: 1.6; font-style: italic; color: #444444; margin: 0;">"${review}"</p>
            </div>
          </td></tr>
        </table>
      </body>
    `;

    const { error } = await resend.emails.send({
      from: 'Lume <onboarding@resend.dev>',
      to: ['longoa02@gmail.com'],
      subject: `${isEdit ? 'Recensione Aggiornata' : 'Nuova Recensione'} da ${client_name}`,
      html: emailHtml,
    });

    if (error) {
      console.error({ error });
      return NextResponse.json({ error: 'Error sending email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing review email:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
