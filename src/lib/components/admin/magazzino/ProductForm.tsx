'use client';

import { Select } from '@/lib/components/shared/ui/forms/Select';
import { NumberInput } from '@/lib/components/shared/ui/forms/NumberInput';
import { Field } from '@/lib/components/shared/ui/forms/Field';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { SwitchRow } from '@/lib/components/shared/ui/forms/SwitchRow';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { useManufacturersStore } from '@/lib/stores/manufacturers';
import { useSuppliersStore } from '@/lib/stores/suppliers';

export interface ProductFormValue {
  name: string;
  manufacturer_id: string;
  product_category_id: string;
  supplier_id: string;
  price: number | null;
  sell_price: number | null;
  is_for_retail: boolean;
  stock_quantity: number;
  min_threshold: number;
  quantity_ml: number | null;
}

export type ProductFormErrors = Partial<Record<'name' | 'price', string>>;

interface ProductFormProps {
  value: ProductFormValue;
  onChange: (value: ProductFormValue) => void;
  errors?: ProductFormErrors;
  trackInventory?: boolean;
}

export const emptyProductForm = (): ProductFormValue => ({
  name: '',
  manufacturer_id: '',
  product_category_id: '',
  supplier_id: '',
  price: null,
  sell_price: null,
  is_for_retail: false,
  stock_quantity: 0,
  min_threshold: 0,
  quantity_ml: null,
});


export function ProductForm({ value, onChange, errors, trackInventory = false }: ProductFormProps) {
  const categories = useProductCategoriesStore((s) => s.product_categories);
  const manufacturers = useManufacturersStore((s) => s.manufacturers);
  const suppliers = useSuppliersStore((s) => s.suppliers);

  const set = <K extends keyof ProductFormValue>(key: K, v: ProductFormValue[K]) => onChange({ ...value, [key]: v });

  return (
    <div className="flex flex-col gap-5" data-tour="product-form">
      <div className="flex gap-4 flex-wrap">
        <FormInput
          fieldClassName="flex-1 min-w-48"
          label="Nome"
          required
          value={value.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Inserisci nome prodotto"
          data-tour="field-product-name"
          error={errors?.name || undefined}
        />
        <Field label="Quantità" className="w-36">
          {({ id, describedBy, invalid }) => (
            <NumberInput id={id} aria-describedby={describedBy} aria-invalid={invalid} value={value.quantity_ml} onChange={(v) => set('quantity_ml', v)} min={0} step={50} suffix="mL" />
          )}
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Marca">
          {({ id }) => (
            <Select
              id={id}
              options={manufacturers}
              labelKey="name"
              valueKey="id"
              value={value.manufacturer_id}
              onChange={(v) => set('manufacturer_id', v ?? '')}
              placeholder="Seleziona marca"
              isNullable
            />
          )}
        </Field>

        <Field label="Categoria">
          {({ id }) => (
            <Select
              id={id}
              options={categories}
              labelKey="name"
              valueKey="id"
              value={value.product_category_id}
              onChange={(v) => set('product_category_id', v ?? '')}
              placeholder="Seleziona categoria"
              isNullable
            />
          )}
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Fornitore">
          {({ id }) => (
            <Select
              id={id}
              options={suppliers}
              labelKey="name"
              valueKey="id"
              value={value.supplier_id}
              onChange={(v) => set('supplier_id', v ?? '')}
              placeholder="Seleziona fornitore"
              isNullable
            />
          )}
        </Field>

        <div data-tour="field-product-price">
          <Field label="Prezzo Acquisto (€)" required error={errors?.price || undefined}>
            {({ id, describedBy, invalid }) => (
              <NumberInput id={id} aria-describedby={describedBy} aria-invalid={invalid} value={value.price} onChange={(v) => set('price', v)} min={0} step={0.5} decimals={2} suffix="€" />
            )}
          </Field>
        </div>
      </div>

      <div data-tour="field-product-retail">
        <SwitchRow
          className="surface-card px-4 py-3"
          label="Destinato alla rivendita"
          description="Abilita un prezzo di vendita al pubblico"
          checked={value.is_for_retail}
          onChange={() => set('is_for_retail', !value.is_for_retail)}
        />
      </div>

      {value.is_for_retail && (
        <Field label="Prezzo Vendita (€)" className="sm:max-w-[calc(50%-8px)]">
          {({ id, describedBy, invalid }) => (
            <NumberInput id={id} aria-describedby={describedBy} aria-invalid={invalid} value={value.sell_price} onChange={(v) => set('sell_price', v)} min={0} step={0.5} decimals={2} suffix="€" />
          )}
        </Field>
      )}

      {trackInventory && (
        <div className="flex flex-col gap-4 pt-2 border-t border-line" data-tour="product-stock-section">
          <p className="text-xs font-medium text-[var(--lume-text-muted)]">Gestione Scorte</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Giacenza Iniziale">
              {({ id, describedBy, invalid }) => (
                <NumberInput id={id} aria-describedby={describedBy} aria-invalid={invalid} value={value.stock_quantity} onChange={(v) => set('stock_quantity', v ?? 0)} min={0} step={1} />
              )}
            </Field>
            <Field label="Soglia Minima" hint="Alert rosso quando la giacenza scende sotto questa soglia.">
              {({ id, describedBy, invalid }) => (
                <NumberInput id={id} aria-describedby={describedBy} aria-invalid={invalid} value={value.min_threshold} onChange={(v) => set('min_threshold', v ?? 0)} min={0} step={1} />
              )}
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}
