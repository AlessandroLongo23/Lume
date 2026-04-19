'use client';

import { CustomSelect } from '@/lib/components/shared/ui/forms/CustomSelect';
import { CustomNumberInput } from '@/lib/components/shared/ui/forms/CustomNumberInput';
import { Switch } from '@/lib/components/shared/ui/Switch';
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

const inputClass = 'w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40';
const labelClass = 'text-sm font-medium text-zinc-700 dark:text-zinc-300';
const errorClass = 'text-xs text-red-500 mt-1';

export function ProductForm({ value, onChange, errors, trackInventory = false }: ProductFormProps) {
  const categories = useProductCategoriesStore((s) => s.product_categories);
  const manufacturers = useManufacturersStore((s) => s.manufacturers);
  const suppliers = useSuppliersStore((s) => s.suppliers);

  const set = <K extends keyof ProductFormValue>(key: K, v: ProductFormValue[K]) => onChange({ ...value, [key]: v });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-4 flex-wrap">
        <div className="flex flex-1 min-w-48 flex-col gap-1.5">
          <label className={labelClass}>Nome *</label>
          <input
            type="text"
            value={value.name}
            onChange={(e) => set('name', e.target.value)}
            className={inputClass}
            placeholder="Inserisci nome prodotto"
          />
          {errors?.name && <p className={errorClass}>{errors.name}</p>}
        </div>
        <div className="flex w-36 flex-col gap-1.5">
          <label className={labelClass}>Quantità</label>
          <CustomNumberInput value={value.quantity_ml} onChange={(v) => set('quantity_ml', v)} min={0} step={50} suffix="mL" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Marca</label>
          <CustomSelect
            options={manufacturers}
            labelKey="name"
            valueKey="id"
            value={value.manufacturer_id}
            onChange={(v) => set('manufacturer_id', v ?? '')}
            placeholder="Seleziona marca"
            isNullable
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Categoria</label>
          <CustomSelect
            options={categories}
            labelKey="name"
            valueKey="id"
            value={value.product_category_id}
            onChange={(v) => set('product_category_id', v ?? '')}
            placeholder="Seleziona categoria"
            isNullable
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Fornitore</label>
          <CustomSelect
            options={suppliers}
            labelKey="name"
            valueKey="id"
            value={value.supplier_id}
            onChange={(v) => set('supplier_id', v ?? '')}
            placeholder="Seleziona fornitore"
            isNullable
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Prezzo Acquisto (€) *</label>
          <CustomNumberInput value={value.price} onChange={(v) => set('price', v)} min={0} step={0.5} decimals={2} suffix="€" />
          {errors?.price && <p className={errorClass}>{errors.price}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50">
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Destinato alla rivendita</p>
          <p className="text-xs text-zinc-500 mt-0.5">Abilita un prezzo di vendita al pubblico</p>
        </div>
        <Switch checked={value.is_for_retail} onChange={() => set('is_for_retail', !value.is_for_retail)} />
      </div>

      {value.is_for_retail && (
        <div className="flex flex-col gap-1.5 sm:max-w-[calc(50%-8px)]">
          <label className={labelClass}>Prezzo Vendita (€)</label>
          <CustomNumberInput value={value.sell_price} onChange={(v) => set('sell_price', v)} min={0} step={0.5} decimals={2} suffix="€" />
        </div>
      )}

      {trackInventory && (
        <div className="flex flex-col gap-4 pt-2 border-t border-zinc-200 dark:border-zinc-700">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Gestione Scorte</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Giacenza Iniziale</label>
              <CustomNumberInput value={value.stock_quantity} onChange={(v) => set('stock_quantity', v ?? 0)} min={0} step={1} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Soglia Minima</label>
              <CustomNumberInput value={value.min_threshold} onChange={(v) => set('min_threshold', v ?? 0)} min={0} step={1} />
              <p className="text-xs text-zinc-500">Alert rosso quando la giacenza scende sotto questa soglia.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
