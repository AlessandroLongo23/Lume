import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';

/*
 * Shared look of every admin data table: a quiet card on the content panel,
 * small sentence-case header labels over a hairline, hairline rows with a
 * hover overlay, mono numbers, status as a dot beside a word. Tables keep
 * their own TanStack logic and only borrow these class strings, so adopting
 * them is a styling change only.
 *
 * Density: globals.css tightens `table thead th` / `table tbody td` padding
 * and type under [data-density="compact"], so nothing here hard-codes it.
 */

/** Outer scroll container of a table. Sits on the panel, ringed by a hairline. */
export const tableCardClass =
  'rounded-xl bg-[var(--lume-panel)] shadow-[inset_0_0_0_1px_var(--lume-line)]';

/**
 * `<table>` element. It carries the body cells' secondary text colour, which
 * cells inherit: a colour class on a cell (`cellStrongClass`,
 * `text-[var(--lume-text)]`) then always wins. Set on the cell itself, the
 * default would compete with those classes, and Tailwind decides that by its
 * own utility order, not by the order the classes are written in.
 */
export const tableClass = 'w-full text-sm text-[var(--lume-text-secondary)] border-separate border-spacing-0';

/**
 * `<thead>`: no fill of its own. The card behind it is already the panel
 * colour, and the card's ring is an inset shadow, which paints beneath its
 * children: an opaque header hid the ring along the whole header row. The
 * hairline under the labels is an inset shadow on the cells.
 */
export const theadClass = '';

/** Header cell. 12px secondary label, sentence case, hairline under it. */
export function thClass({ sortable = false, align = 'left' }: { sortable?: boolean; align?: 'left' | 'right' | 'center' } = {}) {
  return [
    'h-10 px-4 py-2 text-xs font-medium text-[var(--lume-text-secondary)] select-none whitespace-nowrap',
    'shadow-[inset_0_-1px_0_var(--lume-line)]',
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left',
    sortable
      ? 'group/th cursor-pointer hover:text-[var(--lume-text)] transition-colors duration-[var(--duration-fast)]'
      : '',
  ].join(' ');
}

/** `<tbody>`: no dividers here, rows draw their own top hairline. */
export const tbodyClass = '';

/** Body row. Hairline above every row but the first, hover overlay. */
export function trClass({ interactive = true, selected = false }: { interactive?: boolean; selected?: boolean } = {}) {
  return [
    '[&:not(:first-child)>td]:shadow-[inset_0_1px_0_var(--lume-line)]',
    'transition-colors duration-[var(--duration-fast)]',
    selected ? 'bg-active' : '',
    interactive
      ? 'cursor-pointer hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--lume-ring-focus)]'
      : '',
  ].join(' ');
}

/** Body cell. Secondary text by default (inherited from `tableClass`); the identifying column uses `cellStrongClass`. */
export const tdClass = 'px-4 py-2 text-sm whitespace-nowrap';

/** The column that names the row (client name, product name). */
export const cellStrongClass = 'font-medium text-[var(--lume-text)]';

/** Numbers, prices, dates, times. Inherits the cell colour; add `text-[var(--lume-text)]` for amounts. */
export const cellNumClass = 'tabular-nums text-compact';

/** Loading / empty row inside the table. */
export const tableMessageClass = 'px-4 py-10 text-center text-sm text-[var(--lume-text-muted)]';

/** Placeholder for an empty cell. */
export function CellEmpty() {
  return <span className="text-[var(--lume-text-muted)]" aria-label="Nessun dato">—</span>;
}

/**
 * Sort affordance beside a header label: one arrow when sorted, a faint
 * double chevron on hover otherwise. Neutral, never indigo.
 */
export function SortIndicator({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') return <ArrowUp className="size-3.5 text-[var(--lume-text)]" aria-hidden />;
  if (direction === 'desc') return <ArrowDown className="size-3.5 text-[var(--lume-text)]" aria-hidden />;
  return (
    <ChevronsUpDown
      className="size-3.5 text-[var(--lume-text-muted)] opacity-0 group-hover/th:opacity-100 transition-opacity duration-[var(--duration-fast)] [@media(hover:none)]:opacity-60"
      aria-hidden
    />
  );
}
