'use client';

import { useState, useEffect } from 'react';
import { User, AtSign, Phone, Lock, Eye, EyeOff, Info } from 'lucide-react';
import { useOperatorsStore } from '@/lib/stores/operators';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { PhoneNumber } from '@/lib/components/shared/ui/forms/PhoneNumber';

interface AddOperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emptyOp = () => ({ firstName: '', lastName: '', email: '', password: '', phonePrefix: '+39', phoneNumber: '' });
const emptyErrors = () => ({ firstName: '', lastName: '', email: '', password: '', phone: '' });

export function AddOperatorModal({ isOpen, onClose }: AddOperatorModalProps) {
  const operators = useOperatorsStore((s) => s.operators);
  const addOperator = useOperatorsStore((s) => s.addOperator);
  const [op, setOp] = useState(emptyOp());
  const [errors, setErrors] = useState(emptyErrors());
  const [showPassword, setShowPassword] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
      const randomPassword = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOp({ ...emptyOp(), password: randomPassword });
      setErrors(emptyErrors());
    }
  }, [isOpen, operators.length]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const set = (key: string, value: any) => setOp((o) => ({ ...o, [key]: value }));

  // No-auth operator: created for fiches/statistics only, cannot log in.
  // Triggered when both email and password are blank.
  const willCreateAccount = !!op.email.trim();

  const handleSubmit = async () => {
    const e = emptyErrors();
    if (!op.firstName.trim()) e.firstName = 'Inserisci un nome';
    if (!op.lastName.trim()) e.lastName = 'Inserisci un cognome';
    if (willCreateAccount && op.password.length < 8) e.password = 'La password deve contenere almeno 8 caratteri.';
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;

    try {
      // Don't send a placeholder password when no account is being created —
      // the API uses the presence of password to decide whether to provision auth.
      const payload = willCreateAccount ? { ...op } : { ...op, password: '' };
      await addOperator(payload);
      messagePopup.getState().success('Operatore aggiunto con successo');
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error("Errore durante la creazione dell'operatore: " + msg);
    }
  };

  const inputClass = 'w-full p-2 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100';
  const labelClass = 'flex flex-row items-center gap-2';

  return (
    <AddModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="Nuovo operatore" subtitle="Aggiungi un nuovo operatore" classes="max-w-2xl">
      <div className="flex flex-col gap-6">
        <div className="flex flex-row items-start gap-6 w-full">
          <div className="flex grow flex-col gap-2">
            <label className={labelClass}><User className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Nome *</span></label>
            <input type="text" className={inputClass} value={op.firstName} onChange={(e) => set('firstName', e.target.value)} />
            {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
          </div>
          <div className="flex grow flex-col gap-2">
            <label className={labelClass}><User className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Cognome *</span></label>
            <input type="text" className={inputClass} value={op.lastName} onChange={(e) => set('lastName', e.target.value)} />
            {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
          </div>
        </div>

        <div className="flex flex-row items-center gap-6 w-full">
          <div className="flex flex-1 flex-col gap-2">
            <label className={labelClass}><AtSign className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Email</span></label>
            <input type="email" className={inputClass} value={op.email} onChange={(e) => set('email', e.target.value)} autoComplete="off" />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <label className={labelClass}><Phone className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Telefono</span></label>
            <PhoneNumber prefixCode={op.phonePrefix} phoneNumber={op.phoneNumber} onPrefixChange={(v) => set('phonePrefix', v)} onPhoneChange={(v) => set('phoneNumber', v)} />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
          </div>
        </div>

        {willCreateAccount && (
          <div className="flex flex-row items-start gap-6 w-full">
            <div className="flex flex-1 flex-col gap-2">
              <label className={labelClass}><Lock className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Password App *</span></label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} className={inputClass} value={op.password} onChange={(e) => set('password', e.target.value)} />
                <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>
          </div>
        )}

        {!willCreateAccount && (
          <div className="flex items-start gap-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-3 py-2.5 text-xs text-zinc-600 dark:text-zinc-400">
            <Info className="size-3.5 shrink-0 mt-0.5" />
            <span>
              L&apos;operatore esisterà per assegnare prestazioni e statistiche, ma non potrà accedere al gestionale. Potrai aggiungere le credenziali in seguito dalla scheda dell&apos;operatore.
            </span>
          </div>
        )}
      </div>
    </AddModal>
  );
}
