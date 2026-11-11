'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BusinessType } from '@/lib/types/Salon';
import { Button } from '@/lib/components/shared/ui/Button';
import { Select } from '@/lib/components/shared/ui/forms/Select';
import { Field } from '@/lib/components/shared/ui/forms/Field';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';

const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: 'barber',        label: 'Barbiere' },
  { value: 'hair_salon',    label: 'Parrucchiere' },
  { value: 'beauty_center', label: 'Centro estetico' },
  { value: 'nails',         label: 'Nail bar' },
  { value: 'other',         label: 'Altro' },
];

export function NewSalonForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerFirstName, setOwnerFirstName] = useState('');
  const [ownerLastName, setOwnerLastName] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('hair_salon');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const res = await fetch('/api/platform/salons', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, ownerEmail, ownerFirstName, ownerLastName, businessType }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({ error: 'Errore' }));
        throw new Error(payload.error || 'Errore');
      }
      router.push('/platform/salons');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore');
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card flex flex-col gap-4 p-6">
      <FormInput label="Nome salone" required value={name} onChange={(e) => setName(e.target.value)} />

      <Field label="Tipo">
        {({ id }) => (
          <Select
            id={id}
            value={businessType}
            onChange={(v) => setBusinessType(v as BusinessType)}
            options={BUSINESS_TYPES}
            labelKey="label"
            valueKey="value"
            searchable={false}
          />
        )}
      </Field>

      <div className="pt-4 border-t border-line">
        <h2 className="text-sm font-medium tracking-tight text-[var(--lume-text)] mb-3">Proprietario</h2>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput label="Nome" required value={ownerFirstName} onChange={(e) => setOwnerFirstName(e.target.value)} />
            <FormInput label="Cognome" required value={ownerLastName} onChange={(e) => setOwnerLastName(e.target.value)} />
          </div>
          <FormInput label="Email" required type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-danger-strong">{error}</p>}

      <Button
        type="submit"
        variant="primary"
        loading={isSaving}
        className="mt-2 self-end max-md:self-stretch"
      >
        {isSaving ? 'Creazione…' : 'Crea salone'}
      </Button>
    </form>
  );
}
