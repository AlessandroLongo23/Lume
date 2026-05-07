'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, RotateCcw, Scissors, Gift, BadgePercent, User } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { Button } from '@/lib/components/shared/ui/Button';
import { CustomSelect } from '@/lib/components/shared/ui/forms/CustomSelect';
import { useSalonSettingsStore } from '@/lib/stores/salonSettings';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { FACTORY_FORM_DEFAULTS } from '@/lib/const/factory-defaults';
import type { SalonFormDefaults } from '@/lib/types/Salon';

type FormState = Required<SalonFormDefaults>;

function fromSettings(overrides: SalonFormDefaults | undefined): FormState {
  return { ...FACTORY_FORM_DEFAULTS, ...(overrides ?? {}) };
}

export function DefaultFormPanel() {
  const isLoading = useSalonSettingsStore((s) => s.isLoading);
  const isLoaded = useSalonSettingsStore((s) => s.isLoaded);
  const overrides = useSalonSettingsStore((s) => s.settings?.form_defaults);
  const updateSettings = useSalonSettingsStore((s) => s.updateSettings);

  const [form, setForm] = useState<FormState>(() => fromSettings(overrides));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded) setForm(fromSettings(overrides));
  }, [isLoaded, overrides]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const onSave = async () => {
    if (form.client_phone_prefix && !/^\+\d{1,4}$/.test(form.client_phone_prefix)) {
      setError('Prefisso telefonico non valido (es. +39)');
      return;
    }
    setSaving(true);
    try {
      await updateSettings({ form_defaults: form });
      messagePopup.getState().success('Default salvati');
    } catch {
      messagePopup.getState().error('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const onReset = () => {
    setForm({ ...FACTORY_FORM_DEFAULTS });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="size-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SettingsCard
        icon={Scissors}
        title="Servizi"
        description="Valori iniziali quando crei un nuovo servizio."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="svc-duration" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Durata predefinita (minuti)
            </label>
            <input
              id="svc-duration"
              type="number"
              min={5}
              max={480}
              step={5}
              value={form.service_duration_min}
              onChange={(e) => setField('service_duration_min', Math.max(5, Math.min(480, Number(e.target.value) || 0)))}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Gift}
        title="Coupon e gift card"
        description="Validità e tipo di sconto preimpostati alla creazione."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="gc-validity" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Validità gift card (mesi)
            </label>
            <input
              id="gc-validity"
              type="number"
              min={1}
              max={120}
              value={form.gift_card_validity_months}
              onChange={(e) => setField('gift_card_validity_months', Math.max(1, Math.min(120, Number(e.target.value) || 1)))}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>
          <div>
            <label htmlFor="gcoupon-validity" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Validità coupon regalo (mesi)
            </label>
            <input
              id="gcoupon-validity"
              type="number"
              min={1}
              max={120}
              value={form.gift_coupon_validity_months}
              onChange={(e) => setField('gift_coupon_validity_months', Math.max(1, Math.min(120, Number(e.target.value) || 1)))}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="gcoupon-type" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Tipo di sconto predefinito (coupon regalo)
            </label>
            <CustomSelect
              value={form.gift_coupon_discount_type}
              onChange={(v) => setField('gift_coupon_discount_type', v as FormState['gift_coupon_discount_type'])}
              options={[
                { value: 'fixed', label: 'Importo fisso (€)' },
                { value: 'percent', label: 'Percentuale (%)' },
                { value: 'free_item', label: 'Servizio o prodotto omaggio' },
              ]}
              labelKey="label"
              valueKey="value"
              searchable={false}
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={BadgePercent}
        title="Abbonamenti"
        description="Numeri tipici e metodo di pagamento preferito alla creazione."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="abb-treatments" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Sedute predefinite
            </label>
            <input
              id="abb-treatments"
              type="number"
              min={1}
              max={999}
              value={form.abbonamento_treatments}
              onChange={(e) => setField('abbonamento_treatments', Math.max(1, Math.min(999, Number(e.target.value) || 1)))}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>
          <div>
            <label htmlFor="abb-discount" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Sconto predefinito (%)
            </label>
            <input
              id="abb-discount"
              type="number"
              min={0}
              max={100}
              step={1}
              value={form.abbonamento_discount_percent}
              onChange={(e) => setField('abbonamento_discount_percent', Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>
          <div>
            <label htmlFor="abb-payment" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Metodo di pagamento
            </label>
            <CustomSelect
              value={form.abbonamento_payment_method}
              onChange={(v) => setField('abbonamento_payment_method', v as FormState['abbonamento_payment_method'])}
              options={[
                { value: 'cash', label: 'Contanti' },
                { value: 'card', label: 'Carta' },
                { value: 'transfer', label: 'Bonifico' },
              ]}
              labelKey="label"
              valueKey="value"
              searchable={false}
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={User}
        title="Clienti"
        description="Valori iniziali nella creazione di una scheda cliente."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cl-prefix" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Prefisso telefonico
            </label>
            <input
              id="cl-prefix"
              type="text"
              maxLength={5}
              value={form.client_phone_prefix}
              onChange={(e) => setField('client_phone_prefix', e.target.value)}
              placeholder="+39"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>
          <div>
            <label htmlFor="cl-gender" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Genere predefinito
            </label>
            <CustomSelect
              value={form.client_default_gender}
              onChange={(v) => setField('client_default_gender', v as FormState['client_default_gender'])}
              options={[
                { value: 'M', label: 'Uomo' },
                { value: 'F', label: 'Donna' },
              ]}
              labelKey="label"
              valueKey="value"
              searchable={false}
            />
          </div>
        </div>
      </SettingsCard>

      {error && <p className="px-1 text-xs text-red-500">{error}</p>}
      <p className="px-1 text-xs text-zinc-500">
        Questi valori riempiono i form alla creazione, ma restano modificabili per ogni singola operazione.
      </p>

      <div className="flex justify-between items-center">
        <Button variant="ghost" size="sm" leadingIcon={RotateCcw} onClick={onReset}>
          Ripristina default
        </Button>
        <Button variant="primary" leadingIcon={Save} loading={saving} onClick={onSave}>
          {saving ? 'Salvataggio…' : 'Salva'}
        </Button>
      </div>
    </div>
  );
}
