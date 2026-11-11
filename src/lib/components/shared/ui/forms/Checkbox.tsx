'use client';

import { forwardRef, useId, useRef, useState, useEffect } from 'react';
import { Check, Minus } from 'lucide-react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
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
  // md keeps a 36px hit area around an 18px box (same footprint as before);
  // sm is the 16px table checkbox. Touch devices extend the hit area to 44px
  // with a pseudo-element, so row layouts don't move.
  const hitClass = size === 'sm' ? 'size-5' : 'size-9';
  const boxClass = size === 'sm' ? 'size-4' : 'size-4.5';
  const iconClass = size === 'sm' ? 'size-3' : 'size-3.5';
  const markClass = (shown: boolean) => [
    iconClass,
    'absolute text-[var(--lume-bg)] transition-[opacity,scale] duration-[var(--duration-fast)] ease-[var(--ease-out)]',
    shown ? 'opacity-100 scale-100' : 'opacity-0 motion-safe:scale-50',
  ].join(' ');

  return (
    <label
      htmlFor={id}
      className={[
        'relative inline-flex shrink-0 align-middle items-center justify-center',
        "pointer-coarse:before:absolute pointer-coarse:before:left-1/2 pointer-coarse:before:top-1/2 pointer-coarse:before:size-11 pointer-coarse:before:-translate-1/2 pointer-coarse:before:content-['']",
        hitClass,
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        className,
      ].join(' ')}
    >
      <input
        ref={mergedRef}
        id={id}
        type="checkbox"
        className="peer sr-only"
        {...(isControlled ? { checked: !!checked } : { defaultChecked })}
        onChange={handleChange}
        disabled={disabled}
        {...rest}
      />
      {/* On = the text colour with an inverted tick, the same "selected,
          not an action" language as the neutral active fills; indigo stays
          for buttons and focus. Switch uses the same on colour. */}
      <div
        aria-hidden
        className={[
          boxClass,
          'relative inline-flex items-center justify-center rounded-sm',
          'transition-[background-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out)]',
          'peer-focus-visible:shadow-[inset_0_0_0_1px_var(--lume-ring-focus),inset_0_0_0_3px_var(--lume-accent-muted)]',
          isActive
            ? 'bg-[var(--lume-text)]'
            : [
                'bg-[var(--lume-control-bg)] shadow-[inset_0_0_0_1px_var(--lume-edge-hover)]',
                disabled ? '' : 'hover:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--lume-text)_40%,transparent)]',
              ].join(' '),
          disabled ? 'opacity-50' : '',
        ].join(' ')}
      >
        {/* Both marks stay mounted so the tick can scale in and out. */}
        <Check className={markClass(isChecked && !indeterminate)} strokeWidth={3} />
        <Minus className={markClass(!!indeterminate)} strokeWidth={3} />
      </div>
    </label>
  );
});
