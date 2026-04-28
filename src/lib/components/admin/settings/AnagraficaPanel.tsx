'use client';

import { useEffect, useState } from 'react';
import { Building2, Save, Loader2 } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { useSalonSettingsStore } from '@/lib/stores/salonSettings';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import type { BusinessType } from '@/lib/types/Salon';

const BUSINESS_OPTIONS: { value: BusinessType; label: string }[] = [
  { value: 'barber', label: 'Barbiere' },
  { value: 'hair_salon', label: 'Parrucchiere' },
  { value: 'beauty_center', label: 'Centro estetico' },
  { value: 'nails', label: 'Nail salon' },
  { value: 'other', label: 'Altro' },
];

interface FormState {
  name: string;
  type: BusinessType | '';
  address: string;
  city: string;
  cap: string;
  province: string;
  phone: string;
  public_email: string;
}

function fromSettings(s: ReturnType<typeof useSalonSettingsStore.getState>['settings']): FormState {
  return {
    name: s?.name ?? '',
    type: (s?.type ?? '') as FormState['type'],
    address: s?.address ?? '',
    city: s?.city ?? '',
    cap: s?.cap ?? '',
    province: s?.province ?? '',
    phone: s?.phone ?? '',
    public_email: s?.public_email ?? '',
  };
}

export function AnagraficaPanel() {
  const isLoading = useSalonSettingsStore((s) => s.isLoading);
  const isLoaded = useSalonSettingsStore((s) => s.isLoaded);
  const settings = useSalonSettingsStore((s) => s.settings);
  const updateSettings = useSalonSettingsStore((s) => s.updateSettings);

  const [form, setForm] = useState<FormState>(() => fromSettings(settings));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded) setForm(fromSettings(settings));
  }, [isLoaded, settings]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setError('Il nome del salone è obbligatorio');
      return;
    }
    if (form.cap && !/^\d{5}$/.test(form.cap)) {
      setError('Il CAP deve essere di 5 cifre');
      return;
    }
    if (!form.type) {
      setError("Seleziona il tipo di attività");
      return;
    }
    setSaving(true);
    try {
      await updateSettings({
        name: trimmedName,
        type: form.type as BusinessType,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        cap: form.cap.trim() || null,
        province: form.province.trim().toUpperCase() || null,
        phone: form.phone.trim() || null,
        public_email: form.public_email.trim() || null,
      });
      // Mirror name into subscription store so the sidebar identity stays in sync.
      useSubscriptionStore.setState({ salonName: trimmedName });
      messagePopup.getState().success('Anagrafica salvata');
    } catch {
      messagePopup.getState().error('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="size-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <SettingsCard
        icon={Building2}
        title="Anagrafica salone"
        description="Le informazioni che identificano il tuo salone."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="salon-name" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Nome del salone <span className="text-red-500">*</span>
            </label>
            <input
              id="salon-name"
              type="text"
              maxLength={80}
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="salon-type" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Tipo di attività <span className="text-red-500">*</span>
            </label>
            <select
              id="salon-type"
              value={form.type}
              onChange={(e) => setField('type', e.target.value as FormState['type'])}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            >
              <option value="">— Seleziona —</option>
              {BUSINESS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="address" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Indirizzo
            </label>
            <input
              id="address"
              type="text"
              maxLength={200}
              value={form.address}
              onChange={(e) => setField('address', e.target.value)}
              placeholder="Via Roma, 12"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          <div>
            <label htmlFor="city" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Città</label>
            <input
              id="city"
              type="text"
              maxLength={100}
              value={form.city}
              onChange={(e) => setField('city', e.target.value)}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cap" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">CAP</label>
              <input
                id="cap"
                type="text"
                inputMode="numeric"
                maxLength={5}
                value={form.cap}
                onChange={(e) => setField('cap', e.target.value.replace(/\D/g, ''))}
                placeholder="00100"
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
              />
            </div>
            <div>
              <label htmlFor="province" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Prov.</label>
              <input
                id="province"
                type="text"
                maxLength={3}
                value={form.province}
                onChange={(e) => setField('province', e.target.value.toUpperCase())}
                placeholder="RM"
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm uppercase text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Telefono</label>
            <input
              id="phone"
              type="tel"
              maxLength={40}
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              placeholder="+39 06 1234567"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>

          <div>
            <label htmlFor="public-email" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Email pubblica</label>
            <input
              id="public-email"
              type="email"
              maxLength={200}
              value={form.public_email}
              onChange={(e) => setField('public_email', e.target.value)}
              placeholder="info@ilmiosalone.it"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
      </SettingsCard>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-hover hover:bg-primary-active text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="size-4" />
          {saving ? 'Salvataggio…' : 'Salva'}
        </button>
      </div>
    </form>
  );
}
