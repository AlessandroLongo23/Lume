'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface CustomNumberInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  step?: number;
  min?: number;
  max?: number;
  arrowPlacement?: 'left' | 'right';
  className?: string;
  width?: string;
}

export function CustomNumberInput({
  value,
  onChange,
  placeholder = '',
  disabled = false,
  step = 1,
  min,
  max,
  arrowPlacement = 'right',
  className = '',
  width = 'w-full',
}: CustomNumberInputProps) {
  const [displayValue, setDisplayValue] = useState(value?.toString() ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayValue(value === null || value === undefined ? '' : value.toString());
  }, [value]);

  const update = (v: number | null) => {
    setDisplayValue(v?.toString() ?? '');
    onChange(v);
  };

  const increment = () => {
    if (disabled) return;
    const current = value ?? (min ?? 0);
    let next = current + step;
    if (max !== undefined) next = Math.min(next, max);
    update(next);
  };

  const decrement = () => {
    if (disabled) return;
    const current = value ?? (max ?? 0);
    let next = current - step;
    if (min !== undefined) next = Math.max(next, min);
    update(next);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim();
    if (raw === '') { setDisplayValue(''); onChange(null); return; }
    const normalised = raw.replace(',', '.');
    const num = Number(normalised);
    if (isNaN(num)) { onChange(null); return; }
    let final = num;
    if (min !== undefined && final < min) final = min;
    if (max !== undefined && final > max) final = max;
    setDisplayValue(final.toString());
    onChange(final);
  };

  const arrows = (
    <div className={`flex flex-col border-zinc-500/25 items-stretch w-8 ${arrowPlacement === 'left' ? 'border-r rounded-l-lg' : 'border-l rounded-r-lg'}`}>
      <button
        type="button"
        onClick={increment}
        disabled={disabled}
        className={`flex-1 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors ${arrowPlacement === 'left' ? 'rounded-tl-lg' : 'rounded-tr-lg'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <ChevronUp className="size-4 text-zinc-500 dark:text-zinc-400" />
      </button>
      <button
        type="button"
        onClick={decrement}
        disabled={disabled}
        className={`flex-1 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors border-t border-zinc-500/25 ${arrowPlacement === 'left' ? 'rounded-bl-lg' : 'rounded-br-lg'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <ChevronDown className="size-4 text-zinc-500 dark:text-zinc-400" />
      </button>
    </div>
  );

  return (
    <div className={`relative ${width} ${className}`}>
      <div className={`w-full bg-white dark:bg-zinc-800 border border-zinc-500/25 rounded-lg shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors flex items-stretch gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {arrowPlacement === 'left' && arrows}
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled}
          onChange={handleInput}
          onBlur={() => setDisplayValue(value === null ? '' : value.toString())}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') { e.preventDefault(); increment(); }
            if (e.key === 'ArrowDown') { e.preventDefault(); decrement(); }
          }}
          className={`flex-1 min-w-0 bg-transparent border-none outline-none text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:ring-0 ${disabled ? 'cursor-not-allowed' : ''}`}
        />
        {arrowPlacement === 'right' && arrows}
      </div>
    </div>
  );
}
