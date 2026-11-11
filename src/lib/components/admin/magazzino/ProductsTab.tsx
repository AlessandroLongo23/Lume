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
import { Package, Plus, Minus, ArrowDownToLine, Trash2, X, ArchiveRestore } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useProductsStore } from '@/lib/stores/products';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { useManufacturersStore } from '@/lib/stores/manufacturers';
import { useSuppliersStore } from '@/lib/stores/suppliers';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { ConciergeImportModal } from '@/lib/components/shared/ui/ConciergeImportModal';
import { Button } from '@/lib/components/shared/ui/Button';
import { DeleteProductModal } from './DeleteProductModal';
import { DeleteAllModal } from '@/lib/components/shared/ui/modals/DeleteAllModal';
import { ProductCategoryBadge } from './ProductCategoryBadge';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { ColumnPicker } from '@/lib/components/admin/table/ColumnPicker';
import { ExportMenu } from '@/lib/components/shared/ui/ExportMenu';
import type { ExportColumn } from '@/lib/utils/tableExport';
import { useTableColumnPrefs } from '@/lib/hooks/useTableColumnPrefs';
import { useFitPageSize } from '@/lib/hooks/useFitPageSize';
import { Select } from '@/lib/components/shared/ui/forms/Select';
import { Checkbox } from '@/lib/components/shared/ui/forms/Checkbox';
import { ConfirmDialog } from '@/lib/components/shared/ui/modals/ConfirmDialog';
import { FacetedFilter } from '@/lib/components/admin/table/FacetedFilter';
import {
  tableCardClass,
  tableClass,
  theadClass,
  thClass,
  trClass,
  tdClass,
  cellStrongClass,
  cellNumClass,
  tableMessageClass,
  SortIndicator,
} from '@/lib/components/shared/ui/table/tableStyles';
import type { Product } from '@/lib/types/Product';
import { Searchbar } from '@/lib/components/shared/ui/Searchbar';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import { formatCurrency } from '@/lib/utils/format';

// ─── Stock badge component ────────────────────────────────────────────────────

