'use client';

import { Check, Hourglass } from 'lucide-react';
import type { BookableService } from '@/lib/booking/publicTypes';
import { PublicHeading } from './PublicHeading';
import { BookingSummary } from './BookingSummary';

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
    <div className="surface-card rounded-2xl px-5 py-8 sm:p-10 text-center">
      <div
        className={`mx-auto size-14 rounded-full inline-flex items-center justify-center bg-hover ${
          approved ? 'text-success-strong' : 'text-warning-strong'
        }`}
      >
        <Icon className="size-6" aria-hidden />
      </div>

      <PublicHeading
        as="h2"
        size="md"
        className="mt-5"
        subtitle={approved ? 'Ti aspettiamo al salone.' : 'Il salone valuterà la tua richiesta e ti faremo sapere.'}
      >
        {approved ? 'Prenotazione confermata' : 'Richiesta inviata'}
      </PublicHeading>

      <BookingSummary serviceName={service.name} start={start} className="mt-6" />

      {emailSent && (
        <p className="mt-4 text-xs text-[var(--lume-text-muted)]">
          Ti abbiamo inviato il riepilogo via email.
        </p>
      )}
    </div>
  );
}
