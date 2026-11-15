'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { Button } from '@/lib/components/shared/ui/Button';
import { Select } from '@/lib/components/shared/ui/forms/Select';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { Field } from '@/lib/components/shared/ui/forms/Field';
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
        <Loader2 className="size-5 animate-spin text-[var(--lume-text-muted)]" />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <SettingsCard
        title="Anagrafica salone"
        description="Le informazioni che identificano il tuo salone."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            fieldClassName="sm:col-span-2"
            id="salon-name"
            label="Nome del salone"
            required
            maxLength={80}
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
          />

          <Field className="sm:col-span-2" id="salon-type" label="Tipo di attività" required>
            {({ id }) => (
              <Select
                id={id}
                value={form.type || null}
                onChange={(v) => setField('type', (v ?? '') as FormState['type'])}
                options={BUSINESS_OPTIONS}
                labelKey="label"
                valueKey="value"
                placeholder="— Seleziona —"
                isNullable
                searchable={false}
              />
            )}
          </Field>

          <FormInput
            fieldClassName="sm:col-span-2"
            id="address"
            label="Indirizzo"
            maxLength={200}
            value={form.address}
            onChange={(e) => setField('address', e.target.value)}
            placeholder="Via Roma, 12"
          />

          <FormInput
            id="city"
            label="Città"
            maxLength={100}
            value={form.city}
            onChange={(e) => setField('city', e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              id="cap"
              label="CAP"
              inputMode="numeric"
              maxLength={5}
              value={form.cap}
              onChange={(e) => setField('cap', e.target.value.replace(/\D/g, ''))}
              placeholder="00100"
            />
            <FormInput
              id="province"
              label="Prov."
              maxLength={3}
              value={form.province}
              onChange={(e) => setField('province', e.target.value.toUpperCase())}
              placeholder="RM"
              className="uppercase"
            />
          </div>

          <FormInput
            id="phone"
            label="Telefono"
            type="tel"
            maxLength={40}
            value={form.phone}
            onChange={(e) => setField('phone', e.target.value)}
            placeholder="+39 06 1234567"
          />

          <FormInput
            id="public-email"
            label="Email pubblica"
            type="email"
            maxLength={200}
            value={form.public_email}
            onChange={(e) => setField('public_email', e.target.value)}
            placeholder="info@ilmiosalone.it"
          />
        </div>

        {error && <p className="mt-3 text-xs text-danger-strong">{error}</p>}
      </SettingsCard>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" leadingIcon={Save} loading={saving}>
          {saving ? 'Salvataggio…' : 'Salva'}
        </Button>
      </div>
    </form>
  );
}
