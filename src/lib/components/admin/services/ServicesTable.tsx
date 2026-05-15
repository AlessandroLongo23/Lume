'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
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
import { Search, X, ChevronUp, ChevronDown, SlidersHorizontal, Check, Trash2, ArchiveRestore } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useServicesStore } from '@/lib/stores/services';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { NumberBadge } from '@/lib/components/shared/ui/NumberBadge';
import { Button } from '@/lib/components/shared/ui/Button';
import { Service } from '@/lib/types/Service';
import { CategoryBadge } from './CategoryBadge';
import { DeleteServiceModal } from './DeleteServiceModal';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { ColumnPicker } from '@/lib/components/admin/table/ColumnPicker';
import { ExportMenu } from '@/lib/components/shared/ui/ExportMenu';
import type { ExportColumn } from '@/lib/utils/tableExport';
import { useTableColumnPrefs } from '@/lib/hooks/useTableColumnPrefs';
import { useFitPageSize } from '@/lib/hooks/useFitPageSize';
import { cardStyle } from '@/lib/const/appearance';
import { Checkbox } from '@/lib/components/shared/ui/forms/Checkbox';
import { Select } from '@/lib/components/shared/ui/forms/Select';
import { Portal } from '@/lib/components/shared/ui/Portal';
import { DeleteAllModal } from '@/lib/components/shared/ui/modals/DeleteAllModal';

interface ServicesTableProps {
  services: Service[];
  showArchived?: boolean;
  usageCounts?: Map<string, number>;
}

