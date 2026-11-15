'use client';

import { DateField } from './DateField';

interface DateTimeFieldProps {
  /** `yyyy-MM-ddTHH:mm`, or '' when empty. */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  'aria-label'?: string;
}

/**
 * A date and a time on the field surface, in Italian format (dd/MM/yyyy and
 * 24h), replacing the browser's `datetime-local`, which follows the browser
 * language and shows mm/dd/yyyy on English systems.
 */
export function DateTimeField({ value, onChange, id, 'aria-label': ariaLabel }: DateTimeFieldProps) {
  const [date = '', time = ''] = value ? value.split('T') : [];
  const set = (d: string, t: string) => onChange(d ? `${d}T${t || '00:00'}` : '');
  return (
    <div className="flex gap-2">
      <DateField
        id={id}
        aria-label={ariaLabel ? `${ariaLabel}, data` : 'Data'}
        value={date}
        onChange={(d) => set(d, time)}
        className="flex-1 min-w-0"
      />
      <input
        type="time"
        step={300}
        aria-label={ariaLabel ? `${ariaLabel}, ora` : 'Ora'}
        value={time}
        onChange={(e) => set(date, e.target.value)}
        className="control control-md w-28 shrink-0 tabular-nums"
      />
    </div>
  );
}
