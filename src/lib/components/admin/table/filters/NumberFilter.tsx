'use client';

import { useState, useEffect } from 'react';
import { NumberMode, type NumberFilterValue } from '@/lib/types/filters/NumberMode';
import { Button } from '@/lib/components/shared/ui/Button';
import { CustomSelect } from '@/lib/components/shared/ui/forms/CustomSelect';
import { CustomNumberInput } from '@/lib/components/shared/ui/forms/CustomNumberInput';

const modeOptions = [
  { value: NumberMode.EXACT, label: 'Uguale a' },
  { value: NumberMode.LESS_THAN, label: 'Minore di' },
  { value: NumberMode.LESS_THAN_OR_EQUAL, label: 'Minore o uguale a' },
  { value: NumberMode.GREATER_THAN, label: 'Maggiore di' },
  { value: NumberMode.GREATER_THAN_OR_EQUAL, label: 'Maggiore o uguale a' },
  { value: NumberMode.BETWEEN, label: 'Intervallo' },
];

interface NumberFilterProps {
  value?: NumberFilterValue;
  onChange: (v: NumberFilterValue) => void;
  step?: number;
  min?: number;
  max?: number;
}

export function NumberFilter({
  value = { mode: NumberMode.EXACT, value: null },
  onChange,
  step = 1,
  min,
  max,
}: NumberFilterProps) {
  const [currentMode, setCurrentMode] = useState<NumberMode>(value.mode);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentMode(value.mode);
  }, [value.mode]);

  const handleModeChange = (mode: NumberMode) => {
    setCurrentMode(mode);
    if (mode === NumberMode.BETWEEN) {
      onChange({ mode, min: null, max: null });
    } else {
      onChange({ mode, value: null } as NumberFilterValue);
    }
  };

  const clear = () => {
    setCurrentMode(NumberMode.EXACT);
    onChange({ mode: NumberMode.EXACT, value: null });
  };

  const isBetween = value.mode === NumberMode.BETWEEN;
  const betweenValue = value as { mode: NumberMode.BETWEEN; min: number | null; max: number | null };
  const singleValue = value as { mode: NumberMode; value: number | null };

  return (
    <div className="flex flex-col gap-2 min-w-56">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Numero</span>
        <Button variant="ghost" size="sm" onClick={clear} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
          Pulisci
        </Button>
      </div>
      <CustomSelect
        value={currentMode}
        options={modeOptions}
        labelKey="label"
        valueKey="value"
        placeholder="Seleziona modalità"
        searchable={false}
        onChange={(mode: NumberMode) => handleModeChange(mode)}
      />

      {isBetween ? (
        <div className="flex gap-2 items-center w-full">
          <CustomNumberInput
            value={betweenValue.min}
            placeholder="Min"
            step={step}
            min={min}
            max={betweenValue.max ?? max}
            onChange={(v) => onChange({ ...betweenValue, min: v })}
          />
          <span className="text-xs text-zinc-500">-</span>
          <CustomNumberInput
            value={betweenValue.max}
            placeholder="Max"
            step={step}
            min={betweenValue.min ?? min}
            max={max}
            onChange={(v) => onChange({ ...betweenValue, max: v })}
          />
        </div>
      ) : (
        <CustomNumberInput
          value={singleValue.value}
          placeholder="Valore"
          step={step}
          min={min}
          max={max}
          onChange={(v) => onChange({ mode: value.mode, value: v } as NumberFilterValue)}
        />
      )}
    </div>
  );
}