export function ServicesTable({ services, showArchived = false, usageCounts }: ServicesTableProps) {
  const router = useRouter();
  const isLoading = useServicesStore((s) => s.isLoading);
  const restoreService = useServicesStore((s) => s.restoreService);
  const bulkUpdateServices = useServicesStore((s) => s.bulkUpdateServices);
  const bulkArchiveServices = useServicesStore((s) => s.bulkArchiveServices);
  const bulkRestoreServices = useServicesStore((s) => s.bulkRestoreServices);
  const bulkDeleteServices = useServicesStore((s) => s.bulkDeleteServices);
  const categories = useServiceCategoriesStore((s) => s.service_categories);

  const [showDelete, setShowDelete] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkArchiveConfirm, setBulkArchiveConfirm] = useState(false);
  const [bulkRestoreConfirm, setBulkRestoreConfirm] = useState(false);

  const selectedIds = Object.keys(rowSelection);
  const hasSelection = selectedIds.length > 0;

  const dropdownRef = useRef<HTMLDivElement>(null);

  const { ref: tableCardRef, pageSize } = useFitPageSize<HTMLDivElement>({ rowPx: 41 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setPageIndex(0);
  }, [globalFilter, selectedCategories]);

  const filteredData = useMemo(() => {
    let data = services;

    if (selectedCategories.length > 0) {
      data = data.filter((s) => selectedCategories.includes(s.category_id));
    }

    if (globalFilter.trim()) {
      const q = globalFilter.toLowerCase();
      data = data.filter((s) => {
        const cat = categories.find((c) => c.id === s.category_id);
        return (
          s.name.toLowerCase().includes(q) ||
          (cat?.name ?? '').toLowerCase().includes(q)
        );
      });
    }

    return data;
  }, [services, selectedCategories, globalFilter, categories]);

  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(filteredData.length / pageSize) - 1);
    if (pageIndex > lastPage) setPageIndex(lastPage);
  }, [pageSize, filteredData.length, pageIndex]);

  const columns = useMemo<ColumnDef<Service>[]>(
    () => [
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
        accessorKey: 'category_id',
        header: 'Categoria',
        cell: ({ row }) => <CategoryBadge category_id={row.original.category_id} />,
        sortingFn: (a, b) => {
          const catA = categories.find((c) => c.id === a.original.category_id)?.name ?? '';
          const catB = categories.find((c) => c.id === b.original.category_id)?.name ?? '';
          return catA.localeCompare(catB, 'it');
        },
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
        accessorKey: 'duration',
        header: () => <span className="block w-full text-right">Durata</span>,
        cell: ({ getValue }) => (
          <span className="block text-right tabular-nums">{getValue() as number} min</span>
        ),
        meta: { pickerLabel: 'Durata' },
      },
      {
        accessorKey: 'price',
        header: () => <span className="block w-full text-right">Prezzo</span>,
        cell: ({ getValue }) => (
          <span className="block text-right tabular-nums">{(getValue() as number).toFixed(2)} €</span>
        ),
        meta: { pickerLabel: 'Prezzo' },
      },
      {
        accessorKey: 'product_cost',
        header: () => <span className="block w-full text-right">Costo prodotti</span>,
        cell: ({ getValue }) => (
          <span className="block text-right tabular-nums">{(getValue() as number).toFixed(2)} €</span>
        ),
        meta: { pickerLabel: 'Costo prodotti' },
      },
      {
        id: 'usage_count',
        accessorFn: (row) => usageCounts?.get(row.id) ?? 0,
        header: () => <span className="block w-full text-right">Esecuzioni</span>,
        cell: ({ getValue }) => (
          <span className="block text-right tabular-nums">{getValue() as number}</span>
        ),
        meta: { pickerLabel: 'Esecuzioni' },
      },
    ],
    [categories, usageCounts]
  );

  const { columnVisibility, columnOrder, setColumnVisibility, setColumnOrder } =
    useTableColumnPrefs('services', columns);

  const exportColumns: ExportColumn<Service>[] = useMemo(
    () => [
      { label: 'Nome', accessor: (s) => s.name },
      { label: 'Categoria', accessor: (s) => categories.find((c) => c.id === s.category_id)?.name ?? '' },
      { label: 'Durata (min)', accessor: (s) => s.duration },
      { label: 'Prezzo (€)', accessor: (s) => s.price },
      { label: 'Costo prodotti (€)', accessor: (s) => s.product_cost },
      { label: 'Margine (€)', accessor: (s) => s.price - s.product_cost },
      { label: 'Esecuzioni', accessor: (s) => usageCounts?.get(s.id) ?? 0 },
      { label: 'Descrizione', accessor: (s) => s.description },
    ],
    [categories, usageCounts],
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

  const handleDeleteClick = (e: React.MouseEvent, service: Service) => {
    e.stopPropagation();
    setSelectedService(service);
    setShowDelete(true);
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleRestore = async (service: Service) => {
    try {
      await restoreService(service.id);
      messagePopup.getState().success('Servizio ripristinato con successo.');
    } catch {
      messagePopup.getState().error('Errore durante il ripristino.');
    }
  };

  const numericColumns = new Set(['duration', 'price', 'product_cost', 'usage_count']);

  return (
    <>
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
                bulkUpdateServices(selectedIds, { category_id: v })
                  .then(() => {
                    messagePopup.getState().success(`Categoria aggiornata per ${selectedIds.length} servizi`);
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
              size="md"
              width="w-36"
            />

            {showArchived ? (
              <button
                onClick={() => setBulkRestoreConfirm(true)}
                disabled={bulkLoading}
                className="inline-flex items-center h-[var(--lume-control-h-md)] gap-[var(--lume-control-gap-md)] px-[var(--lume-control-px-md)] text-[length:var(--lume-control-text-md)] rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                <ArchiveRestore className="size-4" />
                Ripristina
              </button>
            ) : (
              <button
                onClick={() => setBulkArchiveConfirm(true)}
                disabled={bulkLoading}
                className="inline-flex items-center h-[var(--lume-control-h-md)] gap-[var(--lume-control-gap-md)] px-[var(--lume-control-px-md)] text-[length:var(--lume-control-text-md)] rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                <ArchiveRestore className="size-4" />
                Archivia
              </button>
            )}

            <button
              onClick={() => setBulkDeleteConfirm(true)}
              disabled={bulkLoading}
              className="inline-flex items-center h-[var(--lume-control-h-md)] gap-[var(--lume-control-gap-md)] px-[var(--lume-control-px-md)] text-[length:var(--lume-control-text-md)] rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              <Trash2 className="size-4" />
              Elimina
            </button>

            <button
              onClick={() => setRowSelection({})}
              className="ml-auto inline-flex items-center h-[var(--lume-control-h-md)] gap-[var(--lume-control-gap-md)] px-[var(--lume-control-px-md)] text-[length:var(--lume-control-text-md)] rounded-lg text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <X className="size-4" />
              Annulla
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="relative flex items-center flex-1 max-w-sm">
              <Search className="absolute left-2.5 size-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cerca servizio..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full h-[var(--lume-control-h-md)] pl-9 pr-8 text-[length:var(--lume-control-text-md)] bg-transparent border rounded-lg
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
                  aria-label="Azzera ricerca"
                  onClick={() => setGlobalFilter('')}
                  className="absolute right-1"
                >
                  <X />
                </Button>
              )}
            </div>

            {/* Category faceted filter */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setCategoryDropdownOpen((o) => !o)}
                className={[
                  'inline-flex items-center rounded-lg border transition-colors',
                  'h-[var(--lume-control-h-md)] px-[var(--lume-control-px-md)]',
                  'gap-[var(--lume-control-gap-md)] text-[length:var(--lume-control-text-md)]',
                  selectedCategories.length > 0
                    ? 'bg-primary/10 border-primary/30 text-primary-hover dark:text-primary/70'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
                ].join(' ')}
              >
                <SlidersHorizontal className="size-4" />
                <span>Categoria</span>
                {selectedCategories.length > 0 && (
                  <NumberBadge value={selectedCategories.length} variant="solid" size="md" />
                )}
              </button>

              {categoryDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 z-dropdown w-52 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden">
                  <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Filtra per categoria
                    </span>
                  </div>
                  <div className="py-1 max-h-56 overflow-y-auto">
                    {categories.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-zinc-400">Nessuna categoria</p>
                    ) : (
                      categories.map((cat) => {
                        const checked = selectedCategories.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            onClick={() => toggleCategory(cat.id)}
                            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                          >
                            <span
                              className={[
                                'shrink-0 size-4 rounded border transition-colors flex items-center justify-center',
                                checked
                                  ? 'bg-primary border-primary'
                                  : 'border-zinc-300 dark:border-zinc-600',
                              ].join(' ')}
                            >
                              {checked && <Check className="size-3 text-white" />}
                            </span>
                            {cat.name}
                          </button>
                        );
                      })
                    )}
                  </div>
                  {selectedCategories.length > 0 && (
                    <div className="px-3 py-1.5 border-t border-zinc-100 dark:border-zinc-800">
                      <button
                        onClick={() => setSelectedCategories([])}
                        className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                      >
                        Azzera filtri
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <ExportMenu
                rows={filteredData}
                columns={exportColumns}
                baseName={showArchived ? 'servizi-archiviati' : 'servizi'}
                pdfTitle={showArchived ? 'Servizi archiviati' : 'Listino servizi'}
              />
              <ColumnPicker tableId="services" columns={columns} />
            </div>
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
                              <ChevronUp
                                className={`size-3 ${sorted === 'asc' ? 'text-primary' : 'text-zinc-300 dark:text-zinc-600'}`}
                              />
                              <ChevronDown
                                className={`size-3 -mt-1 ${sorted === 'desc' ? 'text-primary' : 'text-zinc-300 dark:text-zinc-600'}`}
                              />
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
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-10 text-center text-sm text-zinc-400"
                  >
                    Caricando servizi...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-10 text-center text-sm text-zinc-400"
                  >
                    Nessun servizio trovato.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button, a, [data-no-row-click]')) return;
                      if (hasSelection) { row.toggleSelected(); return; }
                      router.push(`/admin/servizi/${row.original.category_id}/${row.original.id}`);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target === e.currentTarget) {
                        router.push(`/admin/servizi/${row.original.category_id}/${row.original.id}`);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isNumeric = numericColumns.has(cell.column.id);
                      return (
                        <td
                          key={cell.id}
                          className={[
                            'px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 whitespace-nowrap',
                            isNumeric ? 'text-right' : '',
                          ].join(' ')}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex flex-row items-center justify-end gap-1">
                        {showArchived ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            iconOnly
                            aria-label="Ripristina"
                            title="Ripristina"
                            onClick={(e) => { e.stopPropagation(); handleRestore(row.original); }}
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
          labelPlural="servizi"
        />
      </div>

      <DeleteServiceModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        selectedService={selectedService}
      />

      {/* Bulk archive confirm */}
      {bulkArchiveConfirm && (
        <Portal>
          <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-full max-w-sm shadow-xl">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Archivia {selectedIds.length} {selectedIds.length === 1 ? 'servizio' : 'servizi'}?
              </h3>
              <p className="text-sm text-zinc-500 mb-6">
                I servizi archiviati non saranno visibili nella lista principale.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setBulkArchiveConfirm(false)}>Annulla</Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    setBulkArchiveConfirm(false);
                    setBulkLoading(true);
                    try {
                      await bulkArchiveServices(selectedIds);
                      messagePopup.getState().success(`${selectedIds.length} servizi archiviati`);
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
                Ripristina {selectedIds.length} {selectedIds.length === 1 ? 'servizio' : 'servizi'}?
              </h3>
              <p className="text-sm text-zinc-500 mb-6">
                I servizi torneranno visibili nella lista principale.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setBulkRestoreConfirm(false)}>Annulla</Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    setBulkRestoreConfirm(false);
                    setBulkLoading(true);
                    try {
                      await bulkRestoreServices(selectedIds);
                      messagePopup.getState().success(`${selectedIds.length} servizi ripristinati`);
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

      <DeleteAllModal
        isOpen={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        entityLabel="servizi"
        count={selectedIds.length}
        mode="selected"
        cascadeNotice={
          <>
            Verranno rimosse anche le fiche che contengono i servizi selezionati,
            insieme a tutti gli altri servizi al loro interno.
          </>
        }
        onConfirm={async () => {
          await bulkDeleteServices(selectedIds);
          setRowSelection({});
        }}
      />
    </>
  );
}
