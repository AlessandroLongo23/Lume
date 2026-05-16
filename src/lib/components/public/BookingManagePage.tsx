'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { AlertCircle, Check, Clock, Hourglass, MapPin, Phone, X } from 'lucide-react';
import type { PublicBookingByToken } from '@/lib/gateway/loadPublicSalon';

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
      <article className="rounded-2xl border border-[var(--lume-border)] bg-[var(--lume-surface-raised)] p-8">
        <Header salonName={booking.salon_name} logoUrl={booking.salon_logo_url} />
        <div className="mt-6 flex flex-col items-center text-center">
          <div className="size-12 rounded-full bg-[var(--lume-surface)] inline-flex items-center justify-center text-[var(--lume-text-secondary)]">
            <X className="size-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-[var(--lume-text)]">
            Prenotazione annullata
          </h2>
          <p className="mt-2 max-w-sm text-sm text-[var(--lume-text-secondary)]">
            L&apos;orario è di nuovo libero per altri clienti. Puoi prenotare di nuovo quando vuoi.
          </p>
        </div>

        <BookingDetails booking={booking} start={start} muted />

        <FooterContact salonName={booking.salon_name} phone={booking.salon_phone} />
      </article>
    );
  }

  const showCancellable = state === 'idle' || state === 'confirming' || state === 'submitting' || state === 'error';
  const canCancel = booking.can_cancel_now;

  return (
    <article className="rounded-2xl border border-[var(--lume-border)] bg-[var(--lume-surface-raised)] p-8">
      <Header salonName={booking.salon_name} logoUrl={booking.salon_logo_url} />

      <div className="mt-6 flex items-center gap-3">
        <StatusBadge status={booking.status} />
      </div>

      <h1 className="mt-3 text-xl font-semibold text-[var(--lume-text)]">
        {booking.client_first ? `Ciao ${booking.client_first},` : 'La tua prenotazione'}
      </h1>
      <p className="mt-2 text-sm text-[var(--lume-text-secondary)]">
        Ecco i dettagli della tua prenotazione presso {booking.salon_name}.
      </p>

      <BookingDetails booking={booking} start={start} />

      {showCancellable && canCancel && state === 'idle' && (
        <div className="mt-6">
          <p className="text-xs text-[var(--lume-text-muted)] mb-3">
            Puoi annullare online fino a {booking.cancel_window_hours} ore prima dell&apos;orario.
          </p>
          <button
            type="button"
            onClick={() => setState('confirming')}
            className="w-full rounded-lg border border-[var(--lume-border)] bg-[var(--lume-surface)] px-4 py-3 text-sm font-medium text-[var(--lume-text)] hover:border-[var(--lume-danger-border)] hover:text-[var(--lume-danger-fg)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lume-ring-focus)]"
          >
            Annulla la prenotazione
          </button>
        </div>
      )}

      {showCancellable && canCancel && state === 'confirming' && (
        <div className="mt-6 rounded-xl border border-[var(--lume-border)] bg-[var(--lume-surface)] p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 shrink-0 text-[var(--lume-warning-fg)]" />
            <div>
              <p className="text-sm font-medium text-[var(--lume-text)]">Sei sicuro?</p>
              <p className="mt-1 text-sm text-[var(--lume-text-secondary)]">
                Una volta annullata, l&apos;orario tornerà disponibile per altri clienti.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              onClick={() => setState('idle')}
              className="rounded-lg border border-[var(--lume-border)] bg-[var(--lume-surface-raised)] px-4 py-2 text-sm font-medium text-[var(--lume-text)] hover:bg-[var(--lume-surface)] transition-colors"
            >
              Torna indietro
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg bg-[var(--lume-button-destructive-bg)] hover:bg-[var(--lume-button-destructive-bg-hover)] px-4 py-2 text-sm font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lume-ring-focus)]"
            >
              Sì, annulla
            </button>
          </div>
        </div>
      )}

      {showCancellable && state === 'submitting' && (
        <div className="mt-6 rounded-xl border border-[var(--lume-border)] bg-[var(--lume-surface)] p-5 text-sm text-[var(--lume-text-secondary)] text-center">
          Sto annullando…
        </div>
      )}

      {showCancellable && state === 'error' && (
        <div className="mt-6 rounded-xl border border-[var(--lume-danger-border)] bg-[var(--lume-danger-bg)] p-5 text-sm text-[var(--lume-danger-fg)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 shrink-0" />
            <div>
              <p className="font-medium">Non sono riuscito ad annullare.</p>
              <p className="mt-1">{errorMsg}</p>
              <button
                type="button"
                onClick={() => setState('idle')}
                className="mt-3 inline-flex items-center text-sm font-medium underline"
              >
                Riprova
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancellable && !canCancel && (
        <div className="mt-6 rounded-xl border border-[var(--lume-border)] bg-[var(--lume-surface)] p-5">
          <div className="flex items-start gap-3">
            <Clock className="size-5 shrink-0 text-[var(--lume-text-muted)]" />
            <div>
              <p className="text-sm font-medium text-[var(--lume-text)]">
                Non puoi più annullare online
              </p>
              <p className="mt-1 text-sm text-[var(--lume-text-secondary)]">
                Per modifiche dell&apos;ultimo minuto, contatta direttamente il salone
                {booking.salon_phone ? (
                  <>
                    {' '}al{' '}
                    <a
                      href={`tel:${booking.salon_phone}`}
                      className="text-[var(--lume-accent)] hover:underline"
                    >
                      {booking.salon_phone}
                    </a>
                    .
                  </>
                ) : (
                  '.'
                )}
              </p>
            </div>
          </div>
        </div>
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
      <div className="size-12 rounded-xl overflow-hidden bg-[var(--lume-surface)] border border-[var(--lume-border)] flex items-center justify-center shrink-0">
        {logoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element -- public booking page; no image-optimisation domain config */
          <img src={logoUrl} alt={salonName} className="size-full object-contain" />
        ) : (
          <span className="text-lg font-semibold text-[var(--lume-text-muted)]">
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
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--lume-success-bg)] px-2.5 py-1 text-xs font-medium text-[var(--lume-success-fg)]">
          <Check className="size-3" /> Confermata
        </span>
      );
    case 'pending_approval':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--lume-warning-bg)] px-2.5 py-1 text-xs font-medium text-[var(--lume-warning-fg)]">
          <Hourglass className="size-3" /> In attesa di conferma
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--lume-surface)] px-2.5 py-1 text-xs font-medium text-[var(--lume-text-secondary)]">
          <Check className="size-3" /> Completata
        </span>
      );
    default:
      return null;
  }
}

