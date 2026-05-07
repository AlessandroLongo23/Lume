'use client';

import { useState, useEffect } from 'react';
import { AtSign, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(true);
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

  const inputClass = 'w-full p-2 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100';
  const labelClass = 'flex flex-row items-center gap-2';

  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Aggiungi credenziali"
      subtitle={`Crea l'accesso per ${operator.firstName} ${operator.lastName}`}
      icon={KeyRound}
      classes="max-w-lg"
      confirmText="Crea accesso"
      confirmDisabled={submitting}
    >
      <div className="flex flex-col gap-6">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          L&apos;operatore potrà accedere al gestionale con questa email e password. Alla prima
          autenticazione gli verrà chiesto di cambiare la password.
        </p>

        <div className="flex flex-col gap-2">
          <label className={labelClass}><AtSign className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Email *</span></label>
          <input
            type="email"
            className={inputClass}
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            autoComplete="off"
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}><Lock className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Password *</span></label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className={inputClass}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
            >
              {showPassword ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
        </div>
      </div>
    </AddModal>
  );
}
