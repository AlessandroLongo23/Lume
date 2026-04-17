'use client';

import { ALargeSmall, Tag, Clock, Euro, FileText, ShoppingCart } from 'lucide-react';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { CustomSelect } from '@/lib/components/shared/ui/forms/CustomSelect';
import { CustomNumberInput } from '@/lib/components/shared/ui/forms/CustomNumberInput';
import type { Service } from '@/lib/types/Service';

export type ServiceFormValue = Partial<Service>;

export type ServiceFormErrors = Partial<Record<'name' | 'category_id' | 'price', string>>;

interface ServiceFormProps {
  value: ServiceFormValue;
  onChange: (value: ServiceFormValue) => void;
  errors?: ServiceFormErrors;
}

const inputClass = 'w-full p-2 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100';
const labelClass = 'flex flex-row items-center gap-2';

export function ServiceForm({ value, onChange, errors }: ServiceFormProps) {
  const categories = useServiceCategoriesStore((s) => s.service_categories);
  const set = <K extends keyof ServiceFormValue>(key: K, v: ServiceFormValue[K]) => onChange({ ...value, [key]: v });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row gap-4 flex-wrap">
        <div className="flex flex-1 min-w-48 flex-col gap-2">
          <label className={labelClass}><ALargeSmall className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Nome *</span></label>
          <input type="text" className={inputClass} value={value.name ?? ''} onChange={(e) => set('name', e.target.value)} />
          {errors?.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>
        <div className="flex flex-1 min-w-48 flex-col gap-2">
          <label className={labelClass}><Tag className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Categoria *</span></label>
          <CustomSelect
            options={categories}
            labelKey="name"
            valueKey="id"
            value={value.category_id ?? ''}
            onChange={(v) => set('category_id', v ?? '')}
            placeholder="Seleziona categoria"
          />
          {errors?.category_id && <p className="text-xs text-red-500">{errors.category_id}</p>}
        </div>
      </div>

      <div className="flex flex-row gap-4 flex-wrap">
        <div className="flex flex-1 min-w-32 flex-col gap-2">
          <label className={labelClass}><Clock className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Durata (min)</span></label>
          <CustomNumberInput value={value.duration ?? 30} onChange={(v) => set('duration', v ?? 30)} min={1} step={5} />
        </div>
        <div className="flex flex-1 min-w-32 flex-col gap-2">
          <label className={labelClass}><Euro className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Prezzo</span></label>
          <CustomNumberInput value={value.price ?? 0} onChange={(v) => set('price', v ?? 0)} min={0} step={0.01} suffix="€" decimals={2} />
          {errors?.price && <p className="text-xs text-red-500">{errors.price}</p>}
        </div>
        <div className="flex flex-1 min-w-32 flex-col gap-2">
          <label className={labelClass}><ShoppingCart className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Costo prodotti</span></label>
          <CustomNumberInput value={value.product_cost ?? 0} onChange={(v) => set('product_cost', v ?? 0)} min={0} step={0.01} suffix="€" decimals={2} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClass}><FileText className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Descrizione</span></label>
        <textarea className={inputClass} rows={3} value={value.description ?? ''} onChange={(e) => set('description', e.target.value)} />
      </div>
    </div>
  );
}
