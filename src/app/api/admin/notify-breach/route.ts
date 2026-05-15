import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { requireAdmin } from '@/lib/gateway/requireAdmin';
import { LUME_LEGAL } from '@/lib/const/legal';

// Platform-admin-only. Sends an Art. 33-style breach notification to one
// affected salon owner or to all active salon owners (mass breach).
//
// Runbook lives at RUNBOOK-DATA-BREACH.md (project root).
//
// Body shape:
//   { salonId: uuid, summary: string, incidentRef?: string }    — single salon
//   { all: true,     summary: string, incidentRef?: string }    — all salons

const resend = new Resend(process.env.RESEND_API_KEY);

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderEmail(summary: string, incidentRef: string | undefined, salonName: string): string {
  const ref = incidentRef ? `<p style="color:#71717a;font-size:12px;">Riferimento incidente: <code>${escapeHtml(incidentRef)}</code></p>` : '';
  return `<!doctype html>
<html lang="it"><body style="font-family:Inter,Arial,sans-serif;margin:0;padding:24px;background:#f4f4f5;color:#18181b;">
  <table align="center" width="600" style="background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:32px;">
    <tr><td>
      <p style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6366f1;margin:0 0 12px;">Notifica di violazione dei dati</p>
      <h1 style="font-size:20px;margin:0 0 16px;">${escapeHtml(salonName)} &mdash; comunicazione Lume ai sensi del DPA, §9</h1>
      <p>Gentile titolare,</p>
      <p>
        Ai sensi dell&apos;art. 33 GDPR e del nostro <a href="https://lumeapp.it/dpa" style="color:#6366f1;">Data Processing Agreement</a> (§9),
        Le comunichiamo che &egrave; stata rilevata una potenziale violazione di dati personali che potrebbe interessare il Suo salone.
      </p>
      <h2 style="font-size:14px;margin:24px 0 8px;color:#52525b;">Descrizione dell&apos;incidente</h2>
      <div style="white-space:pre-wrap;line-height:1.6;">${escapeHtml(summary)}</div>
      <h2 style="font-size:14px;margin:24px 0 8px;color:#52525b;">Cosa fare ora</h2>
      <ul style="line-height:1.6;">
        <li>Conservi questa email: contiene gli elementi necessari per la notifica al Garante (art. 33 GDPR), da effettuare entro 72 ore dalla scoperta.</li>
        <li>Valuti, in qualit&agrave; di Titolare, se la violazione comporta un rischio elevato per i diritti e le libert&agrave; degli interessati: in tal caso &egrave; tenuto a comunicarla anche ai propri clienti (art. 34 GDPR).</li>
        <li>Per qualsiasi domanda o supporto, ci scriva a <a href="mailto:${LUME_LEGAL.privacyEmail}" style="color:#6366f1;">${LUME_LEGAL.privacyEmail}</a>.</li>
      </ul>
      ${ref}
      <p style="color:#71717a;font-size:12px;margin-top:32px;">
        ${escapeHtml(LUME_LEGAL.legalName)} &mdash; Responsabile del trattamento ai sensi dell&apos;art. 28 GDPR.
      </p>
    </td></tr>
  </table>
</body></html>`;
}

async function sendOne(to: string, salonName: string, summary: string, incidentRef?: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: `${LUME_LEGAL.name} Sicurezza <security@lumeapp.it>`,
      to: [to],
      subject: `[Urgente] Notifica di violazione dei dati personali — Lume`,
      html: renderEmail(summary, incidentRef, salonName),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'send failed' };
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const body = await request.json().catch(() => ({}));
  const summary = typeof body.summary === 'string' ? body.summary.trim() : '';
  const incidentRef = typeof body.incidentRef === 'string' ? body.incidentRef.trim() : undefined;
  const salonId = typeof body.salonId === 'string' ? body.salonId : undefined;
  const all = body.all === true;

  if (!summary || summary.length < 20) {
    return NextResponse.json({ error: 'Il campo "summary" deve descrivere l\'incidente (≥20 caratteri).' }, { status: 400 });
  }
  if (!salonId && !all) {
    return NextResponse.json({ error: 'Specifica "salonId" oppure "all: true".' }, { status: 400 });
  }

  const admin = getAdminClient();

  // Resolve recipients via the salons.owner_id → profiles.email join. We email
  // the owner specifically, not every operator, because the owner is the
  // Titolare for GDPR purposes.
  let query = admin
    .from('salons')
    .select('id, name, owner_id, profiles:profiles!salons_owner_id_fkey(email)');
  if (!all && salonId) query = query.eq('id', salonId);

  const { data: salons, error } = await query;
  if (error) {
    console.error('notify-breach salon lookup failed:', error);
    return NextResponse.json({ error: 'Impossibile recuperare i destinatari.' }, { status: 500 });
  }
  if (!salons || salons.length === 0) {
    return NextResponse.json({ error: 'Nessun salone trovato per i criteri indicati.' }, { status: 404 });
  }

  const results = await Promise.all(
    salons.map(async (s: { id: string; name: string; profiles: { email: string } | { email: string }[] | null }) => {
      const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
      const email = profile?.email;
      if (!email) return { salonId: s.id, ok: false, error: 'no owner email' };
      const sent = await sendOne(email, s.name ?? 'Salone', summary, incidentRef);
      return { salonId: s.id, ...sent };
    }),
  );

  const sent = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  return NextResponse.json({ sent, failedCount: failed.length, failed });
}
