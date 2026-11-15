'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, RotateCcw } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { Button } from '@/lib/components/shared/ui/Button';
import { Select } from '@/lib/components/shared/ui/forms/Select';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { Field } from '@/lib/components/shared/ui/forms/Field';
import { PhonePrefixSelect } from '@/lib/components/shared/ui/forms/PhoneNumber';
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
        <Loader2 className="size-5 animate-spin text-[var(--lume-text-muted)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SettingsCard
        title="Servizi"
        description="Valori iniziali quando crei un nuovo servizio."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            id="svc-duration"
            label="Durata predefinita"
            suffix="minuti"
            type="number"
            min={5}
            max={480}
            step={5}
            value={form.service_duration_min}
            onChange={(e) => setField('service_duration_min', Math.max(5, Math.min(480, Number(e.target.value) || 0)))}
          />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Coupon e gift card"
        description="Validità e tipo di sconto preimpostati alla creazione."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            id="gc-validity"
            label="Validità gift card"
            suffix="mesi"
            type="number"
            min={1}
            max={120}
            value={form.gift_card_validity_months}
            onChange={(e) => setField('gift_card_validity_months', Math.max(1, Math.min(120, Number(e.target.value) || 1)))}
          />
          <FormInput
            id="gcoupon-validity"
            label="Validità coupon regalo"
            suffix="mesi"
            type="number"
            min={1}
            max={120}
            value={form.gift_coupon_validity_months}
            onChange={(e) => setField('gift_coupon_validity_months', Math.max(1, Math.min(120, Number(e.target.value) || 1)))}
          />
          <Field className="sm:col-span-2" id="gcoupon-type" label="Tipo di sconto predefinito (coupon regalo)">
            {({ id }) => (
              <Select
                id={id}
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
            )}
          </Field>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Abbonamenti"
        description="Numeri tipici e metodo di pagamento preferito alla creazione."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <FormInput
            id="abb-treatments"
            label="Sedute predefinite"
            type="number"
            min={1}
            max={999}
            value={form.abbonamento_treatments}
            onChange={(e) => setField('abbonamento_treatments', Math.max(1, Math.min(999, Number(e.target.value) || 1)))}
          />
          <FormInput
            id="abb-discount"
            label="Sconto predefinito"
            suffix="%"
            type="number"
            min={0}
            max={100}
            step={1}
            value={form.abbonamento_discount_percent}
            onChange={(e) => setField('abbonamento_discount_percent', Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
          />
          <Field id="abb-payment" label="Metodo di pagamento">
            {({ id }) => (
              <Select
                id={id}
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
            )}
          </Field>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Clienti"
        description="Valori iniziali nella creazione di una scheda cliente."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="cl-prefix" label="Prefisso telefonico">
            {({ id, invalid }) => (
              <PhonePrefixSelect
                id={id}
                invalid={invalid}
                value={form.client_phone_prefix}
                onChange={(code) => setField('client_phone_prefix', code)}
                className="w-full"
              />
            )}
          </Field>
          <Field id="cl-gender" label="Genere predefinito">
            {({ id }) => (
              <Select
                id={id}
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
            )}
          </Field>
        </div>
      </SettingsCard>

      {error && <p className="px-1 text-xs text-danger-strong">{error}</p>}
      <p className="px-1 text-xs text-[var(--lume-text-secondary)]">
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
