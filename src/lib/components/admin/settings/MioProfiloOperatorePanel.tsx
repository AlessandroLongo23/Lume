'use client';

import { useEffect, useMemo, useState } from 'react';
import { User, AtSign, Phone, Save, Loader2, Info } from 'lucide-react';
import { useOperatorsStore } from '@/lib/stores/operators';
import { usePreferencesStore } from '@/lib/stores/preferences';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { SettingsCard } from './SettingsCard';
import { PhoneNumber } from '@/lib/components/shared/ui/forms/PhoneNumber';
import { supabase } from '@/lib/supabase/client';

export function MioProfiloOperatorePanel() {
  const operators = useOperatorsStore((s) => s.operators);
  const updateOperator = useOperatorsStore((s) => s.updateOperator);
  const isLoadingOperators = useOperatorsStore((s) => s.isLoading);
  const profileEmail = usePreferencesStore((s) => s.email);
  const role = useSubscriptionStore((s) => s.role);

  const [authUserId, setAuthUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setAuthUserId(data.user?.id ?? null);
    });
    return () => { cancelled = true; };
  }, []);

  const myOperator = useMemo(() => {
    if (!authUserId) return null;
    return operators.find((o) => o.user_id === authUserId) ?? null;
  }, [operators, authUserId]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+39');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!myOperator) return;
    setFirstName(myOperator.firstName);
    setLastName(myOperator.lastName);
    setEmail(myOperator.email);
    setPhonePrefix(myOperator.phonePrefix);
    setPhoneNumber(myOperator.phoneNumber);
  }, [myOperator]);

  const isDirty = !!myOperator && (
    firstName !== myOperator.firstName ||
    lastName !== myOperator.lastName ||
    email !== myOperator.email ||
    phonePrefix !== myOperator.phonePrefix ||
    phoneNumber !== myOperator.phoneNumber
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myOperator) return;
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      messagePopup.getState().error('Compila tutti i campi obbligatori');
      return;
    }
    setSaving(true);
    try {
      await updateOperator(myOperator.id, {
        ...myOperator,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phonePrefix,
        phoneNumber,
      });
      messagePopup.getState().success('Profilo operatore aggiornato');
    } catch {
      messagePopup.getState().error('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  if (isLoadingOperators || authUserId === null) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="size-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!myOperator) {
    const emptyState = role === 'admin'
      ? 'Gli amministratori della piattaforma non hanno una scheda operatore in questo salone.'
      : 'Nessuna scheda operatore associata al tuo account. Chiedi al titolare di crearla in /admin/operatori.';
    return (
      <SettingsCard icon={Info} title="Scheda operatore non disponibile">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{emptyState}</p>
      </SettingsCard>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <SettingsCard
        icon={User}
        title="Mio profilo operatore"
        description="I dati che il salone vede di te. Sono diversi dalle informazioni di account."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="flex items-center gap-2 mb-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <User className="size-3.5" /> Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 mb-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <User className="size-3.5" /> Cognome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 mb-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <AtSign className="size-3.5" /> Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
            {profileEmail && profileEmail.toLowerCase() !== email.trim().toLowerCase() && (
              <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                {`Diversa dall'email di accesso (${profileEmail}). Per cambiarla vai in Account → Sicurezza.`}
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 mb-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <Phone className="size-3.5" /> Telefono
            </label>
            <PhoneNumber
              prefixCode={phonePrefix}
              phoneNumber={phoneNumber}
              onPrefixChange={setPhonePrefix}
              onPhoneChange={setPhoneNumber}
            />
          </div>
        </div>
      </SettingsCard>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || !isDirty}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-hover hover:bg-primary-active text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="size-4" />
          {saving ? 'Salvataggio…' : 'Salva'}
        </button>
      </div>
    </form>
  );
}
