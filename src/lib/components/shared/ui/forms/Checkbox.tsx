'use client';

import { forwardRef, useId, useRef, useState, useEffect } from 'react';
import { Check, Minus } from 'lucide-react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  size?: 'sm' | 'md';
  indeterminate?: boolean;
  className?: string;
}

function mergeRefs<T>(...refs: React.Ref<T>[]): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') ref(value);
      else if (ref) (ref as React.MutableRefObject<T | null>).current = value;
    });
  };
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    label,
    size = 'md',
    indeterminate,
    className = '',
    checked,
    defaultChecked,
    onChange,
    disabled,
    id: providedId,
    ...rest
  },
  forwardedRef,
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const internalRef = useRef<HTMLInputElement>(null);
  const mergedRef = mergeRefs(internalRef, forwardedRef);

  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked ?? false);
  const isChecked = isControlled ? !!checked : internalChecked;

  useEffect(() => {
    if (internalRef.current) {
      internalRef.current.indeterminate = !!indeterminate;
    }
  }, [indeterminate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternalChecked(e.target.checked);
    onChange?.(e);
  };

  const isActive = isChecked || !!indeterminate;
  const boxClass = size === 'sm' ? 'h-5 w-5 rounded' : 'h-10 w-10 rounded-md';
  const iconClass = size === 'sm' ? 'size-2.5' : 'size-4';
  const markClass = (shown: boolean) => [
    iconClass,
    'absolute text-primary transition-[opacity,scale] duration-[var(--duration-fast)] ease-[var(--ease-out)]',
    shown ? 'opacity-100 scale-100' : 'opacity-0 motion-safe:scale-50',
  ].join(' ');

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className={`select-none text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {label}
        </label>
      )}
      <label htmlFor={id} className={disabled ? 'cursor-not-allowed' : 'cursor-pointer'}>
        <input
          ref={mergedRef}
          id={id}
          type="checkbox"
          className="sr-only"
          {...(isControlled ? { checked: !!checked } : { defaultChecked })}
          onChange={handleChange}
          disabled={disabled}
          {...rest}
        />
        <div
          aria-hidden
          className={[
            boxClass,
            'relative inline-flex align-middle items-center justify-center border',
            'transition-[background-color,border-color] duration-[var(--duration-fast)] ease-[var(--ease-out)]',
            isActive
              ? 'border-primary/50 bg-primary/10'
              : 'border-zinc-500/25 bg-white dark:bg-zinc-800',
            disabled ? 'opacity-50' : 'hover:border-primary/30',
          ].join(' ')}
        >
          {/* Both marks stay mounted so the tick can scale in and out. */}
          <Check className={markClass(isChecked && !indeterminate)} strokeWidth={2} />
          <Minus className={markClass(!!indeterminate)} strokeWidth={2} />
        </div>
      </label>
    </div>
  );
});
