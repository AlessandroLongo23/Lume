'use client';

import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Check, Hourglass } from 'lucide-react';
import type { BookableService } from '@/lib/booking/publicTypes';

export function BookingConfirmation({
  status,
  service,
  startAt,
  emailSent,
}: {
  status: 'created' | 'pending_approval';
  service: BookableService;
  startAt: string;
  emailSent: boolean;
}) {
  const approved = status === 'created';
  const Icon = approved ? Check : Hourglass;
  const start = new Date(startAt);

  return (
    <div className="rounded-2xl border border-[var(--lume-border)] bg-[var(--lume-surface-raised)] p-8 text-center">
      <div
        className={`mx-auto size-14 rounded-full inline-flex items-center justify-center ${
          approved
            ? 'bg-[var(--lume-success-bg)] text-[var(--lume-success-fg)]'
            : 'bg-[var(--lume-warning-bg)] text-[var(--lume-warning-fg)]'
        }`}
      >
        <Icon className="size-7" />
      </div>

      <h2 className="mt-4 text-xl font-semibold text-[var(--lume-text)]">
        {approved ? 'Prenotazione confermata' : 'Richiesta inviata'}
      </h2>
      <p className="mt-2 text-sm text-[var(--lume-text-secondary)]">
        {approved
          ? 'Ti aspettiamo al salone.'
          : 'Il salone valuterà la tua richiesta e ti faremo sapere.'}
      </p>

      <div className="mt-6 rounded-xl bg-[var(--lume-surface)] px-5 py-4 text-left">
        <p className="text-sm font-medium text-[var(--lume-text)]">{service.name}</p>
        <p className="mt-1 text-sm text-[var(--lume-text-secondary)]">
          {format(start, "EEEE d MMMM yyyy", { locale: it })} · {format(start, 'HH:mm')}
        </p>
      </div>

      {emailSent && (
        <p className="mt-4 text-xs text-[var(--lume-text-muted)]">
          Ti abbiamo inviato il riepilogo via email.
        </p>
      )}
    </div>
  );
}
