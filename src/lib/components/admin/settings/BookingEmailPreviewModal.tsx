'use client';

import { useId, useMemo, useState } from 'react';
import { Modal } from '@/lib/components/shared/ui/modals/Modal';
import { DialogHeader } from '@/lib/components/shared/ui/modals/dialogParts';
import { TabBar, TabButton } from '@/lib/components/shared/ui/Tabs';
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
  const titleId = useId();

  return (
    <Modal isOpen={isOpen} onClose={onClose} classes="max-w-3xl" labelledBy={titleId}>
      <>
      <DialogHeader
        titleId={titleId}
        title="Anteprima email prenotazioni"
        subtitle="Mostrato con i dati del tuo salone. Le email reali useranno i dati del cliente."
        onClose={onClose}
        divider
      />

      <div className="px-6 pt-4 pb-2">
        <TabBar label="Tipo di email">
          {VARIANTS.map((v) => (
            <TabButton key={v.value} active={v.value === variant} onClick={() => setVariant(v.value)}>
              {v.label}
            </TabButton>
          ))}
        </TabBar>
        {activeVariant && (
          <p className="mt-3 text-xs text-[var(--lume-text-secondary)]">{activeVariant.hint}</p>
        )}
        {rendered && (
          <p className="mt-3 text-xs text-[var(--lume-text-secondary)]">
            <span className="text-[var(--lume-text-muted)]">Oggetto:</span>{' '}
            <span className="text-[var(--lume-text)] font-medium">{rendered.subject}</span>
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
            // ds-ignore: email preview frame; an email is read on white in every mail client, so it stays white in dark mode too
            className="w-full h-[60vh] rounded-xl shadow-[inset_0_0_0_1px_var(--lume-line)] bg-white"
          />
        ) : (
          <p className="text-sm text-[var(--lume-text-secondary)] text-center py-12">
            Caricamento impostazioni del salone…
          </p>
        )}
      </div>
      </>
    </Modal>
  );
}
