'use client';

import { useId, type ComponentType, type ReactNode, type SVGProps } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

export interface FieldProps {
  label?: ReactNode;
  /** Small icon before the label ("Cliente", "Miscela", "Telefono"). */
  labelIcon?: IconComponent;
  required?: boolean;
  /** A control on the label line, right-aligned (e.g. a Switch that enables the field). */
  labelAction?: ReactNode;
  /** Muted helper line under the control. */
  hint?: ReactNode;
  error?: string;
  /** Forwarded to the control; generated when omitted. */
  id?: string;
  className?: string;
  /** The control. Receives the ids it must wire (id, aria-describedby, aria-invalid). */
  children: (control: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}

/**
 * Label, control, hint and error in one stack: the only way a form field is
 * laid out in Lume. Every input-like component (FormInput, TextArea, Select,
 * PhoneNumber, DateField, NumberInput, ComuneAutocomplete) renders through it,
 * so labels, spacing and error messages are identical everywhere.
 */
export function Field({ label, labelIcon: LabelIcon, required, labelAction, hint, error, id: idProp, className, children }: FieldProps) {
  const generated = useId();
  const id = idProp ?? generated;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5 min-w-0', className)}>
      {label && (
        <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="inline-flex items-center gap-2 text-sm text-[var(--lume-text-secondary)]">
          {LabelIcon && <LabelIcon aria-hidden className="size-4 shrink-0 text-[var(--lume-text-muted)]" strokeWidth={1.5} />}
          <span>
            {label}
            {required && <span aria-hidden className="ml-0.5 text-danger-strong">*</span>}
          </span>
        </label>
        {labelAction}
        </div>
      )}
      {children({ id, describedBy, invalid: !!error })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-[var(--lume-text-muted)]">{hint}</p>
      )}
      {error && (
        <p id={errorId} role="alert" className="flex items-center gap-1.5 text-sm text-danger-strong">
          <AlertCircle aria-hidden className="size-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
