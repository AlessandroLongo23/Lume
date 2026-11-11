'use client';

import { useMemo, useState, type ComponentType, type ReactNode, type SVGProps } from 'react';
import { Searchbar } from '../Searchbar';
import { ListBox, ListRow, ListEmpty } from '../list/ListBox';

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

interface MultiSelectListProps<T> {
  items: T[];
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  ariaLabel: string;
  searchPlaceholder?: string;
  emptyText?: string;
  icon?: IconComponent;
  /** Right-aligned detail per row (a price, a count). */
  renderTrailing?: (item: T) => ReactNode;
}

/**
 * Choose several items from a list, inline in a form: a search box, then a
 * scrolling card (about five rows tall) of rows that toggle with a check. Built on ListBox (glide, keyboard
 * focus), so it behaves like every other list.
 */
export function MultiSelectList<T>({
  items,
  getId,
  getLabel,
  selectedIds,
  onChange,
  ariaLabel,
  searchPlaceholder = 'Cerca…',
  emptyText = 'Nessun risultato',
  icon,
  renderTrailing,
}: MultiSelectListProps<T>) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => getLabel(i).toLowerCase().includes(q)) : items;
  }, [items, query, getLabel]);

  const toggle = (id: string) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);

  return (
    <div className="flex flex-col gap-2">
      <Searchbar value={query} onChange={setQuery} placeholder={searchPlaceholder} bindShortcut={false} />
      <ListBox role="listbox" multiple aria-label={ariaLabel} className="surface-card max-h-40 overflow-y-auto">
        {filtered.length === 0 ? (
          <ListEmpty>{emptyText}</ListEmpty>
        ) : (
          filtered.map((item) => {
            const id = getId(item);
            return (
              <ListRow
                key={id}
                icon={icon}
                selected={selectedIds.includes(id)}
                trailing={renderTrailing?.(item)}
                onClick={() => toggle(id)}
              >
                {getLabel(item)}
              </ListRow>
            );
          })
        )}
      </ListBox>
    </div>
  );
}
