'use client';

import { ALargeSmall, Tag, Clock, Euro, FileText, ShoppingCart } from 'lucide-react';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { Select } from '@/lib/components/shared/ui/forms/Select';
import { NumberInput } from '@/lib/components/shared/ui/forms/NumberInput';
import { Field } from '@/lib/components/shared/ui/forms/Field';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { TextArea } from '@/lib/components/shared/ui/forms/TextArea';
import type { Service } from '@/lib/types/Service';

export type ServiceFormValue = Partial<Service>;

export type ServiceFormErrors = Partial<Record<'name' | 'category_id' | 'price', string>>;

interface ServiceFormProps {
  value: ServiceFormValue;
  onChange: (value: ServiceFormValue) => void;
  errors?: ServiceFormErrors;
}


export function ServiceForm({ value, onChange, errors }: ServiceFormProps) {
  const categories = useServiceCategoriesStore((s) => s.service_categories);
  const set = <K extends keyof ServiceFormValue>(key: K, v: ServiceFormValue[K]) => onChange({ ...value, [key]: v });

  return (
    <div className="flex flex-col gap-4" data-tour="service-form">
      <div className="flex flex-row gap-4 flex-wrap">
        <FormInput
          fieldClassName="flex-1 min-w-48"
          label="Nome"
          labelIcon={ALargeSmall}
          required
          value={value.name ?? ''}
          onChange={(e) => set('name', e.target.value)}
          data-tour="field-service-name"
          error={errors?.name || undefined}
        />
        <Field label="Categoria" labelIcon={Tag} required className="flex-1 min-w-48" error={errors?.category_id || undefined}>
          {({ id }) => (
            <Select
              id={id}
              options={categories}
              labelKey="name"
              valueKey="id"
              value={value.category_id ?? ''}
              onChange={(v) => set('category_id', v ?? '')}
              placeholder="Seleziona categoria"
            />
          )}
        </Field>
      </div>

      <div className="flex flex-row gap-4 flex-wrap">
        <div className="flex-1 min-w-32" data-tour="field-service-duration">
          <Field label="Durata (min)" labelIcon={Clock}>
            {({ id, describedBy, invalid }) => (
              <NumberInput id={id} aria-describedby={describedBy} aria-invalid={invalid} value={value.duration ?? 30} onChange={(v) => set('duration', v ?? 30)} min={1} step={5} />
            )}
          </Field>
        </div>
        <div className="flex-1 min-w-32" data-tour="field-service-price">
          <Field label="Prezzo" labelIcon={Euro} error={errors?.price || undefined}>
            {({ id, describedBy, invalid }) => (
              <NumberInput id={id} aria-describedby={describedBy} aria-invalid={invalid} value={value.price ?? 0} onChange={(v) => set('price', v ?? 0)} min={0} step={0.01} suffix="€" decimals={2} />
            )}
          </Field>
        </div>
        <div className="flex-1 min-w-32" data-tour="field-service-product_cost">
          <Field label="Costo prodotti" labelIcon={ShoppingCart}>
            {({ id, describedBy, invalid }) => (
              <NumberInput id={id} aria-describedby={describedBy} aria-invalid={invalid} value={value.product_cost ?? 0} onChange={(v) => set('product_cost', v ?? 0)} min={0} step={0.01} suffix="€" decimals={2} />
            )}
          </Field>
        </div>
      </div>

      <div data-tour="field-service-description">
        <TextArea label="Descrizione" labelIcon={FileText} rows={3} value={value.description ?? ''} onChange={(e) => set('description', e.target.value)} />
      </div>
    </div>
  );
}
