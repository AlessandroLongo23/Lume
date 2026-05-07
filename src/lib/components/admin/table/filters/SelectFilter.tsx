'use client';

import { Button } from '@/lib/components/shared/ui/Button';
import { CustomSelect } from '@/lib/components/shared/ui/forms/CustomSelect';
import type { FilterChoice } from '@/lib/types/dataColumn';

interface SelectFilterProps {
  options?: FilterChoice[];
  value?: string | number | null;
  onChange: (v: string | number | null) => void;
}

export function SelectFilter({ options = [], value = null, onChange }: SelectFilterProps) {
  return (
    <div className="flex flex-col gap-2 min-w-56">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Seleziona</span>
        <Button variant="ghost" size="sm" onClick={() => onChange(null)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
          Pulisci
        </Button>
      </div>
      <CustomSelect
        value={value}
        onChange={(v) => onChange((v ?? null) as string | number | null)}
        options={options}
        labelKey="label"
        valueKey="value"
        placeholder="Tutte"
        isNullable
        size="sm"
      />
    </div>
  );
}
