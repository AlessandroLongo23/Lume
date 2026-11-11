'use client';

import { useRef, useState } from 'react';
import { Popover } from '@base-ui/react/popover';
import { Calendar } from 'lucide-react';
import { format, isValid, parse, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/lib/components/shared/ui/Button';
import { CalendarPanel } from './CalendarPanel';

const ISO = 'yyyy-MM-dd';
const DISPLAY = 'dd/MM/yyyy';

const toDisplay = (iso: string) => (iso ? format(parseISO(iso), DISPLAY) : '');

/**
 * Reads a date the way people type it in Italy: day first, then month, then year,
 * with `/`, `.`, `-` or a space in between, or no separator at all (`01062021`).
 * A two-digit year means 20xx. Returns `yyyy-MM-dd`, or null while the text is
 * incomplete or not a real date.
 */
export function parseItalianDate(text: string): string | null {
  const t = text.trim();
  let parts = t.split(/[\/.\-\s]+/).filter(Boolean);
  if (parts.length === 1 && /^\d{6}$|^\d{8}$/.test(t)) parts = [t.slice(0, 2), t.slice(2, 4), t.slice(4)];
  if (parts.length !== 3 || !parts.every((p) => /^\d+$/.test(p))) return null;
  const [d, m, y] = parts;
  if (d.length > 2 || m.length > 2 || (y.length !== 2 && y.length !== 4)) return null;
  const year = y.length === 2 ? `20${y}` : y;
  const date = parse(`${d.padStart(2, '0')}/${m.padStart(2, '0')}/${year}`, DISPLAY, new Date());
  if (!isValid(date) || date.getFullYear() < 1900) return null;
  return format(date, ISO);
}

interface DateFieldProps {
  /** `yyyy-MM-dd`, or '' when empty or not a valid date yet. */
  value: string;
  /** Called on every edit with the parsed date, or '' while the text is not one. */
  onChange: (value: string) => void;
  /** Enter pressed in the text box, with a valid date in it. */
  onEnter?: () => void;
  /** Days outside `min`..`max` (`yyyy-MM-dd`) cannot be picked from the calendar. */
  min?: string;
  max?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
  className?: string;
}

// The calendar button sits flush in the right edge, so no right padding.
const sizeClasses = { sm: 'control-sm pr-0!', md: 'control-md pr-0!' };

/**
 * Date input in the Italian order (gg/mm/aaaa) on every browser and OS, with a
 * calendar to pick from. The native `<input type="date">` follows the browser's
 * language, so the same salon saw mm/dd/yyyy on an English-language machine.
 */
export function DateField({
  value, onChange, onEnter, min, max, size = 'md', disabled, id, className, 'aria-label': ariaLabel,
}: DateFieldProps) {
  const [text, setText] = useState(() => toDisplay(value));
  const [open, setOpen] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);
  const outOfRange = (iso: string) => (!!min && iso < min) || (!!max && iso > max);

  // The parent changed the date (a quick period, a calendar pick): show it.
  // Skipped while the text already means that value, so typing is never rewritten.
  if ((parseItalianDate(text) ?? '') !== value) setText(toDisplay(value));

  const invalid = text.trim() !== '' && parseItalianDate(text) === null;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div
        ref={fieldRef}
        aria-disabled={disabled || undefined}
        // The shared field surface: edge, hover, focus and invalid come from `control`.
        className={cn('control flex items-center', sizeClasses[size], className)}
      >
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="gg/mm/aaaa"
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onChange(parseItalianDate(e.target.value) ?? '');
          }}
          onBlur={() => {
            const parsed = parseItalianDate(text);
            if (parsed) setText(toDisplay(parsed)); // "1.6.21" settles as "01/06/2021"
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && parseItalianDate(text)) onEnter?.();
          }}
          className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-[length:inherit] tabular-nums outline-none focus:ring-0 shadow-none! placeholder:text-[var(--lume-text-muted)]"
        />
        <Popover.Trigger
          disabled={disabled}
          aria-label="Apri il calendario"
          className={cn(
            'flex h-full shrink-0 items-center justify-center rounded-r-[inherit] text-[var(--lume-text-muted)]',
            'hover:text-[var(--lume-text)] transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--lume-ring-focus)]',
            size === 'sm' ? 'w-[var(--lume-control-h-sm)]' : 'w-[var(--lume-control-h-md)]', // square
          )}
        >
          <Calendar className="size-4" aria-hidden />
        </Popover.Trigger>
      </div>

      <Popover.Portal>
        {/* Anchored to the whole field, so the calendar lines up with its left edge. */}
        <Popover.Positioner anchor={fieldRef} side="bottom" align="start" sideOffset={6} className="z-popover">
          <Popover.Popup
            aria-label="Scegli una data"
            className={cn(
              'w-72 rounded-lg bg-[var(--lume-surface-raised)] p-3 text-[var(--lume-text)] shadow-float outline-none',
              'origin-[var(--transform-origin)] transition-[opacity,translate] duration-[var(--duration-fast)] ease-[var(--ease-out)]',
              'data-[starting-style]:opacity-0 data-[starting-style]:-translate-y-1 data-[ending-style]:opacity-0 data-[ending-style]:-translate-y-1',
              'motion-reduce:translate-y-0!',
            )}
          >
            <CalendarPanel
              selected={value ? parseISO(value) : null}
              isDisabled={(d) => outOfRange(format(d, ISO))}
              onPickDay={(d) => {
                onChange(format(d, ISO));
                setOpen(false);
              }}
              footer={
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  disabled={outOfRange(format(new Date(), ISO))}
                  onClick={() => { onChange(format(new Date(), ISO)); setOpen(false); }}
                >
                  Oggi
                </Button>
              }
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
