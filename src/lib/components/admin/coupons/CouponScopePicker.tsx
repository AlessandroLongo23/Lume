'use client';

import { useState, useMemo } from 'react';
import { Search, Check, ChevronDown, Scissors, Package, Tag, FolderTree } from 'lucide-react';
import { useServicesStore } from '@/lib/stores/services';
import { useProductsStore } from '@/lib/stores/products';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';

export interface CouponScopeValue {
  scope_service_ids: string[];
  scope_product_ids: string[];
  scope_service_category_ids: string[];
  scope_product_category_ids: string[];
}

interface CouponScopePickerProps {
  value: CouponScopeValue;
  onChange: (next: CouponScopeValue) => void;
}

export const EMPTY_SCOPE: CouponScopeValue = {
  scope_service_ids: [],
  scope_product_ids: [],
  scope_service_category_ids: [],
  scope_product_category_ids: [],
};

function isAllEmpty(s: CouponScopeValue): boolean {
  return (
    s.scope_service_ids.length === 0 &&
    s.scope_product_ids.length === 0 &&
    s.scope_service_category_ids.length === 0 &&
    s.scope_product_category_ids.length === 0
  );
}

function MultiSelectList<T extends { id: string; name: string }>({
  items,
  selected,
  onToggle,
  placeholder,
}: {
  items: T[];
  selected: string[];
  onToggle: (id: string) => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder={placeholder}
        />
      </div>
      <div className="max-h-40 overflow-y-auto rounded-md border border-zinc-500/15 divide-y divide-zinc-500/10">
        {filtered.length === 0 ? (
          <p className="p-3 text-xs text-zinc-400 text-center">Nessun risultato</p>
        ) : (
          filtered.map((item) => {
            const isSelected = selected.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggle(item.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-sm text-left transition-colors ${
                  isSelected
                    ? 'bg-primary/10 text-primary-hover dark:text-primary/70'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50'
                }`}
              >
                <span className="truncate">{item.name}</span>
                {isSelected && <Check className="size-3.5 shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function ScopeSection({
  title,
  icon: Icon,
  count,
  defaultOpen,
  children,
}: {
  title: string;
  icon: React.ElementType;
  count: number;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-md border border-zinc-500/15">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/30"
      >
        <span className="flex items-center gap-2">
          <Icon className="size-3.5 text-zinc-500" />
          {title}
          {count > 0 && (
            <span className="text-2xs font-semibold px-1.5 py-0.5 rounded bg-primary/15 text-primary">
              {count}
            </span>
          )}
        </span>
        <ChevronDown className={`size-3.5 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

export function CouponScopePicker({ value, onChange }: CouponScopePickerProps) {
  const services = useServicesStore((s) => s.services).filter((s) => !s.isArchived);
  const products = useProductsStore((s) => s.products).filter((p) => !p.isArchived);
  const serviceCategories = useServiceCategoriesStore((s) => s.service_categories).filter((c) => !c.isArchived);
  const productCategories = useProductCategoriesStore((s) => s.product_categories).filter((c) => !c.isArchived);

  const [mode, setMode] = useState<'all' | 'limited'>(isAllEmpty(value) ? 'all' : 'limited');

  const toggle = (key: keyof CouponScopeValue) => (id: string) => {
    const cur = value[key];
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    onChange({ ...value, [key]: next });
  };

  return (
    <div className="flex flex-col gap-3">
      <ToggleButton
        options={['Tutti i servizi e prodotti', 'Limita ambito']}
        value={mode === 'all' ? 'Tutti i servizi e prodotti' : 'Limita ambito'}
        onChange={(v) => {
          const nextMode = v === 'Tutti i servizi e prodotti' ? 'all' : 'limited';
          setMode(nextMode);
          if (nextMode === 'all') onChange(EMPTY_SCOPE);
        }}
        className="w-full"
      />

      {mode === 'limited' && (
        <div className="flex flex-col gap-2">
          <ScopeSection title="Servizi" icon={Scissors} count={value.scope_service_ids.length} defaultOpen>
            <MultiSelectList
              items={services}
              selected={value.scope_service_ids}
              onToggle={toggle('scope_service_ids')}
              placeholder="Cerca servizi…"
            />
          </ScopeSection>

          <ScopeSection title="Categorie servizi" icon={FolderTree} count={value.scope_service_category_ids.length} defaultOpen={false}>
            <MultiSelectList
              items={serviceCategories}
              selected={value.scope_service_category_ids}
              onToggle={toggle('scope_service_category_ids')}
              placeholder="Cerca categorie servizi…"
            />
          </ScopeSection>

          <ScopeSection title="Prodotti" icon={Package} count={value.scope_product_ids.length} defaultOpen={false}>
            <MultiSelectList
              items={products}
              selected={value.scope_product_ids}
              onToggle={toggle('scope_product_ids')}
              placeholder="Cerca prodotti…"
            />
          </ScopeSection>

          <ScopeSection title="Categorie prodotti" icon={Tag} count={value.scope_product_category_ids.length} defaultOpen={false}>
            <MultiSelectList
              items={productCategories}
              selected={value.scope_product_category_ids}
              onToggle={toggle('scope_product_category_ids')}
              placeholder="Cerca categorie prodotti…"
            />
          </ScopeSection>
        </div>
      )}
    </div>
  );
}
