'use client';

import { useState, useEffect } from 'react';
import { AtSign, Lock } from 'lucide-react';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { useOperatorsStore } from '@/lib/stores/operators';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import type { Operator } from '@/lib/types/Operator';

interface AddOperatorCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  operator: Operator;
}

const emptyForm = () => ({ email: '', password: '' });
const emptyErrors = () => ({ email: '', password: '' });

/**
 * Promotes a no-auth operator to one that can log in. Asks for email + password,
 * delegates to /api/operators PATCH addCredentials. Cross-salon collisions
 * surface as 409 errors here until identity sub-problem #03 lands.
 */
export function AddOperatorCredentialsModal({ isOpen, onClose, operator }: AddOperatorCredentialsModalProps) {
  const addCredentials = useOperatorsStore((s) => s.addCredentials);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState(emptyErrors());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
      const random = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      setForm({ email: '', password: random });
      setErrors(emptyErrors());
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    const e = emptyErrors();
    if (!form.email.trim()) e.email = "Inserisci un'email";
    else if (!/.+@.+\..+/.test(form.email)) e.email = "Email non valida";
    if (form.password.length < 8) e.password = 'La password deve contenere almeno 8 caratteri.';
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;

    setSubmitting(true);
    try {
      await addCredentials(operator.id, { email: form.email.trim(), password: form.password });
      messagePopup.getState().success('Credenziali create con successo');
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error(msg);
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Aggiungi credenziali"
      subtitle={`Crea l'accesso per ${operator.firstName} ${operator.lastName}`}
      classes="max-w-lg"
      confirmText="Crea accesso"
      confirmDisabled={submitting}
    >
      <div className="flex flex-col gap-6">
        <p className="text-sm text-[var(--lume-text-secondary)]">
          L&apos;operatore potrà accedere al gestionale con questa email e password. Alla prima
          autenticazione gli verrà chiesto di cambiare la password.
        </p>

        <FormInput
          label="Email"
          labelIcon={AtSign}
          required
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          autoComplete="off"
          error={errors.email || undefined}
        />

        {/* Shown in clear: the owner reads the generated password to hand it over. */}
        <FormInput
          label="Password"
          labelIcon={Lock}
          required
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          error={errors.password || undefined}
        />
      </div>
    </AddModal>
  );
}
