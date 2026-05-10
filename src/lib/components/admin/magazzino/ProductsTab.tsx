'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { Package, Plus, Minus, ArrowDownToLine, ChevronUp, ChevronDown, Trash2, Search, X, SlidersHorizontal, Check, ArchiveRestore } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useProductsStore } from '@/lib/stores/products';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { useManufacturersStore } from '@/lib/stores/manufacturers';
import { useSuppliersStore } from '@/lib/stores/suppliers';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { NumberBadge } from '@/lib/components/shared/ui/NumberBadge';
import { ConciergeImportModal } from '@/lib/components/shared/ui/ConciergeImportModal';
import { Button } from '@/lib/components/shared/ui/Button';
import { DeleteProductModal } from './DeleteProductModal';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { ColumnPicker } from '@/lib/components/admin/table/ColumnPicker';
import { useTableColumnPrefs } from '@/lib/hooks/useTableColumnPrefs';
import { useFitPageSize } from '@/lib/hooks/useFitPageSize';
import { cardStyle } from '@/lib/const/appearance';
import { Select } from '@/lib/components/shared/ui/forms/Select';
import { Checkbox } from '@/lib/components/shared/ui/forms/Checkbox';
import { Portal } from '@/lib/components/shared/ui/Portal';
import type { Product } from '@/lib/types/Product';

// ─── Stock badge component ────────────────────────────────────────────────────

