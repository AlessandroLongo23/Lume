'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type ControlSize = 'sm' | 'md';

const sizeConfig: Record<ControlSize, { control: string; arrowWidth: string; iconClass: string }> = {
  sm: { control: 'control-sm', arrowWidth: 'w-5', iconClass: 'size-3' },
  md: { control: 'control-md', arrowWidth: 'w-6', iconClass: 'size-3.5' },
};

interface NumberInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  /** Wrapper classes (width); full width by default. */
  className?: string;
  /** Fixed decimal places, shown Italian style ("35,00"). 0 (default) = integers only. */
  decimals?: number;
  size?: ControlSize;
  /** Wired by <Field>: the label's target and its hint/error. */
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-label'?: string;
  /** Hide the up/down stepper arrows. Useful for money fields where stepping
   *  isn't a natural interaction (the user types the value). */
  hideSteppers?: boolean;
}

export function NumberInput({
  id,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-label': ariaLabel,
  value,
  onChange,
  placeholder = '',
  disabled = false,
  step = 1,
  min,
  max,
  suffix,
  className,
  decimals = 0,
  size = 'md',
  hideSteppers = false,
}: NumberInputProps) {
  const sc = sizeConfig[size];
  // Italian display: comma separator, and always `decimals` places ("35,00").
  const formatValue = (v: number | null): string => {
    if (v === null || v === undefined) return '';
    if (decimals > 0) return v.toFixed(decimals).replace('.', ',');
    return v.toString();
  };
  const [displayValue, setDisplayValue] = useState(() => formatValue(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const isFocusedRef = useRef(false);

  useEffect(() => {
    // Don't fight the user mid-typing: a partial entry (e.g. "4" toward "45")
    // is legitimately below `min`, and the parent often clamps `value` on every
    // keystroke. Syncing here would snap the field back to the clamped value.
    if (isFocusedRef.current) return;
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
      // Allow partial decimal input ("1," or "1." while still typing)
      const pattern = new RegExp(`^-?\\d*(\\.\\d{0,${decimals}})?$`);
      if (!pattern.test(normalised)) return;
      const num = Number(normalised);
      if (isNaN(num) || normalised === '.') { setDisplayValue(raw); onChange(null); return; }
      let final = num;
      if (min !== undefined && final < min) final = min;
      if (max !== undefined && final > max) final = max;
      setDisplayValue(raw); // keep what was typed so "1," doesn't snap while typing
      onChange(final);
    } else {
      if (!/^-?\d*$/.test(normalised)) return;
      const num = Number(normalised);
      if (isNaN(num)) { onChange(null); return; }
      let final = num;
      if (min !== undefined && final < min) final = min;
      if (max !== undefined && final > max) final = max;
      setDisplayValue(normalised); // keep raw so a partial value below min isn't snapped while typing
      onChange(final);
    }
  };

  const stepButton = 'flex-1 flex items-center justify-center hover:bg-hover active:bg-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    // The shared field surface: edge, hover, focus, invalid and the touch
    // height come from `control`. The steppers sit flush in the right edge,
    // 1px in so the edge stays visible on hover.
    <div
      aria-disabled={disabled || undefined}
      className={cn('control flex w-full items-stretch gap-1.5', sc.control, !hideSteppers && 'pr-0!', className)}
    >
      <input
        id={id}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid || undefined}
        aria-label={ariaLabel}
        ref={inputRef}
        type="text"
        inputMode={decimals > 0 ? 'decimal' : 'numeric'}
        value={displayValue}
        placeholder={placeholder}
        disabled={disabled}
        onChange={handleInput}
        onFocus={() => { isFocusedRef.current = true; }}
        onBlur={() => { isFocusedRef.current = false; setDisplayValue(formatValue(value)); }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') { e.preventDefault(); increment(); }
          if (e.key === 'ArrowDown') { e.preventDefault(); decrement(); }
        }}
        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-end tabular-nums text-[length:inherit] text-[var(--lume-text)] outline-none placeholder:text-[var(--lume-text-muted)] focus:ring-0 shadow-none! disabled:cursor-not-allowed"
      />
      {suffix && (
        <span className="shrink-0 self-center text-[var(--lume-text-muted)] select-none" aria-hidden="true">
          {suffix}
        </span>
      )}
      {!hideSteppers && (
        <div className={cn('my-px mr-px ml-1.5 flex flex-col overflow-hidden rounded-r-[inherit] border-l border-line', sc.arrowWidth)}>
          <button type="button" tabIndex={-1} aria-label="Aumenta" onClick={increment} disabled={disabled} className={stepButton}>
            <ChevronUp className={cn(sc.iconClass, 'text-[var(--lume-text-muted)]')} />
          </button>
          <button type="button" tabIndex={-1} aria-label="Diminuisci" onClick={decrement} disabled={disabled} className={cn(stepButton, 'border-t border-line')}>
            <ChevronDown className={cn(sc.iconClass, 'text-[var(--lume-text-muted)]')} />
          </button>
        </div>
      )}
    </div>
  );
}
