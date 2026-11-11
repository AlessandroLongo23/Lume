'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useMemo, useCallback, useId, type ReactNode } from 'react';
import { ChevronDown, X, Plus } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { Portal } from '../Portal';
import { FloatingPanel } from '../FloatingPanel';
import { ListBox, ListRow, ListEmpty, ListGroupLabel } from '../list/ListBox';
import { useAnchoredPopover } from '@/lib/hooks/useAnchoredPopover';
import { useListNavigation } from '@/lib/hooks/useListNavigation';
import { cn } from '@/lib/utils';

type ControlSize = 'sm' | 'md' | 'lg';
const sizeClass: Record<ControlSize, string> = { sm: 'control-sm', md: 'control-md', lg: 'control-lg' };

interface SelectProps {
  value: any;
  onChange: (value: any) => void;
  options: any[];
  labelKey: string;
  valueKey: string;
  placeholder?: string;
  isNullable?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Tailwind max-height class for the option list. */
  maxHeight?: string;
  /** Classes on the wrapper (width, flex); full width by default. */
  className?: string;
  size?: ControlSize;
  /** Panel width in px; defaults to the trigger's width. */
  panelWidth?: number;
  /** Row content; defaults to the label. */
  renderOption?: (option: any) => ReactNode;
  /** Trigger content for the chosen option; defaults to the label. */
  renderValue?: (option: any) => ReactNode;
  /** Group heading for an option; consecutive options with the same group share one heading. */
  groupBy?: (option: any) => string | undefined;
  /** Accessible name when there is no visible label. */
  ariaLabel?: string;
  id?: string;
  invalid?: boolean;
  /** Generic "create new" affordance rendered in the search row. Closes the
   *  dropdown when clicked; the consumer typically opens a modal next. */
  createAction?: { label: string; onClick: () => void };
  /** When set, an empty-result state is replaced by a "+ Crea «query»" row.
   *  Fires with the trimmed search text and closes the dropdown. */
  onCreateFromSearch?: (typedText: string) => void;
}

/**
 * The one picker in Lume. A `control` trigger, a <FloatingPanel> with an
 * optional search row, and a <ListBox> of <ListRow>s, so it looks, moves and
 * responds to the keyboard exactly like every other list. Build pickers from
 * this (PhoneNumber's prefix is one) instead of a new dropdown.
 */
