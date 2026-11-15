'use client';

import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Checkbox } from './Checkbox';

interface CheckboxRowProps {
  /** The text beside the box. It may hold links (`TextLink`), which open without toggling. */
  label: ReactNode;
  /** A line under the label. With one, the label reads as a title (medium weight). */
  description?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * A checkbox with its text: the box first, then the label (and an optional
 * description), all clickable. Without a description the label is the whole
 * statement ("Ho letto e accetto i Termini…") and may wrap over several lines;
 * with one it is a title, like SwitchRow. No padding of its own: a stack of
 * rows spaces them with `space-y-3`.
 */
export function CheckboxRow({ label, description, checked, onChange, disabled, className }: CheckboxRowProps) {
  const id = useId();
  return (
    <div className={cn('flex items-start', className)}>
      <Checkbox
        id={id}
        size="sm"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        className="mt-0.5"
      />
      {/* pl-3 instead of a flex gap, so the space between box and text toggles too. */}
      <label htmlFor={id} className={cn('min-w-0 flex-1 pl-3', disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer')}>
        <span
          id={`${id}-label`}
          className={cn('block text-sm leading-snug text-[var(--lume-text)]', description && 'font-medium')}
        >
          {label}
        </span>
        {description && (
          <span id={`${id}-desc`} className="block mt-0.5 text-xs text-[var(--lume-text-secondary)] text-pretty">{description}</span>
        )}
      </label>
    </div>
  );
}
