'use client';

import { useState } from 'react';
import { Clock, Phone, X } from 'lucide-react';
import { Button } from '@/lib/components/shared/ui/Button';
import { Callout } from '@/lib/components/shared/ui/Callout';
import { StatusDot } from '@/lib/components/shared/ui/StatusDot';
import { TextLink } from '@/lib/components/shared/ui/TextLink';
import type { PublicBookingByToken } from '@/lib/gateway/loadPublicSalon';
import { PublicHeading } from './PublicHeading';
import { BookingSummary } from './BookingSummary';

// Public cancel/manage page. Three states the visitor can land in:
//
//   1. Cancellable — booking is 'created' or 'pending_approval' AND now()
//      < start_at - cancel_window_hours. Big "Annulla prenotazione" button
//      with a confirmation step so a stray tap doesn't cancel.
//   2. Read-only — booking is still active but past the cancel window
//      (start_at - window <= now < start_at), or it's already happened
//      ('completed'). Shows the appointment and copy explaining why online
//      cancel is no longer available.
//   3. Cancelled — booking is already 'cancelled' (server-side state, set
//      either by this flow on a previous visit or by the salon staff). We
//      show a confirmation card so the visitor isn't left wondering.
//
// All copy is Italian. The slug param in the URL doesn't gate access — the
// token does. We render whatever the resolver returned; if the visitor
// hand-edited the slug, the page still works.

export function BookingManagePage({ booking }: { booking: PublicBookingByToken }) {
  const [state, setState] = useState<'idle' | 'confirming' | 'submitting' | 'cancelled' | 'error'>(
    booking.status === 'cancelled' ? 'cancelled' : 'idle',
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const start = new Date(booking.start_at);

  async function handleCancel() {
    setState('submitting');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/public/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenFromLocation() }),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (!res.ok || !json.success) {
        setErrorMsg(json.error ?? 'Errore durante la cancellazione. Riprova.');
        setState('error');
        return;
      }
      setState('cancelled');
    } catch {
      setErrorMsg('Impossibile contattare il server. Riprova fra qualche istante.');
      setState('error');
    }
  }

  // Already cancelled — terminal state, only a confirmation card.
  if (state === 'cancelled') {
    return (
      <article className="surface-card rounded-2xl px-5 py-7 sm:p-8">
        <Header salonName={booking.salon_name} logoUrl={booking.salon_logo_url} />
        <div className="mt-6 flex flex-col items-center text-center">
          <div className="size-12 rounded-full bg-[var(--lume-surface)] inline-flex items-center justify-center text-[var(--lume-text-secondary)]">
            <X className="size-6" />
          </div>
          <PublicHeading
            as="h2"
            size="md"
            className="mt-4 max-w-sm"
            subtitle="L'orario è di nuovo libero per altri clienti. Puoi prenotare di nuovo quando vuoi."
          >
            Prenotazione annullata
          </PublicHeading>
        </div>

        <BookingDetails booking={booking} start={start} muted />

        <FooterContact salonName={booking.salon_name} phone={booking.salon_phone} />
      </article>
    );
  }

  const showCancellable = state === 'idle' || state === 'confirming' || state === 'submitting' || state === 'error';
  const canCancel = booking.can_cancel_now;

  return (
    <article className="surface-card rounded-2xl px-5 py-7 sm:p-8">
      <Header salonName={booking.salon_name} logoUrl={booking.salon_logo_url} />

      <div className="mt-6 flex items-center gap-3">
        <StatusBadge status={booking.status} />
      </div>

      <PublicHeading
        size="md"
        className="mt-3"
        subtitle={`Ecco i dettagli della tua prenotazione presso ${booking.salon_name}.`}
      >
        {booking.client_first ? `Ciao ${booking.client_first},` : 'La tua prenotazione'}
      </PublicHeading>

      <BookingDetails booking={booking} start={start} />

      {showCancellable && canCancel && state === 'idle' && (
        <div className="mt-6">
          <p className="text-xs text-[var(--lume-text-muted)] mb-3">
            Puoi annullare online fino a {booking.cancel_window_hours} ore prima dell&apos;orario.
          </p>
          <Button variant="secondary" size="lg" className="w-full" onClick={() => setState('confirming')}>
            Annulla la prenotazione
          </Button>
        </div>
      )}

      {showCancellable && canCancel && (state === 'confirming' || state === 'submitting') && (
        <Callout tone="warning" title="Sei sicuro?" className="mt-6">
          Una volta annullata, l&apos;orario tornerà disponibile per altri clienti.
          <div className="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="secondary" size="lg" disabled={state === 'submitting'} onClick={() => setState('idle')}>
              Torna indietro
            </Button>
            <Button variant="destructive" size="lg" loading={state === 'submitting'} onClick={handleCancel}>
              Sì, annulla
            </Button>
          </div>
        </Callout>
      )}

      {showCancellable && state === 'error' && (
        <Callout
          tone="danger"
          title="Non sono riuscito ad annullare."
          className="mt-6"
          action={
            <Button variant="secondary" size="sm" onClick={() => setState('idle')} className="max-sm:h-11">
              Riprova
            </Button>
          }
        >
          {errorMsg}
        </Callout>
      )}

      {showCancellable && !canCancel && (
        <Callout tone="info" icon={Clock} title="Non puoi più annullare online" className="mt-6">
          Per modifiche dell&apos;ultimo minuto, contatta direttamente il salone
          {booking.salon_phone ? (
            <>
              {' '}al <TextLink href={`tel:${booking.salon_phone}`}>{booking.salon_phone}</TextLink>.
            </>
          ) : (
            '.'
          )}
        </Callout>
      )}

      <FooterContact salonName={booking.salon_name} phone={booking.salon_phone} />
    </article>
  );
}

