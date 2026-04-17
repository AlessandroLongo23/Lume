'use client';

import { CheckCircle2, Mail, MessageCircle, Phone } from 'lucide-react';
import type { Client } from '@/lib/types/Client';
import type { Coupon } from '@/lib/types/Coupon';
import { buildWhatsAppLink } from '@/lib/utils/coupon-notify';

interface CouponNotifySuccessProps {
  coupon: Coupon;
  recipient: Client;
  message: string;
  emailStatus: 'pending' | 'sent' | 'failed' | 'no-email';
  emailError?: string | null;
}

export function CouponNotifySuccess({
  coupon,
  recipient,
  message,
  emailStatus,
  emailError,
}: CouponNotifySuccessProps) {
  const waLink = buildWhatsAppLink(recipient, message);
  const kindLabel = coupon.kind === 'gift_card' ? 'Gift card' : 'Coupon';

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

      <div className="flex flex-col gap-3">
        {/* WhatsApp */}
        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
          >
            <MessageCircle className="size-4" />
            Apri su WhatsApp
          </a>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
            <Phone className="size-4" />
            Numero di telefono mancante — impossibile aprire WhatsApp
          </div>
        )}

        {/* Email status */}
        <div
          className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg ${
            emailStatus === 'sent'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : emailStatus === 'failed'
                ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                : emailStatus === 'no-email'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 animate-pulse'
          }`}
        >
          <Mail className="size-4" />
          {emailStatus === 'pending' && 'Invio email in corso…'}
          {emailStatus === 'sent' && `Email inviata a ${recipient.email}`}
          {emailStatus === 'failed' && (
            <span>
              Invio email fallito{emailError ? ` — ${emailError}` : ''}
            </span>
          )}
          {emailStatus === 'no-email' && 'Email del destinatario non disponibile — non inviata'}
        </div>
      </div>
    </div>
  );
}
