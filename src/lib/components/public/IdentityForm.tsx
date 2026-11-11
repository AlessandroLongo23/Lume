'use client';

import { useState } from 'react';
import { Button } from '@/lib/components/shared/ui/Button';
import { Callout } from '@/lib/components/shared/ui/Callout';
import { Field } from '@/lib/components/shared/ui/forms/Field';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { PhoneNumber } from '@/lib/components/shared/ui/forms/PhoneNumber';
import { TextArea } from '@/lib/components/shared/ui/forms/TextArea';
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
        <FormInput
          size="lg"
          label="Nome"
          required
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Mario"
          autoComplete="given-name"
        />
        <FormInput
          size="lg"
          label="Cognome"
          required
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Rossi"
          autoComplete="family-name"
        />
      </div>

      <Field label="Telefono" required>
        {({ id }) => (
          <PhoneNumber
            size="lg"
            id={id}
            prefixCode={phonePrefix}
            phoneNumber={phone}
            onPrefixChange={setPhonePrefix}
            onPhoneChange={setPhone}
          />
        )}
      </Field>

      <FormInput
        size="lg"
        label="Email"
        required={emailRequired}
        hint={
          emailRequired
            ? requireApproval
              ? 'Ti scriviamo qui non appena il salone conferma la prenotazione.'
              : undefined
            : 'Facoltativa: se la lasci, ti inviamo il riepilogo via email.'
        }
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="mario.rossi@email.it"
        autoComplete="email"
      />

      <TextArea
        label="Note per il salone"
        hint="Facoltativo"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder="Es. preferisco un colore caldo, allergie, ecc."
        // 16px text on phones so iOS does not zoom into the field on focus.
      />

      {error && <Callout tone="danger" title={error} />}

      <Button
        variant="primary"
        size="lg"
        onClick={handleSubmit}
        loading={submitting}
        className="w-full sm:w-auto sm:self-start px-6"
      >
        Vai al riepilogo
      </Button>
    </div>
  );
}