export function Select({
  value,
  onChange,
  options,
  labelKey,
  valueKey,
  placeholder = "Seleziona un'opzione",
  isNullable = false,
  disabled = false,
  searchable = true,
  searchPlaceholder = 'Cerca…',
  maxHeight = 'max-h-56',
  className,
  size = 'md',
  panelWidth,
  renderOption,
  renderValue,
  groupBy,
  ariaLabel,
  id,
  invalid,
  createAction,
  onCreateFromSearch,
}: SelectProps) {
  const [query, setQuery] = useState('');
  const listboxId = useId();
  const triggerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { open: isOpen, show, hide, position, panelRef, side } = useAnchoredPopover(triggerRef, { panelMaxHeight: 300, panelWidth });

  const getLabel = useCallback((option: any): string => option[labelKey] ?? '', [labelKey]);

  const selected = useMemo(() => options.find((o) => o[valueKey] === value), [options, valueKey, value]);

  const filtered = useMemo(() => {
    if (!searchable || !query) return options;
    const q = query.toLowerCase();
    return options.filter((o) => getLabel(o).toLowerCase().includes(q));
  }, [options, query, searchable, getLabel]);

  const close = useCallback(() => {
    hide();
    setQuery('');
    triggerRef.current?.focus();
  }, [hide]);

  const pick = useCallback((option: any) => {
    onChange(value === option[valueKey] && isNullable ? null : option[valueKey]);
    close();
  }, [onChange, value, valueKey, isNullable, close]);

  const nav = useListNavigation({
    count: filtered.length,
    onPick: (i) => pick(filtered[i]),
    onEscape: close,
    listRef,
    pickFirstOnEnter: true,
  });

  const open = () => {
    if (disabled) return;
    if (isOpen) return close();
    nav.setActive(-1);
    show();
    setTimeout(() => {
      (searchable ? searchRef.current : listRef.current)?.focus();
      // Open on the chosen option, not at the top of a long list.
      listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
    }, 30);
  };

  return (
    <div className={cn('relative w-full', className)}>
      <div
        ref={triggerRef}
        id={id}
        role="combobox"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-invalid={invalid || undefined}
        aria-disabled={disabled || undefined}
        className={cn('control w-full flex items-center justify-between gap-2 cursor-pointer select-none', sizeClass[size])}
        onClick={open}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); open(); }
        }}
      >
        <span className={cn('block truncate', !selected && 'text-[var(--lume-text-muted)]')}>
          {selected ? (renderValue ? renderValue(selected) : getLabel(selected)) : placeholder}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selected && isNullable && (
            <button
              type="button"
              aria-label="Rimuovi selezione"
              className="p-1 rounded-md text-[var(--lume-text-muted)] hover:text-[var(--lume-text)] hover:bg-hover transition-colors"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
            >
              <X className="size-4" />
            </button>
          )}
          <ChevronDown
            aria-hidden
            className={cn(
              'size-4 text-[var(--lume-text-muted)] transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)] motion-reduce:transition-none',
              isOpen && 'rotate-180',
            )}
          />
        </span>
      </div>

      <Portal>
        <AnimatePresence>
          {isOpen && position && (
            <FloatingPanel
              ref={panelRef}
              side={side}
              style={{
                position: 'fixed',
                left: position.left,
                top: position.top,
                bottom: position.bottom,
                width: panelWidth ?? position.width,
              }}
            >
              {(searchable || createAction) && (
                <div className="flex items-center gap-2 p-1.5 border-b border-line">
                  {searchable && (
                    <input
                      ref={searchRef}
                      type="text"
                      value={query}
                      onChange={(e) => { setQuery(e.target.value); nav.setActive(-1); }}
                      onKeyDown={nav.onKeyDown}
                      placeholder={searchPlaceholder}
                      aria-controls={listboxId}
                      className="flex-1 min-w-0 h-8 pointer-coarse:h-11 pointer-coarse:text-base px-2 text-sm bg-transparent border-0 rounded-md text-[var(--lume-text)] placeholder:text-[var(--lume-text-muted)] outline-none focus:ring-0"
                    />
                  )}
                  {createAction && (
                    <button
                      type="button"
                      onClick={() => { close(); createAction.onClick(); }}
                      className="shrink-0 inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-sm font-medium bg-active text-[var(--lume-text)] hover:bg-strong transition-colors"
                    >
                      <Plus className="size-4" />
                      {createAction.label}
                    </button>
                  )}
                </div>
              )}
              <ListBox
                ref={listRef}
                id={listboxId}
                role="listbox"
                tabIndex={-1}
                onKeyDown={searchable ? undefined : nav.onKeyDown}
                className={cn('overflow-y-auto outline-none', maxHeight)}
              >
                {filtered.length === 0 ? (
                  onCreateFromSearch && query.trim() ? (
                    <ListRow icon={Plus} onClick={() => { const t = query.trim(); close(); onCreateFromSearch(t); }}>
                      Crea «{query.trim()}»
                    </ListRow>
                  ) : (
                    <ListEmpty>Nessun risultato</ListEmpty>
                  )
                ) : (
                  filtered.map((option, i) => {
                    const group = groupBy?.(option);
                    const newGroup = group && (i === 0 || group !== groupBy?.(filtered[i - 1]));
                    return [
                    newGroup ? <ListGroupLabel key={`g-${group}`}>{group}</ListGroupLabel> : null,
                    <ListRow
                      key={option[valueKey] ?? i}
                      selected={value === option[valueKey]}
                      highlighted={nav.active === i}
                      check
                      onClick={() => pick(option)}
                      onMouseEnter={() => nav.setActive(i)}
                    >
                      {renderOption ? renderOption(option) : getLabel(option)}
                    </ListRow>,
                    ];
                  })
                )}
              </ListBox>
            </FloatingPanel>
          )}
        </AnimatePresence>
      </Portal>
    </div>
  );
}
