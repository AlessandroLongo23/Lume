'use client';

import { useState } from 'react';
import { CheckCircle2, Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/lib/components/shared/ui/Button';
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

  return (
    <div className="flex flex-col gap-5 py-2" data-tour="coupon-notify">
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-full bg-success-soft flex items-center justify-center">
          <CheckCircle2 className="size-6 text-success-strong" />
        </div>
        <div>
          <p className="text-base font-medium text-[var(--lume-text)]">
            {kindLabel} creato per {recipient.firstName} {recipient.lastName}
          </p>
          <p className="text-sm text-[var(--lume-text-secondary)]">
            Avvisalo subito per fargli sapere del regalo.
          </p>
        </div>
      </div>

      <div className="surface-card p-4">
        <p className="text-xs font-medium text-[var(--lume-text-muted)] mb-2">Messaggio precompilato</p>
        <p className="text-sm text-[var(--lume-text)] whitespace-pre-wrap">{message}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {waLink ? (
          <Button asChild variant="secondary" className="w-full">
            <a href={waLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4 text-success-strong" aria-hidden />
              Invia su WhatsApp
            </a>
          </Button>
        ) : (
          <Button variant="secondary" className="w-full" disabled leadingIcon={MessageCircle} title="Telefono del destinatario mancante">
            Telefono mancante
          </Button>
        )}

        <Button
          variant="secondary"
          onClick={handleSendEmail}
          disabled={emailDisabled}
          loading={emailStatus === 'sending'}
          leadingIcon={emailStatus === 'sent' ? CheckCircle2 : Mail}
          className="w-full min-w-0"
        >
          <span className="truncate">{emailLabel}</span>
        </Button>
      </div>

      {emailStatus === 'failed' && emailError && (
        <p className="text-xs text-danger-strong -mt-2">Errore: {emailError}</p>
      )}
    </div>
  );
}
