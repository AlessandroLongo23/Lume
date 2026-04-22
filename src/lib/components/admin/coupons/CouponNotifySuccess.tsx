'use client';

import { useState } from 'react';
import { CheckCircle2, Mail, MessageCircle, Loader2 } from 'lucide-react';
import type { Client } from '@/lib/types/Client';
import type { Coupon } from '@/lib/types/Coupon';
import { buildWhatsAppLink } from '@/lib/utils/coupon-notify';

interface CouponNotifySuccessProps {
  coupon: Coupon;
  recipient: Client;
  message: string;
  onSendEmail: () => Promise<{ success: boolean; error?: string }>;
}

type EmailStatus = 'idle' | 'sending' | 'sent' | 'failed';

export function CouponNotifySuccess({
  coupon,
  recipient,
  message,
  onSendEmail,
}: CouponNotifySuccessProps) {
  const waLink = buildWhatsAppLink(recipient, message);
  const hasEmail = !!recipient.email;
  const kindLabel = coupon.kind === 'gift_card' ? 'Gift card' : 'Coupon';

  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle');
  const [emailError, setEmailError] = useState<string | null>(null);

  async function handleSendEmail() {
    if (!hasEmail || emailStatus === 'sending' || emailStatus === 'sent') return;
    setEmailStatus('sending');
    setEmailError(null);
    const result = await onSendEmail();
    setEmailStatus(result.success ? 'sent' : 'failed');
    if (!result.success) setEmailError(result.error ?? null);
  }

  const emailLabel =
    emailStatus === 'sending' ? 'Invio…'
      : emailStatus === 'sent' ? `Email inviata a ${recipient.email}`
        : emailStatus === 'failed' ? 'Riprova invio email'
          : hasEmail ? `Invia via email a ${recipient.email}` : 'Email destinatario mancante';

  const emailDisabled = !hasEmail || emailStatus === 'sending' || emailStatus === 'sent';

  const emailClass = (() => {
    const base = 'flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors';
    if (emailStatus === 'sent') return `${base} bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 cursor-default`;
    if (!hasEmail) return `${base} bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed`;
    if (emailStatus === 'sending') return `${base} bg-primary/60 text-white cursor-wait`;
    return `${base} bg-primary text-white hover:bg-primary/90`;
  })();

  return (
    <div className="flex flex-col gap-5 py-2">
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle2 className="size-6 text-emerald-500" />
        </div>
        <div>
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {kindLabel} creato per {recipient.firstName} {recipient.lastName}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Avvisalo subito per fargli sapere del regalo.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-500/15 bg-zinc-50 dark:bg-zinc-900/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Messaggio precompilato</p>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{message}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
          >
            <MessageCircle className="size-4" />
            Invia su WhatsApp
          </a>
        ) : (
          <div
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
            title="Telefono del destinatario mancante"
          >
            <MessageCircle className="size-4" />
            Telefono mancante
          </div>
        )}

        <button
          type="button"
          onClick={handleSendEmail}
          disabled={emailDisabled}
          className={emailClass}
        >
          {emailStatus === 'sending' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : emailStatus === 'sent' ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <Mail className="size-4" />
          )}
          <span className="truncate">{emailLabel}</span>
        </button>
      </div>

      {emailStatus === 'failed' && emailError && (
        <p className="text-xs text-red-500 -mt-2">Errore: {emailError}</p>
      )}
    </div>
  );
}
