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
  suffix?: string;
  className?: string;
  width?: string;
  /** Number of decimal places allowed. 0 (default) = integers only. */
  decimals?: number;
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
  suffix,
  className = '',
  width = 'w-full',
  decimals = 0,
}: CustomNumberInputProps) {
  const [displayValue, setDisplayValue] = useState(value?.toString() ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  const formatValue = (v: number | null): string => {
    if (v === null || v === undefined) return '';
    if (decimals > 0) return parseFloat(v.toFixed(decimals)).toString();
    return v.toString();
  };

  useEffect(() => {
    setDisplayValue(formatValue(value));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const update = (v: number | null) => {
    setDisplayValue(formatValue(v));
    onChange(v);
  };

  const round = (v: number) =>
    decimals > 0 ? parseFloat(v.toFixed(decimals)) : Math.round(v);

  const increment = () => {
    if (disabled) return;
    const current = value ?? (min ?? 0);
    let next = round(current + step);
    if (max !== undefined) next = Math.min(next, max);
    update(next);
  };

  const decrement = () => {
    if (disabled) return;
    const current = value ?? (max ?? 0);
    let next = round(current - step);
    if (min !== undefined) next = Math.max(next, min);
    update(next);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim();
    if (raw === '') { setDisplayValue(''); onChange(null); return; }
    const normalised = raw.replace(',', '.');

    if (decimals > 0) {
      // Allow partial decimal input (e.g. "1." while still typing)
      const pattern = new RegExp(`^-?\\d*(\\.\\d{0,${decimals}})?$`);
      if (!pattern.test(normalised)) return;
      const num = Number(normalised);
      if (isNaN(num) || normalised === '.') { setDisplayValue(normalised); onChange(null); return; }
      let final = num;
      if (min !== undefined && final < min) final = min;
      if (max !== undefined && final > max) final = max;
      setDisplayValue(normalised); // keep raw so "1." doesn't snap while typing
      onChange(final);
    } else {
      if (!/^-?\d*$/.test(normalised)) return;
      const num = Number(normalised);
      if (isNaN(num)) { onChange(null); return; }
      let final = num;
      if (min !== undefined && final < min) final = min;
      if (max !== undefined && final > max) final = max;
      setDisplayValue(final.toString());
      onChange(final);
    }
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
      <div className={`w-full bg-white dark:bg-zinc-800 border border-zinc-500/25 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors flex items-stretch gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {arrowPlacement === 'left' && arrows}
        <input
          ref={inputRef}
          type="text"
          inputMode={decimals > 0 ? 'decimal' : 'numeric'}
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled}
          onChange={handleInput}
          onBlur={() => setDisplayValue(formatValue(value))}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') { e.preventDefault(); increment(); }
            if (e.key === 'ArrowDown') { e.preventDefault(); decrement(); }
          }}
          className={`text-end flex-1 pr-0 min-w-0 bg-transparent border-none outline-none text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:ring-0 ${disabled ? 'cursor-not-allowed' : ''}`}
        />
        {suffix && (
          <span className="shrink-0 pr-1 text-sm text-zinc-400 dark:text-zinc-500 select-none self-center" aria-hidden="true">
            {suffix}
          </span>
        )}
        {arrowPlacement === 'right' && arrows}
      </div>
    </div>
  );
}
