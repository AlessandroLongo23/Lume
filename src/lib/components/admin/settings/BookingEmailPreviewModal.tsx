'use client';

import { useMemo, useState } from 'react';
import { X, Mail } from 'lucide-react';
import { Modal } from '@/lib/components/shared/ui/modals/Modal';
import { useSalonSettingsStore } from '@/lib/stores/salonSettings';
import {
  renderBookingEmail,
  type BookingEmailVariant,
} from '@/lib/email/templates/bookingEmailTemplate';

const VARIANTS: { value: BookingEmailVariant; label: string; hint: string }[] = [
  { value: 'created', label: 'Conferma automatica', hint: 'Inviata subito quando la prenotazione non richiede approvazione.' },
  { value: 'pending_approval', label: 'Richiesta ricevuta', hint: "Inviata subito quando la prenotazione richiede l'approvazione." },
  { value: 'approved', label: 'Approvata', hint: "Inviata quando approvi una richiesta dall'inbox." },
  { value: 'declined', label: 'Rifiutata', hint: "Inviata quando rifiuti una richiesta dall'inbox." },
  { value: 'cancelled', label: 'Annullata', hint: 'Inviata quando una prenotazione viene annullata.' },
  { value: 'reminder', label: 'Promemoria', hint: "Inviata prima dell'appuntamento se attivi i promemoria." },
];

/** Sample data — picks the next weekday at 14:30 from "now" so the email
 *  always shows a future-looking appointment regardless of when the owner
 *  opens the preview. Falls back to the day after tomorrow if today already
 *  has a 14:30 slot booked in the past. */
function samplePreviewDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(14, 30, 0, 0);
  return d;
}

export function BookingEmailPreviewModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const settings = useSalonSettingsStore((s) => s.settings);
  const [variant, setVariant] = useState<BookingEmailVariant>('created');

  const rendered = useMemo(() => {
    if (!settings) return null;
    return renderBookingEmail({
      toEmail: 'cliente@example.com',
      toFirstName: 'Giulia',
      variant,
      salon: {
        name: settings.name || 'Il tuo salone',
        brandColor: settings.brand_color,
        logoUrl: settings.logo_url,
        address: settings.address,
        city: settings.city,
        cap: settings.cap,
        province: settings.province,
        phone: settings.phone,
      },
      booking: {
        serviceName: 'Taglio capelli',
        startAt: samplePreviewDate(),
        durationMinutes: 60,
      },
    });
  }, [settings, variant]);

  const activeVariant = VARIANTS.find((v) => v.value === variant);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      classes="w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-2xl shadow-xl"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex items-center justify-center size-9 rounded-lg bg-primary/10 text-primary shrink-0">
            <Mail className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Anteprima email prenotazioni</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Mostrato con i dati del tuo salone. Le email reali useranno i dati del cliente.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi"
          className="size-8 inline-flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="px-6 pt-4 pb-2">
        <div className="flex flex-wrap gap-1.5">
          {VARIANTS.map((v) => {
            const active = v.value === variant;
            return (
              <button
                key={v.value}
                type="button"
                onClick={() => setVariant(v.value)}
                className={`text-xs font-medium rounded-full px-3 py-1.5 border transition-colors ${
                  active
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-primary/40'
                }`}
              >
                {v.label}
              </button>
            );
          })}
        </div>
        {activeVariant && (
          <p className="mt-3 text-xs text-zinc-500">{activeVariant.hint}</p>
        )}
        {rendered && (
          <p className="mt-3 text-xs text-zinc-500">
            <span className="text-zinc-400">Oggetto:</span>{' '}
            <span className="text-zinc-700 dark:text-zinc-200 font-medium">{rendered.subject}</span>
          </p>
        )}
      </div>

      <div className="px-6 pb-6">
        {rendered ? (
          <iframe
            title="Anteprima email"
            srcDoc={rendered.html}
            // Sandbox so the preview HTML can't run scripts or break out of
            // its frame. allow-same-origin is intentionally omitted to keep
            // the iframe in a null origin.
            sandbox=""
            className="w-full h-[60vh] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white"
          />
        ) : (
          <p className="text-sm text-zinc-500 text-center py-12">
            Caricamento impostazioni del salone…
          </p>
        )}
      </div>
    </Modal>
  );
}
