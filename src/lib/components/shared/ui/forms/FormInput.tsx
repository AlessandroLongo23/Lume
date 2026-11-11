'use client';

import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { SwapIcon } from '@/lib/components/shared/ui/SwapIcon';
import { cn } from '@/lib/utils';
import { Field, type FieldProps } from './Field';

type ControlSize = 'sm' | 'md' | 'lg';

interface FormInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'>,
    Pick<FieldProps, 'labelIcon' | 'hint'> {
  label?: ReactNode;
  error?: string;
  /** Icon inside the box, before the text. */
  icon?: ReactNode;
  /** Fixed text before the value, inside the box ("lume.it/"). */
  prefix?: ReactNode;
  /** Fixed text after the value, inside the box ("minuti", "€"). */
  suffix?: ReactNode;
  size?: ControlSize;
  fieldClassName?: string;
}

const sizeClass: Record<ControlSize, string> = { sm: 'control-sm', md: 'control-md', lg: 'control-lg' };
const iconPad: Record<ControlSize, string> = { sm: 'pl-8', md: 'pl-9', lg: 'pl-11' };
const iconLeft: Record<ControlSize, string> = { sm: 'left-2', md: 'left-3', lg: 'left-3.5' };

/** Single-line text on the shared field surface (`control`), laid out by <Field>. */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(function FormInput(
  { label, labelIcon, hint, error, icon, prefix, suffix, size = 'md', className, fieldClassName, type, id, required, ...props },
  ref,
) {
  const isPassword = type === 'password';
  const [isVisible, setIsVisible] = useState(false);
  const inputType = isPassword ? (isVisible ? 'text' : 'password') : type;

  return (
    <Field label={label} labelIcon={labelIcon} hint={hint} error={error} id={id} required={required} className={fieldClassName}>
      {({ id: fieldId, describedBy, invalid }) => (prefix || suffix) ? (
        // Affixes live inside the box: the wrapper is the field, the input is bare.
        <div className={cn('control flex items-center gap-1.5', sizeClass[size], className)}>
          {prefix && <span className="shrink-0 text-[var(--lume-text-muted)] select-none">{prefix}</span>}
          <input
            ref={ref}
            id={fieldId}
            type={inputType}
            required={required}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className="min-w-0 flex-1 h-full bg-transparent border-0 p-0 text-[length:inherit] text-[var(--lume-text)] placeholder:text-[var(--lume-text-muted)] outline-none focus:ring-0 shadow-none!"
            {...props}
          />
          {suffix && <span className="shrink-0 text-[var(--lume-text-muted)] select-none">{suffix}</span>}
        </div>
      ) : (
        <div className="relative">
          {icon && (
            <div className={cn('absolute top-1/2 -translate-y-1/2 text-[var(--lume-text-muted)] pointer-events-none', iconLeft[size])}>
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={fieldId}
            type={inputType}
            required={required}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cn('control w-full', sizeClass[size], icon && iconPad[size], isPassword && 'pr-10', className)}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setIsVisible((v) => !v)}
              tabIndex={-1}
              aria-label={isVisible ? 'Nascondi password' : 'Mostra password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--lume-text-muted)] hover:text-[var(--lume-text)] transition-colors"
            >
              <SwapIcon icon={isVisible ? Eye : EyeOff} className="size-4" />
            </button>
          )}
        </div>
      )}
    </Field>
  );
});
