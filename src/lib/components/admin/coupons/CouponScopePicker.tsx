'use client';

import { useState } from 'react';
import { ChevronDown, Scissors, Package, Tag, FolderTree } from 'lucide-react';
import { useServicesStore } from '@/lib/stores/services';
import { useProductsStore } from '@/lib/stores/products';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { NumberBadge } from '@/lib/components/shared/ui/NumberBadge';
import { MultiSelectList } from '@/lib/components/shared/ui/forms/MultiSelectList';

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

const byId = (i: { id: string }) => i.id;
const byName = (i: { name: string }) => i.name;

function isAllEmpty(s: CouponScopeValue): boolean {
  return (
    s.scope_service_ids.length === 0 &&
    s.scope_product_ids.length === 0 &&
    s.scope_service_category_ids.length === 0 &&
    s.scope_product_category_ids.length === 0
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
    <div className="surface-card">
      <button
        // ds-ignore: full-width disclosure header of a scope card, with no fill or fixed height; Button would add a control height and a hover fill
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm font-medium text-[var(--lume-text)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--lume-ring-focus)]"
      >
        <span className="flex items-center gap-2">
          <Icon className="size-3.5 text-[var(--lume-text-secondary)]" />
          {title}
          {count > 0 && <NumberBadge value={count} variant="strong" size="sm" />}
        </span>
        <ChevronDown className={`size-3.5 text-[var(--lume-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
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

  const set = (key: keyof CouponScopeValue) => (ids: string[]) => onChange({ ...value, [key]: ids });

  return (
    <div className="flex flex-col gap-3">
      <ToggleButton
        ariaLabel="Ambito del coupon"
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
              getId={byId}
              getLabel={byName}
              selectedIds={value.scope_service_ids}
              onChange={set('scope_service_ids')}
              ariaLabel="Servizi"
              searchPlaceholder="Cerca servizi…"
            />
          </ScopeSection>

          <ScopeSection title="Categorie servizi" icon={FolderTree} count={value.scope_service_category_ids.length} defaultOpen={false}>
            <MultiSelectList
              items={serviceCategories}
              getId={byId}
              getLabel={byName}
              selectedIds={value.scope_service_category_ids}
              onChange={set('scope_service_category_ids')}
              ariaLabel="Categorie servizi"
              searchPlaceholder="Cerca categorie servizi…"
            />
          </ScopeSection>

          <ScopeSection title="Prodotti" icon={Package} count={value.scope_product_ids.length} defaultOpen={false}>
            <MultiSelectList
              items={products}
              getId={byId}
              getLabel={byName}
              selectedIds={value.scope_product_ids}
              onChange={set('scope_product_ids')}
              ariaLabel="Prodotti"
              searchPlaceholder="Cerca prodotti…"
            />
          </ScopeSection>

          <ScopeSection title="Categorie prodotti" icon={Tag} count={value.scope_product_category_ids.length} defaultOpen={false}>
            <MultiSelectList
              items={productCategories}
              getId={byId}
              getLabel={byName}
              selectedIds={value.scope_product_category_ids}
              onChange={set('scope_product_category_ids')}
              ariaLabel="Categorie prodotti"
              searchPlaceholder="Cerca categorie prodotti…"
            />
          </ScopeSection>
        </div>
      )}
    </div>
  );
}