function StockBadge({ stock_quantity, min_threshold }: { stock_quantity: number; min_threshold: number }) {
  const isLow = stock_quantity <= min_threshold;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        isLow
          ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
          : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'
      }`}
    >
      {isLow && <Package className="size-3" />}
      {stock_quantity}
    </span>
  );
}

// ─── Stock adjuster (inline +/− with debounced API write) ────────────────────

function StockAdjuster({ productId, initialQuantity, minThreshold }: {
  productId: string;
  initialQuantity: number;
  minThreshold: number;
}) {
  const adjustStock = useProductsStore((s) => s.adjustStock);
  const [localQty, setLocalQty] = useState(initialQuantity);
  const pendingDeltaRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (pendingDeltaRef.current === 0) setLocalQty(initialQuantity);
  }, [initialQuantity]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const adjust = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    setLocalQty((q) => q + delta);
    pendingDeltaRef.current += delta;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const d = pendingDeltaRef.current;
      pendingDeltaRef.current = 0;
      if (d === 0) return;
      adjustStock(productId, d).catch(() => {
        setLocalQty((q) => q - d);
      });
    }, 300);
  };

  return (
    <div className="flex items-center gap-1" data-no-row-click>
      <button
        onClick={(e) => adjust(e, -1)}
        className="size-5 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Riduci giacenza"
      >
        <Minus className="size-3" />
      </button>
      <StockBadge stock_quantity={localQty} min_threshold={minThreshold} />
      <button
        onClick={(e) => adjust(e, +1)}
        className="size-5 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Aumenta giacenza"
      >
        <Plus className="size-3" />
      </button>
    </div>
  );
}

// ─── Faceted filter dropdown ──────────────────────────────────────────────────

interface FacetedFilterProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
}

function FacetedFilter({ label, options, selected, onChange }: FacetedFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={[
          'flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors',
          selected.length > 0
            ? 'bg-primary/10 border-primary/30 text-primary-hover dark:text-primary/70'
            : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
        ].join(' ')}
      >
        <SlidersHorizontal className="size-4" />
        <span>{label}</span>
        {selected.length > 0 && (
          <NumberBadge value={selected.length} variant="solid" size="md" />
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-dropdown w-52 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Filtra per {label.toLowerCase()}
            </span>
          </div>
          <div className="py-1 max-h-56 overflow-y-auto">
            {options.length === 0 ? (
              <p className="px-3 py-2 text-xs text-zinc-400">Nessuna opzione</p>
            ) : (
              options.map((opt) => {
                const checked = selected.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggle(opt.value)}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <span
                      className={[
                        'shrink-0 size-4 rounded border transition-colors flex items-center justify-center',
                        checked ? 'bg-primary border-primary' : 'border-zinc-300 dark:border-zinc-600',
                      ].join(' ')}
                    >
                      {checked && <Check className="size-3 text-white" />}
                    </span>
                    {opt.label}
                  </button>
                );
              })
            )}
          </div>
          {selected.length > 0 && (
            <div className="px-3 py-1.5 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange([])}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                Azzera filtri
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ProductsTabProps {
  products: Product[];
  onAdd: () => void;
  showArchived?: boolean;
}

export function ProductsTab({ products, onAdd, showArchived = false }: ProductsTabProps) {
  const router = useRouter();
  const isLoading = useProductsStore((s) => s.isLoading);
  const restoreProduct = useProductsStore((s) => s.restoreProduct);
  const bulkUpdateProducts = useProductsStore((s) => s.bulkUpdateProducts);
  const bulkArchiveProducts = useProductsStore((s) => s.bulkArchiveProducts);
  const bulkRestoreProducts = useProductsStore((s) => s.bulkRestoreProducts);
  const bulkDeleteProducts = useProductsStore((s) => s.bulkDeleteProducts);
  const categories = useProductCategoriesStore((s) => s.product_categories);
  const manufacturers = useManufacturersStore((s) => s.manufacturers);
  const suppliers = useSuppliersStore((s) => s.suppliers);

  const [showImport, setShowImport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkArchiveConfirm, setBulkArchiveConfirm] = useState(false);
  const [bulkRestoreConfirm, setBulkRestoreConfirm] = useState(false);

  const selectedIds = Object.keys(rowSelection);
  const hasSelection = selectedIds.length > 0;

  const { ref: tableCardRef, pageSize } = useFitPageSize<HTMLDivElement>({ rowPx: 41 });

  useEffect(() => {
    setPageIndex(0);
  }, [globalFilter, selectedManufacturers, selectedCategories, selectedSuppliers]);

  const filteredData = useMemo(() => {
    let data = products;

    if (selectedManufacturers.length > 0) {
      data = data.filter((p) => selectedManufacturers.includes(p.manufacturer_id ?? ''));
    }
    if (selectedCategories.length > 0) {
      data = data.filter((p) => selectedCategories.includes(p.product_category_id ?? ''));
    }
    if (selectedSuppliers.length > 0) {
      data = data.filter((p) => selectedSuppliers.includes(p.supplier_id ?? ''));
    }
    if (globalFilter.trim()) {
      const q = globalFilter.toLowerCase();
      data = data.filter((p) => p.name.toLowerCase().includes(q));
    }

    return data;
  }, [products, selectedManufacturers, selectedCategories, selectedSuppliers, globalFilter]);

  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(filteredData.length / pageSize) - 1);
    if (pageIndex > lastPage) setPageIndex(lastPage);
  }, [pageSize, filteredData.length, pageIndex]);

  const manufacturerOptions = useMemo(
    () => manufacturers.map((m) => ({ value: m.id, label: m.name })),
    [manufacturers]
  );
  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories]
  );
  const supplierOptions = useMemo(
    () => suppliers.map((s) => ({ value: s.id, label: s.name })),
    [suppliers]
  );

  const columns = useMemo<ColumnDef<Product>[]>(() => [
    {
      id: 'select',
      enableSorting: false,
      size: 40,
      meta: { requiredVisible: true },
      header: ({ table }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            size="sm"
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            aria-label="Seleziona tutti"
            className="bulk-cb opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()} data-no-row-click>
          <Checkbox
            size="sm"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            aria-label="Seleziona riga"
            className="bulk-cb opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ getValue }) => (
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{getValue() as string}</span>
      ),
      meta: { requiredVisible: true },
    },
    {
      accessorKey: 'manufacturer_id',
      header: 'Marca',
      cell: ({ row }) => {
        const m = manufacturers.find((x) => x.id === row.original.manufacturer_id);
        return <span>{m?.name ?? '—'}</span>;
      },
      sortingFn: (a, b) => {
        const mA = manufacturers.find((x) => x.id === a.original.manufacturer_id)?.name ?? '';
        const mB = manufacturers.find((x) => x.id === b.original.manufacturer_id)?.name ?? '';
        return mA.localeCompare(mB, 'it');
      },
    },
    {
      accessorKey: 'product_category_id',
      header: 'Categoria',
      cell: ({ row }) => {
        const c = categories.find((x) => x.id === row.original.product_category_id);
        return <span>{c?.name ?? '—'}</span>;
      },
      sortingFn: (a, b) => {
        const cA = categories.find((x) => x.id === a.original.product_category_id)?.name ?? '';
        const cB = categories.find((x) => x.id === b.original.product_category_id)?.name ?? '';
        return cA.localeCompare(cB, 'it');
      },
    },
    {
      accessorKey: 'supplier_id',
      header: 'Fornitore',
      cell: ({ row }) => {
        const s = suppliers.find((x) => x.id === row.original.supplier_id);
        return <span>{s?.name ?? '—'}</span>;
      },
      sortingFn: (a, b) => {
        const sA = suppliers.find((x) => x.id === a.original.supplier_id)?.name ?? '';
        const sB = suppliers.find((x) => x.id === b.original.supplier_id)?.name ?? '';
        return sA.localeCompare(sB, 'it');
      },
    },
    {
      accessorKey: 'is_for_retail',
      header: 'Vendita',
      cell: ({ getValue }) => {
        const v = getValue() as boolean;
        return v ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary dark:text-primary/80">
            Vendita
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            Uso interno
          </span>
        );
      },
      meta: { pickerLabel: 'Vendita' },
    },
    {
      accessorKey: 'price',
      header: () => <span className="block w-full text-right">Prezzo Acquisto</span>,
      cell: ({ getValue }) => (
        <span className="block text-right tabular-nums">{Number(getValue() as number).toFixed(2)} €</span>
      ),
      meta: { pickerLabel: 'Prezzo Acquisto' },
    },
    {
      accessorKey: 'sell_price',
      header: () => <span className="block w-full text-right">Prezzo Vendita</span>,
      cell: ({ getValue }) => {
        const v = getValue() as number | null;
        return <span className="block text-right tabular-nums">{v != null ? `${v.toFixed(2)} €` : '—'}</span>;
      },
      meta: { pickerLabel: 'Prezzo Vendita' },
    },
    {
      id: 'margine',
      header: () => <span className="block w-full text-right">Margine</span>,
      cell: ({ row }) => {
        const { sell_price, price, is_for_retail } = row.original;
        if (!is_for_retail || sell_price == null) {
          return <span className="block text-right text-zinc-400">—</span>;
        }
        const margin = sell_price - price;
        return (
          <span className={`block text-right tabular-nums ${margin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {margin >= 0 ? '+' : ''}{margin.toFixed(2)} €
          </span>
        );
      },
      meta: { pickerLabel: 'Margine' },
    },
    {
      accessorKey: 'total_purchased',
      header: () => <span className="block w-full text-right">Acquistati</span>,
      cell: ({ getValue }) => (
        <span className="block text-right tabular-nums">{getValue() as number}</span>
      ),
      meta: { pickerLabel: 'Acquistati' },
    },
    {
      accessorKey: 'total_sold',
      header: () => <span className="block w-full text-right">Venduti</span>,
      cell: ({ getValue }) => (
        <span className="block text-right tabular-nums">{getValue() as number}</span>
      ),
      meta: { pickerLabel: 'Venduti' },
    },
    {
      accessorKey: 'stock_quantity',
      header: () => <span className="block w-full text-right">Giacenza</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <StockAdjuster
            productId={row.original.id}
            initialQuantity={row.original.stock_quantity ?? 0}
            minThreshold={row.original.min_threshold ?? 0}
          />
        </div>
      ),
      meta: { pickerLabel: 'Giacenza' },
    },
    {
      accessorKey: 'min_threshold',
      header: () => <span className="block w-full text-right">Soglia Min.</span>,
      cell: ({ getValue }) => (
        <span className="block text-right tabular-nums">{(getValue() as number) ?? 0}</span>
      ),
      meta: { pickerLabel: 'Soglia Min.' },
    },
  ], [manufacturers, categories, suppliers]);

  const { columnVisibility, columnOrder, setColumnVisibility, setColumnOrder } =
    useTableColumnPrefs('products', columns);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      pagination: { pageIndex, pageSize },
      columnVisibility,
      columnOrder,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater;
      setPageIndex(next.pageIndex);
    },
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualFiltering: true,
  });

  const handleDeleteClick = (e: React.MouseEvent, item: Product) => {
    e.stopPropagation();
    setSelectedProduct(item);
    setShowDelete(true);
  };

  const handleRestore = async (e: React.MouseEvent, item: Product) => {
    e.stopPropagation();
    try {
      await restoreProduct(item.id);
      messagePopup.getState().success('Prodotto ripristinato con successo.');
    } catch {
      messagePopup.getState().error('Errore durante il ripristino.');
    }
  };

  if (!isLoading && products.length === 0) {
    return (
      <>
        <ConciergeImportModal isOpen={showImport} onClose={() => setShowImport(false)} />
        <EmptyState
          icon={Package}
          title="Nessun prodotto trovato"
          description="Aggiungi il tuo primo prodotto per iniziare a gestire il magazzino."
          secondaryAction={{ label: 'Importa dati', icon: ArrowDownToLine, onClick: () => setShowImport(true) }}
          action={{ label: 'Nuovo prodotto', icon: Plus, onClick: onAdd }}
        />
      </>
    );
  }

  const numericColumns = new Set(['price', 'sell_price', 'margine', 'total_purchased', 'total_sold', 'stock_quantity', 'min_threshold']);

  return (
    <>
      <DeleteProductModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        selectedProduct={selectedProduct}
      />

      <div className="flex-1 min-h-0 flex flex-col gap-4 w-full">
        {/* Toolbar — transforms to action bar when rows are selected */}
        {hasSelection ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-primary">
              {selectedIds.length} {selectedIds.length === 1 ? 'selezionato' : 'selezionati'}
            </span>
            <span className="text-zinc-400 dark:text-zinc-600">·</span>

            <Select
              value={null}
              onChange={(v) => {
                if (!v) return;
                setBulkLoading(true);
                bulkUpdateProducts(selectedIds, { manufacturer_id: v })
                  .then(() => {
                    messagePopup.getState().success(`Marca aggiornata per ${selectedIds.length} prodotti`);
                    setRowSelection({});
                  })
                  .catch(() => messagePopup.getState().error('Errore durante l\'aggiornamento'))
                  .finally(() => setBulkLoading(false));
              }}
              options={manufacturers}
              labelKey="name"
              valueKey="id"
              placeholder="Marca"
              disabled={bulkLoading}
              size="sm"
              width="w-36"
            />

            <Select
              value={null}
              onChange={(v) => {
                if (!v) return;
                setBulkLoading(true);
                bulkUpdateProducts(selectedIds, { product_category_id: v })
                  .then(() => {
                    messagePopup.getState().success(`Categoria aggiornata per ${selectedIds.length} prodotti`);
                    setRowSelection({});
                  })
                  .catch(() => messagePopup.getState().error('Errore durante l\'aggiornamento'))
                  .finally(() => setBulkLoading(false));
              }}
              options={categories}
              labelKey="name"
              valueKey="id"
              placeholder="Categoria"
              disabled={bulkLoading}
              size="sm"
              width="w-36"
            />

            <Select
              value={null}
              onChange={(v) => {
                if (!v) return;
                setBulkLoading(true);
                bulkUpdateProducts(selectedIds, { supplier_id: v })
                  .then(() => {
                    messagePopup.getState().success(`Fornitore aggiornato per ${selectedIds.length} prodotti`);
                    setRowSelection({});
                  })
                  .catch(() => messagePopup.getState().error('Errore durante l\'aggiornamento'))
                  .finally(() => setBulkLoading(false));
              }}
              options={suppliers}
              labelKey="name"
              valueKey="id"
              placeholder="Fornitore"
              disabled={bulkLoading}
              size="sm"
              width="w-36"
            />

            {showArchived ? (
              <button
                onClick={() => setBulkRestoreConfirm(true)}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                <ArchiveRestore className="size-3" />
                Ripristina
              </button>
            ) : (
              <button
                onClick={() => setBulkArchiveConfirm(true)}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                <ArchiveRestore className="size-3" />
                Archivia
              </button>
            )}

            <button
              onClick={() => setBulkDeleteConfirm(true)}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              <Trash2 className="size-3" />
              Elimina
            </button>

            <button
              onClick={() => setRowSelection({})}
              className="ml-auto flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              <X className="size-3" />
              Annulla
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex items-center flex-1 max-w-sm">
              <Search className="absolute left-2.5 size-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cerca prodotto..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full py-2 pl-9 pr-8 text-sm bg-transparent border rounded-lg
                  border-zinc-200 dark:border-zinc-800
                  focus:border-zinc-300 dark:focus:border-zinc-700
                  text-zinc-900 dark:text-zinc-100
                  placeholder:text-zinc-400 outline-none transition-colors"
              />
              {globalFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  aria-label="Cancella ricerca"
                  onClick={() => setGlobalFilter('')}
                  className="absolute right-1"
                >
                  <X />
                </Button>
              )}
            </div>

            <FacetedFilter
              label="Marca"
              options={manufacturerOptions}
              selected={selectedManufacturers}
              onChange={setSelectedManufacturers}
            />
            <FacetedFilter
              label="Categoria"
              options={categoryOptions}
              selected={selectedCategories}
              onChange={setSelectedCategories}
            />
            <FacetedFilter
              label="Fornitore"
              options={supplierOptions}
              selected={selectedSuppliers}
              onChange={setSelectedSuppliers}
            />

            <ColumnPicker tableId="products" columns={columns} className="ml-auto" />
          </div>
        )}

        {/* Table */}
        <div ref={tableCardRef} className="flex-1 min-h-0 w-full">
          <div className={`max-h-full w-full overflow-x-auto overflow-y-hidden ${cardStyle}`}>
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="group">
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    const isNumeric = numericColumns.has(header.column.id);
                    const isSelect = header.column.id === 'select';
                    return (
                      <th
                        key={header.id}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        className={[
                          'px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide select-none whitespace-nowrap',
                          canSort ? 'cursor-pointer hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors' : '',
                          isNumeric ? 'text-right' : 'text-left',
                          isSelect ? 'w-10' : '',
                        ].join(' ')}
                      >
                        <span className={['inline-flex items-center gap-1', isNumeric ? 'flex-row-reverse' : ''].join(' ')}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            <span className="flex flex-col">
                              <ChevronUp className={`size-3 ${sorted === 'asc' ? 'text-primary' : 'text-zinc-300 dark:text-zinc-600'}`} />
                              <ChevronDown className={`size-3 -mt-1 ${sorted === 'desc' ? 'text-primary' : 'text-zinc-300 dark:text-zinc-600'}`} />
                            </span>
                          )}
                        </span>
                      </th>
                    );
                  })}
                  <th className="px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide text-right w-20">
                    Azioni
                  </th>
                </tr>
              ))}
            </thead>
            <tbody className={`divide-y divide-zinc-100 dark:divide-zinc-800${hasSelection ? ' [&_.bulk-cb]:opacity-100' : ''}`}>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-sm text-zinc-400">
                    Caricando prodotti...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-sm text-zinc-400">
                    Nessun prodotto trovato.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button, a, [data-no-row-click]')) return;
                      if (hasSelection) { row.toggleSelected(); return; }
                      router.push(`/admin/magazzino/prodotti/${row.original.id}`);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target === e.currentTarget) {
                        router.push(`/admin/magazzino/prodotti/${row.original.id}`);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="group bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isNumeric = numericColumns.has(cell.column.id);
                      return (
                        <td
                          key={cell.id}
                          className={[
                            'px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300',
                            isNumeric ? 'text-right' : '',
                          ].join(' ')}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                    <td className="px-4 py-2">
                      <div className="flex flex-row items-center justify-end gap-1">
                        {showArchived ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            iconOnly
                            aria-label="Ripristina"
                            title="Ripristina"
                            onClick={(e) => handleRestore(e, row.original)}
                            className="text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                          >
                            <ArchiveRestore />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            iconOnly
                            aria-label="Elimina"
                            title="Elimina"
                            onClick={(e) => handleDeleteClick(e, row.original)}
                            className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </div>

        <Pagination
          currentPage={pageIndex + 1}
          onPageChange={(p) => setPageIndex(p - 1)}
          totalItems={filteredData.length}
          itemsPerPage={pageSize}
          labelPlural="prodotti"
        />
      </div>

      {/* Bulk archive confirm */}
      {bulkArchiveConfirm && (
        <Portal>
          <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-full max-w-sm shadow-xl">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Archivia {selectedIds.length} {selectedIds.length === 1 ? 'prodotto' : 'prodotti'}?
              </h3>
              <p className="text-sm text-zinc-500 mb-6">
                I prodotti archiviati non saranno visibili nella lista principale.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setBulkArchiveConfirm(false)}>Annulla</Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    setBulkArchiveConfirm(false);
                    setBulkLoading(true);
                    try {
                      await bulkArchiveProducts(selectedIds);
                      messagePopup.getState().success(`${selectedIds.length} prodotti archiviati`);
                      setRowSelection({});
                    } catch {
                      messagePopup.getState().error('Errore durante l\'archiviazione');
                    } finally {
                      setBulkLoading(false);
                    }
                  }}
                >
                  Archivia
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Bulk restore confirm */}
      {bulkRestoreConfirm && (
        <Portal>
          <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-full max-w-sm shadow-xl">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Ripristina {selectedIds.length} {selectedIds.length === 1 ? 'prodotto' : 'prodotti'}?
              </h3>
              <p className="text-sm text-zinc-500 mb-6">
                I prodotti torneranno visibili nella lista principale.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setBulkRestoreConfirm(false)}>Annulla</Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    setBulkRestoreConfirm(false);
                    setBulkLoading(true);
                    try {
                      await bulkRestoreProducts(selectedIds);
                      messagePopup.getState().success(`${selectedIds.length} prodotti ripristinati`);
                      setRowSelection({});
                    } catch {
                      messagePopup.getState().error('Errore durante il ripristino');
                    } finally {
                      setBulkLoading(false);
                    }
                  }}
                >
                  Ripristina
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Bulk delete confirm */}
      {bulkDeleteConfirm && (
        <Portal>
          <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-full max-w-sm shadow-xl">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Eliminare {selectedIds.length} {selectedIds.length === 1 ? 'prodotto' : 'prodotti'}?
              </h3>
              <p className="text-sm text-zinc-500 mb-6">
                Questa azione è irreversibile.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setBulkDeleteConfirm(false)}>Annulla</Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    setBulkDeleteConfirm(false);
                    setBulkLoading(true);
                    try {
                      await bulkDeleteProducts(selectedIds);
                      messagePopup.getState().success(`${selectedIds.length} prodotti eliminati`);
                      setRowSelection({});
                    } catch {
                      messagePopup.getState().error('Errore durante l\'eliminazione');
                    } finally {
                      setBulkLoading(false);
                    }
                  }}
                >
                  Elimina
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
