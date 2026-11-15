'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Field, type FieldProps } from './Field';

interface TextAreaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'>,
    Pick<FieldProps, 'label' | 'labelIcon' | 'hint' | 'error'> {
  fieldClassName?: string;
}

/** Multi-line text on the shared field surface (`control`). */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, labelIcon, hint, error, id, required, rows = 3, className, fieldClassName, ...rest },
  ref,
) {
  return (
    <Field label={label} labelIcon={labelIcon} hint={hint} error={error} id={id} required={required} className={fieldClassName}>
      {({ id: fieldId, describedBy, invalid }) => (
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn('control w-full px-3 py-2 text-sm leading-relaxed resize-none min-h-20', className)}
          {...rest}
        />
      )}
    </Field>
  );
});