function Header({
  salonName,
  logoUrl,
}: {
  salonName: string;
  logoUrl: string | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="surface-card size-12 overflow-hidden flex items-center justify-center shrink-0">
        {logoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element -- public booking page; no image-optimisation domain config */
          <img src={logoUrl} alt={salonName} className="size-full object-contain" />
        ) : (
          <span className="text-lg font-medium tracking-tight text-[var(--lume-text-muted)]">
            {salonName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-[var(--lume-text-secondary)] truncate">{salonName}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: PublicBookingByToken['status'] }) {
  switch (status) {
    case 'created':
      return <StatusDot tone="success" className="text-sm">Confermata</StatusDot>;
    case 'pending_approval':
      return <StatusDot tone="warning" className="text-sm">In attesa di conferma</StatusDot>;
    case 'completed':
      return <StatusDot tone="neutral" className="text-sm">Completata</StatusDot>;
    default:
      return null;
  }
}

function BookingDetails({ booking, start, muted }: { booking: PublicBookingByToken; start: Date; muted?: boolean }) {
  return (
    <BookingSummary
      serviceName={booking.service_name}
      start={start}
      operatorName={[booking.operator_first, booking.operator_last].filter(Boolean).join(' ') || undefined}
      location={[booking.salon_address, booking.salon_city, booking.salon_province].filter(Boolean).join(', ') || undefined}
      muted={muted}
      className="mt-6"
    />
  );
}

function FooterContact({
  salonName,
  phone,
}: {
  salonName: string;
  phone: string | null;
}) {
  if (!phone) return null;
  return (
    <p className="mt-6 text-xs text-[var(--lume-text-muted)] text-center">
      Hai bisogno di aiuto? Chiama {salonName} al{' '}
      <TextLink href={`tel:${phone}`} className="font-normal inline-flex items-center gap-1">
        <Phone className="size-3" aria-hidden />
        {phone}
      </TextLink>
    </p>
  );
}

// The token lives in the URL path. Reading it from window keeps the component
// decoupled from Next's params plumbing while still being safe — anyone who
// loaded the page already had to know the token.
function tokenFromLocation(): string {
  if (typeof window === 'undefined') return '';
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? '';
}
