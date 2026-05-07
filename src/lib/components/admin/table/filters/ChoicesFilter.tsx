'use client';

import type { FilterChoice } from '@/lib/types/dataColumn';
import { Button } from '@/lib/components/shared/ui/Button';
import { CustomCheckbox } from '@/lib/components/shared/ui/forms/CustomCheckbox';

interface ChoicesFilterProps {
  options?: FilterChoice[];
  value?: Array<string | number>;
  onChange: (v: Array<string | number>) => void;
}

export function ChoicesFilter({ options = [], value = [], onChange }: ChoicesFilterProps) {
  const isChecked = (v: string | number) => value.includes(v);

  const toggle = (v: string | number) => {
    const next = isChecked(v) ? value.filter((x) => x !== v) : [...value, v];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2 min-w-56">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Seleziona opzioni</span>
        <Button variant="ghost" size="sm" onClick={() => onChange([])} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
          Pulisci
        </Button>
      </div>
      <div className="max-h-56 overflow-y-auto pr-1">
        {options.map((opt) => (
          <label
            key={String(opt.value)}
            className="flex items-center gap-2 py-1 cursor-pointer select-none"
            onClick={() => toggle(opt.value)}
          >
            <div className="pointer-events-none">
              <CustomCheckbox
                checked={isChecked(opt.value)}
                onChange={() => toggle(opt.value)}
                className="cursor-pointer bg-blue-600 dark:bg-blue-500"
              />
            </div>
            <span className="text-sm flex-1">{opt.label}</span>
          </label>
        ))}
        {options.length === 0 && (
          <p className="text-xs text-zinc-500">Nessuna opzione</p>
        )}
      </div>
      {value.length > 0 && (
        <p className="text-xs text-zinc-500">{value.length} selezionate</p>
      )}
    </div>
  );
}