function BookingDetails({
  booking,
  start,
  muted = false,
}: {
  booking: PublicBookingByToken;
  start: Date;
  muted?: boolean;
}) {
  const opName = [booking.operator_first, booking.operator_last].filter(Boolean).join(' ');
  const location = [booking.salon_address, booking.salon_city, booking.salon_province]
    .filter(Boolean)
    .join(', ');
  return (
    <dl
      className={`mt-6 grid grid-cols-1 gap-y-3 rounded-xl border border-[var(--lume-border)] bg-[var(--lume-surface)] p-5 text-sm ${
        muted ? 'opacity-75' : ''
      }`}
    >
      <Row label="Servizio" value={booking.service_name} />
      <Row
        label="Quando"
        value={`${format(start, 'EEEE d MMMM yyyy', { locale: it })} · ${format(start, 'HH:mm')}`}
      />
      {opName && <Row label="Operatore" value={opName} />}
      {location && (
        <Row
          label="Dove"
          value={
            <span className="inline-flex items-start gap-1.5">
              <MapPin className="size-3.5 mt-0.5 shrink-0" />
              {location}
            </span>
          }
        />
      )}
    </dl>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[var(--lume-text-muted)]">{label}</dt>
      <dd className="text-right text-[var(--lume-text)] font-medium">{value}</dd>
    </div>
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
      <a href={`tel:${phone}`} className="text-[var(--lume-accent)] hover:underline inline-flex items-center gap-1">
        <Phone className="size-3" />
        {phone}
      </a>
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
