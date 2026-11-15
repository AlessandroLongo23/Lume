'use client';

import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Switch } from '../Switch';

interface SwitchRowProps {
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  /** Before the label: a colour dot, an expand chevron. */
  leading?: ReactNode;
  /** Between the label and the switch: a count, a status. */
  trailing?: ReactNode;
  className?: string;
}

/**
 * A setting that is on or off: title and one line of explanation on the left,
 * the switch on the right, the whole label clickable. No vertical padding of
 * its own: inside a `divide-y divide-line` list give each row
 * `py-3`; in a grid or a card the container spaces it.
 */
export function SwitchRow({ label, description, checked, onChange, disabled, leading, trailing, className }: SwitchRowProps) {
  const id = useId();
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      {leading && <div className="shrink-0 -mr-1.5">{leading}</div>}
      <label htmlFor={id} className={cn('min-w-0 flex-1', disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer')}>
        <span id={`${id}-label`} className="block text-sm font-medium text-[var(--lume-text)]">{label}</span>
        {description && (
          <span id={`${id}-desc`} className="block mt-0.5 text-xs text-[var(--lume-text-secondary)] text-pretty">{description}</span>
        )}
      </label>
      {trailing && <div className="shrink-0">{trailing}</div>}
      <Switch
        id={id}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
      />
    </div>
  );
}
