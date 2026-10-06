'use client';

import { useMemo, useRef, useState } from 'react';
import { Popover } from '@base-ui/react/popover';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isSameDay, isValid, parse, parseISO, setMonth, setYear } from 'date-fns';
import { cn } from '@/lib/utils';
import { addMonths, subMonths, getMonthDays, formatDateString, weekDays } from '@/lib/utils/date';
import { capitalize } from '@/lib/utils/string';
import { Button } from '@/lib/components/shared/ui/Button';

type PanelMode = 'day' | 'month' | 'year';

const YEAR_SPAN = 12; // years shown per page in the year grid
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
  id?: string;
  'aria-label'?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'h-[var(--lume-control-h-sm)] pl-[var(--lume-control-px-sm)] text-[length:var(--lume-control-text-sm)]',
  md: 'h-[var(--lume-control-h-md)] pl-[var(--lume-control-px-md)] text-[length:var(--lume-control-text-md)]',
};

/**
 * Date input in the Italian order (gg/mm/aaaa) on every browser and OS, with a
 * calendar to pick from. The native `<input type="date">` follows the browser's
 * language, so the same salon saw mm/dd/yyyy on an English-language machine.
 */
export function DateField({
  value, onChange, onEnter, min, max, size = 'md', id, className, 'aria-label': ariaLabel,
}: DateFieldProps) {
  const [text, setText] = useState(() => toDisplay(value));
  const [open, setOpen] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);

  // The parent changed the date (a quick period, a calendar pick): show it.
  // Skipped while the text already means that value, so typing is never rewritten.
  if ((parseItalianDate(text) ?? '') !== value) setText(toDisplay(value));

  const invalid = text.trim() !== '' && parseItalianDate(text) === null;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div
        ref={fieldRef}
        className={cn(
          'flex items-center rounded-md border bg-card text-foreground transition-colors',
          'focus-within:border-[var(--lume-ring-focus)]',
          invalid ? 'border-danger-line' : 'border-border',
          sizeClasses[size],
          className,
        )}
      >
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="gg/mm/aaaa"
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
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
          className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-[length:inherit] tabular-nums outline-none focus:ring-0 placeholder:text-muted-foreground"
        />
        <Popover.Trigger
          aria-label="Apri il calendario"
          className={cn(
            'flex h-full shrink-0 items-center justify-center rounded-r-md text-muted-foreground',
            'hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--lume-ring-focus)]',
            size === 'sm' ? 'w-[var(--lume-control-h-sm)]' : 'w-[var(--lume-control-h-md)]',
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
            className="w-72 rounded-lg bg-popover p-3 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none"
          >
            <CalendarPanel
              value={value}
              min={min}
              max={max}
              onPick={(iso) => {
                onChange(iso);
                setOpen(false);
              }}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

const cellBase =
  'rounded-md text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--lume-ring-focus)]';
const cellIdle = 'text-foreground hover:bg-accent';
const cellSelected = 'bg-primary text-primary-foreground hover:bg-primary-hover';
const cellCurrent = 'font-semibold text-primary hover:bg-accent';

/** Month grid; the header label steps out to the months of the year, then to the years. */
function CalendarPanel({ value, min, max, onPick }: {
  value: string; min?: string; max?: string; onPick: (iso: string) => void;
}) {
  const selected = value ? parseISO(value) : null;
  const today = useMemo(() => new Date(), []);
  const [mode, setMode] = useState<PanelMode>('day');
  const [displayMonth, setDisplayMonth] = useState<Date>(selected ?? today);
  const [yearPageStart, setYearPageStart] = useState(
    () => Math.floor((selected ?? today).getFullYear() / YEAR_SPAN) * YEAR_SPAN,
  );

  const monthDays = useMemo(() => getMonthDays(displayMonth), [displayMonth]);
  const monthLabels = useMemo(
    () => Array.from({ length: 12 }, (_, i) => capitalize(formatDateString(new Date(2000, i, 1), 'MMM'))),
    [],
  );
  const years = Array.from({ length: YEAR_SPAN }, (_, i) => yearPageStart + i);
  const outOfRange = (iso: string) => (!!min && iso < min) || (!!max && iso > max);

  function step(direction: 1 | -1) {
    if (mode === 'day') setDisplayMonth(direction === 1 ? addMonths(displayMonth, 1) : subMonths(displayMonth, 1));
    else if (mode === 'month') setDisplayMonth(setYear(displayMonth, displayMonth.getFullYear() + direction));
    else setYearPageStart((p) => p + direction * YEAR_SPAN);
  }

  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <Button variant="ghost" size="sm" iconOnly aria-label="Precedente" onClick={() => step(-1)}>
          <ChevronLeft />
        </Button>
        <button
          type="button"
          onClick={() => setMode(mode === 'day' ? 'month' : mode === 'month' ? 'year' : 'day')}
          className={cn(cellBase, cellIdle, 'px-2 py-1 font-medium')}
        >
          {mode === 'day' && capitalize(formatDateString(displayMonth, 'MMMM yyyy'))}
          {mode === 'month' && displayMonth.getFullYear()}
          {mode === 'year' && `${years[0]} – ${years[years.length - 1]}`}
        </button>
        <Button variant="ghost" size="sm" iconOnly aria-label="Successivo" onClick={() => step(1)}>
          <ChevronRight />
        </Button>
      </div>

      {mode === 'day' && (
        <>
          <div className="mb-1 grid grid-cols-7">
            {weekDays.map((d) => (
              <div key={d} className="py-1 text-center text-xs font-medium text-muted-foreground">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {monthDays.map(({ date, isCurrentMonth }) => {
              const iso = format(date, ISO);
              const isSelected = !!selected && isSameDay(date, selected);
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={outOfRange(iso)}
                  aria-pressed={isSelected}
                  onClick={() => onPick(iso)}
                  className={cn(
                    cellBase, 'h-9 tabular-nums disabled:cursor-not-allowed disabled:opacity-40',
                    isSelected ? cellSelected
                      : isSameDay(date, today) ? cellCurrent
                        : isCurrentMonth ? cellIdle
                          : 'text-muted-foreground hover:bg-accent',
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </>
      )}

      {mode === 'month' && (
        <div className="grid grid-cols-3 gap-1">
          {monthLabels.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setDisplayMonth(setMonth(displayMonth, i));
                setMode('day');
              }}
              className={cn(
                cellBase, 'py-2',
                i === displayMonth.getMonth() ? cellSelected
                  : today.getFullYear() === displayMonth.getFullYear() && today.getMonth() === i ? cellCurrent
                    : cellIdle,
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {mode === 'year' && (
        <div className="grid grid-cols-3 gap-1">
          {years.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => {
                setDisplayMonth(setYear(displayMonth, year));
                setMode('month');
              }}
              className={cn(
                cellBase, 'py-2 tabular-nums',
                year === displayMonth.getFullYear() ? cellSelected : year === today.getFullYear() ? cellCurrent : cellIdle,
              )}
            >
              {year}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 border-t border-border pt-3">
        <Button
          variant="ghost"
          size="sm"
          fullWidth
          disabled={outOfRange(format(today, ISO))}
          onClick={() => onPick(format(today, ISO))}
        >
          Oggi
        </Button>
      </div>
    </>
  );
}
