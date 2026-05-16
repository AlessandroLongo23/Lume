'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PhoneNumber } from '@/lib/components/shared/ui/forms/PhoneNumber';
import { supabase } from '@/lib/supabase/client';
import type { BookingIdentity } from '@/lib/booking/publicTypes';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Hint surfaced when the booking_config requires email — driven by either
// guest_email_required (owner's explicit preference) or require_approval
// (the only realistic channel to notify the visitor about an approval).
function shouldRequireEmail(
  guestEmailRequired: boolean,
  requireApproval: boolean,
): boolean {
  return guestEmailRequired || requireApproval;
}

export function IdentityForm({
  salonId,
  accessMode,
  guestEmailRequired,
  requireApproval,
  onSubmit,
}: {
  salonId: string;
  accessMode: 'public' | 'clients_only' | 'selected';
  guestEmailRequired: boolean;
  requireApproval: boolean;
  onSubmit: (identity: BookingIdentity) => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+39');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailRequired = shouldRequireEmail(guestEmailRequired, requireApproval);

  const validate = (): string | null => {
    if (!firstName.trim()) return 'Inserisci il tuo nome.';
    if (!lastName.trim()) return 'Inserisci il tuo cognome.';
    if (!phone.replace(/\D/g, '')) return 'Inserisci un numero di telefono valido.';
    if (emailRequired && !email.trim()) {
      return requireApproval
        ? 'Email obbligatoria per riceverne la conferma.'
        : 'Email obbligatoria per questo salone.';
    }
    if (email.trim() && !EMAIL_RE.test(email.trim())) return "L'indirizzo email non sembra valido.";
    return null;
  };

  const handleSubmit = async () => {
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const cleanPhone = phone.replace(/\s/g, '');
    const cleanEmail = email.trim() || null;

    // Pre-check the whitelist in selected mode so the visitor gets feedback
    // before having to confirm. The RPC re-checks server-side regardless.
    if (accessMode === 'selected') {
      setSubmitting(true);
      try {
        const { data, error: rpcError } = await supabase.rpc('is_client_allowed_to_book', {
          p_salon_id: salonId,
          p_phone: cleanPhone,
          p_email: cleanEmail,
        });
        if (rpcError) {
          setError('Impossibile verificare l\'accesso. Riprova.');
          return;
        }
        if (!data) {
          setError(
            'Il tuo contatto non risulta tra quelli abilitati alle prenotazioni online. Contatta il salone per assistenza.',
          );
          return;
        }
      } finally {
        setSubmitting(false);
      }
    }

    onSubmit({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone_prefix: phonePrefix,
      phone: cleanPhone,
      email: cleanEmail,
      note: note.trim() || null,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Nome" required>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Mario"
            autoComplete="given-name"
            className={inputClass}
          />
        </Field>
        <Field label="Cognome" required>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Rossi"
            autoComplete="family-name"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Telefono" required>
        <PhoneNumber
          prefixCode={phonePrefix}
          phoneNumber={phone}
          onPrefixChange={setPhonePrefix}
          onPhoneChange={setPhone}
        />
      </Field>

      <Field
        label="Email"
        required={emailRequired}
        hint={
          emailRequired
            ? requireApproval
              ? 'Ti scriviamo qui non appena il salone conferma la prenotazione.'
              : undefined
            : 'Facoltativa — se la lasci, ti inviamo il riepilogo via email.'
        }
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="mario.rossi@email.it"
          autoComplete="email"
          className={inputClass}
        />
      </Field>

      <Field label="Note per il salone" hint="Facoltativo">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Es. preferisco un colore caldo, allergie, ecc."
          className={`${inputClass} resize-none`}
        />
      </Field>

      {error && (
        <p className="text-sm text-[var(--lume-danger-fg)] bg-[var(--lume-danger-bg)] border border-[var(--lume-danger-border)] rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="self-start inline-flex items-center gap-2 rounded-lg bg-[var(--lume-button-accent-bg)] hover:bg-[var(--lume-button-accent-bg-hover)] active:bg-[var(--lume-button-accent-bg-active)] text-[var(--lume-button-accent-fg)] px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lume-ring-focus)]"
      >
        {submitting && <Loader2 className="size-4 animate-spin" />}
        Vai al riepilogo
      </button>
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-[var(--lume-border)] bg-[var(--lume-control-bg)] px-3 py-2 text-sm text-[var(--lume-text)] placeholder:text-[var(--lume-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--lume-ring-focus)] focus:border-[var(--lume-accent)] transition-shadow';

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-[var(--lume-text-secondary)]">
        {label}
        {required && <span className="text-[var(--lume-danger-fg)] ml-0.5">*</span>}
      </span>
      {children}
      {hint && <span className="text-[11px] text-[var(--lume-text-muted)]">{hint}</span>}
    </label>
  );
}