function StockBadge({ stock_quantity, min_threshold }: { stock_quantity: number; min_threshold: number }) {
  const isLow = stock_quantity <= min_threshold;
  // Low stock is a state: a danger dot beside the number, the number stays neutral.
  return (
    <Tooltip label={isLow ? 'Scorta bassa' : undefined}>
      <span className={`inline-flex items-center justify-end gap-1.5 min-w-8 ${cellNumClass} text-[var(--lume-text)]`}>
        {isLow && <span aria-hidden className="size-1.5 rounded-full bg-danger-strong" />}
        {stock_quantity}
        {isLow && <span className="sr-only">Scorta bassa</span>}
      </span>
    </Tooltip>
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
    <div className="flex items-center gap-1" data-no-row-click data-tour="stock-adjuster">
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        onClick={(e) => adjust(e, -1)}
        className="size-6 rounded-md [&>svg]:size-3"
        aria-label="Riduci giacenza"
      >
        <Minus />
      </Button>
      <StockBadge stock_quantity={localQty} min_threshold={minThreshold} />
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        onClick={(e) => adjust(e, +1)}
        className="size-6 rounded-md [&>svg]:size-3"
        aria-label="Aumenta giacenza"
      >
        <Plus />
      </Button>
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
      meta: { requiredVisible: true, pinned: 'start' },
      header: ({ table }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            size="sm"
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            aria-label="Seleziona tutti"
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
          />
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ getValue }) => (
        <span className={cellStrongClass}>{getValue() as string}</span>
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
      cell: ({ row }) => <ProductCategoryBadge category_id={row.original.product_category_id} />,
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
          <span className="text-[var(--lume-text-secondary)]">Vendita</span>
        ) : (
          <span className="text-[var(--lume-text-muted)]">Uso interno</span>
        );
      },
      meta: { pickerLabel: 'Vendita' },
    },
    {
      accessorKey: 'price',
      header: () => <span className="block w-full text-right">Prezzo Acquisto</span>,
      cell: ({ getValue }) => (
        <span className={`block text-right ${cellNumClass}`}>{formatCurrency(Number(getValue() as number))}</span>
      ),
      meta: { pickerLabel: 'Prezzo Acquisto' },
    },
    {
      accessorKey: 'sell_price',
      header: () => <span className="block w-full text-right">Prezzo Vendita</span>,
      cell: ({ getValue }) => {
        const v = getValue() as number | null;
        return <span className={`block text-right ${cellNumClass}`}>{v != null ? formatCurrency(v) : '—'}</span>;
      },
      meta: { pickerLabel: 'Prezzo Vendita' },
    },
    {
      id: 'margine',
      header: () => <span className="block w-full text-right">Margine</span>,
      cell: ({ row }) => {
        const { sell_price, price, is_for_retail } = row.original;
        if (!is_for_retail || sell_price == null || price == null) {
          return <span className="block text-right text-[var(--lume-text-muted)]">—</span>;
        }
        const margin = sell_price - price;
        return (
          <span className={`block text-right ${cellNumClass} ${margin >= 0 ? 'text-success-strong' : 'text-danger-strong'}`}>
            {margin >= 0 ? '+' : ''}{formatCurrency(margin)}
          </span>
        );
      },
      meta: { pickerLabel: 'Margine' },
    },
    {
      accessorKey: 'total_purchased',
      header: () => <span className="block w-full text-right">Acquistati</span>,
      cell: ({ getValue }) => (
        <span className={`block text-right ${cellNumClass}`}>{getValue() as number}</span>
      ),
      meta: { pickerLabel: 'Acquistati' },
    },
    {
      accessorKey: 'total_sold',
      header: () => <span className="block w-full text-right">Venduti</span>,
      cell: ({ getValue }) => (
        <span className={`block text-right ${cellNumClass}`}>{getValue() as number}</span>
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
        <span className={`block text-right ${cellNumClass}`}>{(getValue() as number) ?? 0}</span>
      ),
      meta: { pickerLabel: 'Soglia Min.' },
    },
  ], [manufacturers, categories, suppliers]);

  const { columnVisibility, columnOrder, setColumnVisibility, setColumnOrder } =
    useTableColumnPrefs('products', columns);

  const exportColumns: ExportColumn<Product>[] = useMemo(
    () => [
      { label: 'Nome', accessor: (p) => p.name },
      { label: 'Categoria', accessor: (p) => categories.find((c) => c.id === p.product_category_id)?.name ?? '' },
      { label: 'Marchio', accessor: (p) => manufacturers.find((m) => m.id === p.manufacturer_id)?.name ?? '' },
      { label: 'Fornitore', accessor: (p) => suppliers.find((s) => s.id === p.supplier_id)?.name ?? '' },
      { label: 'Prezzo acquisto (€)', accessor: (p) => p.price },
      { label: 'Prezzo vendita (€)', accessor: (p) => p.sell_price ?? '' },
      { label: 'Giacenza', accessor: (p) => p.stock_quantity },
    ],
    [categories, manufacturers, suppliers],
  );

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
            <span className="text-sm font-medium text-[var(--lume-text)]">
              {selectedIds.length} {selectedIds.length === 1 ? 'selezionato' : 'selezionati'}
            </span>
            <span className="text-[var(--lume-text-muted)]">·</span>

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
              className="w-36"
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
              className="w-36"
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
              className="w-36"
            />

            {showArchived ? (
              <Button
                variant="secondary"
                leadingIcon={ArchiveRestore}
                onClick={() => setBulkRestoreConfirm(true)}
                disabled={bulkLoading}
              >
                Ripristina
              </Button>
            ) : (
              <Button
                variant="secondary"
                leadingIcon={ArchiveRestore}
                onClick={() => setBulkArchiveConfirm(true)}
                disabled={bulkLoading}
              >
                Archivia
              </Button>
            )}

            <Button
              variant="ghost-destructive"
              leadingIcon={Trash2}
              onClick={() => setBulkDeleteConfirm(true)}
              disabled={bulkLoading}
            >
              Elimina
            </Button>

            <Button variant="ghost" leadingIcon={X} onClick={() => setRowSelection({})} className="ml-auto">
              Annulla
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <Searchbar placeholder="Cerca prodotto..." value={globalFilter} onChange={setGlobalFilter} bindShortcut={false} className="flex-1 basis-full sm:basis-auto sm:max-w-sm" />

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

            <div className="ml-auto flex items-center gap-2">
              <ExportMenu
                rows={filteredData}
                columns={exportColumns}
                baseName={showArchived ? 'prodotti-archiviati' : 'prodotti'}
                pdfTitle={showArchived ? 'Prodotti archiviati' : 'Inventario prodotti'}
              />
              <ColumnPicker tableId="products" columns={columns} />
            </div>
          </div>
        )}

        {/* Table */}
        <div ref={tableCardRef} className="flex-1 min-h-0 w-full">
          <div className={`max-h-full w-full overflow-x-auto overflow-y-hidden ${tableCardClass}`}>
          <table className={tableClass}>
            <thead className={theadClass}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
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
                          thClass({ sortable: canSort, align: isNumeric ? 'right' : 'left' }),
                          isSelect ? 'w-10' : '',
                        ].join(' ')}
                      >
                        <span className={['inline-flex items-center gap-1', isNumeric ? 'flex-row-reverse' : ''].join(' ')}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && <SortIndicator direction={sorted} />}
                        </span>
                      </th>
                    );
                  })}
                  <th className={`${thClass({ align: 'right' })} w-20`}>
                    Azioni
                  </th>
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length + 1} className={tableMessageClass}>
                    Caricando prodotti...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className={tableMessageClass}>
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
                    className={`group ${trClass({ selected: row.getIsSelected() })}`}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isNumeric = numericColumns.has(cell.column.id);
                      return (
                        <td
                          key={cell.id}
                          className={[tdClass, isNumeric ? 'text-right' : ''].join(' ')}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                    <td className={tdClass}>
                      <div className="flex flex-row items-center justify-end gap-1">
                        {showArchived ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            iconOnly
                            aria-label="Ripristina"
                            onClick={(e) => handleRestore(e, row.original)}
                          >
                            <ArchiveRestore />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost-destructive"
                            size="sm"
                            iconOnly
                            aria-label="Elimina"
                            onClick={(e) => handleDeleteClick(e, row.original)}
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

      <ConfirmDialog
        isOpen={bulkArchiveConfirm}
        onClose={() => setBulkArchiveConfirm(false)}
        tone="default"
        title={`Archivia ${selectedIds.length} ${selectedIds.length === 1 ? 'prodotto' : 'prodotti'}?`}
        description="I prodotti archiviati non saranno visibili nella lista principale."
        confirmLabel="Archivia"
        onConfirm={async () => {
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
      />

      <ConfirmDialog
        isOpen={bulkRestoreConfirm}
        onClose={() => setBulkRestoreConfirm(false)}
        tone="default"
        title={`Ripristina ${selectedIds.length} ${selectedIds.length === 1 ? 'prodotto' : 'prodotti'}?`}
        description="I prodotti torneranno visibili nella lista principale."
        confirmLabel="Ripristina"
        onConfirm={async () => {
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
      />

      <DeleteAllModal
        isOpen={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        entityLabel="prodotti"
        count={selectedIds.length}
        mode="selected"
        cascadeNotice={
          <>
            Verranno rimossi anche dagli ordini, dalle fiche e dai servizi che li utilizzano.
            Lo storico dei prezzi e dei movimenti di magazzino andrà perso.
          </>
        }
        onConfirm={async () => {
          await bulkDeleteProducts(selectedIds);
          setRowSelection({});
        }}
      />
    </>
  );
}
