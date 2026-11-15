'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { X, Trash2, ArchiveRestore } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useServicesStore } from '@/lib/stores/services';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
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
import { Checkbox } from '@/lib/components/shared/ui/forms/Checkbox';
import { Select } from '@/lib/components/shared/ui/forms/Select';
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
import { DeleteAllModal } from '@/lib/components/shared/ui/modals/DeleteAllModal';
import { Searchbar } from '@/lib/components/shared/ui/Searchbar';
import { formatCurrency } from '@/lib/utils/format';

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

  // Reset pagination when filters change
  useEffect(() => {
    setPageIndex(0);
  }, [globalFilter, selectedCategories]);

  const filteredData = useMemo(() => {
    let data = services;

    if (selectedCategories.length > 0) {
      data = data.filter((s) => s.category_id !== null && selectedCategories.includes(s.category_id));
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
          <span className={cellStrongClass}>{getValue() as string}</span>
        ),
        meta: { requiredVisible: true },
      },
      {
        accessorKey: 'duration',
        header: () => <span className="block w-full text-right">Durata</span>,
        cell: ({ getValue }) => (
          <span className={`block text-right ${cellNumClass}`}>{getValue() as number} min</span>
        ),
        meta: { pickerLabel: 'Durata' },
      },
      {
        accessorKey: 'price',
        header: () => <span className="block w-full text-right">Prezzo</span>,
        cell: ({ getValue }) => (
          <span className={`block text-right ${cellNumClass}`}>{formatCurrency(getValue() as number)}</span>
        ),
        meta: { pickerLabel: 'Prezzo' },
      },
      {
        accessorKey: 'product_cost',
        header: () => <span className="block w-full text-right">Costo prodotti</span>,
        cell: ({ getValue }) => (
          <span className={`block text-right ${cellNumClass}`}>{formatCurrency(getValue() as number)}</span>
        ),
        meta: { pickerLabel: 'Costo prodotti' },
      },
      {
        id: 'usage_count',
        accessorFn: (row) => usageCounts?.get(row.id) ?? 0,
        header: () => <span className="block w-full text-right">Esecuzioni</span>,
        cell: ({ getValue }) => (
          <span className={`block text-right ${cellNumClass}`}>{getValue() as number}</span>
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

  const handleRestore = async (service: Service) => {
    try {
      await restoreService(service.id);
      messagePopup.getState().success('Servizio ripristinato con successo.');
    } catch {
      messagePopup.getState().error('Errore durante il ripristino.');
    }
  };

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  const numericColumns = new Set(['duration', 'price', 'product_cost', 'usage_count']);

  return (
    <>
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
            <Searchbar placeholder="Cerca servizio..." value={globalFilter} onChange={setGlobalFilter} bindShortcut={false} className="flex-1 basis-full sm:basis-auto sm:max-w-sm" />

            <FacetedFilter
              label="Categoria"
              options={categoryOptions}
              selected={selectedCategories}
              onChange={setSelectedCategories}
            />

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
                  <td
                    colSpan={columns.length + 1}
                    className={tableMessageClass}
                  >
                    Caricando servizi...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className={tableMessageClass}
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
                    className={trClass({ selected: row.getIsSelected() })}
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
                            onClick={(e) => { e.stopPropagation(); handleRestore(row.original); }}
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
          labelPlural="servizi"
        />
      </div>

      <DeleteServiceModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        selectedService={selectedService}
      />

      <ConfirmDialog
        isOpen={bulkArchiveConfirm}
        onClose={() => setBulkArchiveConfirm(false)}
        tone="default"
        title={`Archivia ${selectedIds.length} ${selectedIds.length === 1 ? 'servizio' : 'servizi'}?`}
        description="I servizi archiviati non saranno visibili nella lista principale."
        confirmLabel="Archivia"
        onConfirm={async () => {
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
      />

      <ConfirmDialog
        isOpen={bulkRestoreConfirm}
        onClose={() => setBulkRestoreConfirm(false)}
        tone="default"
        title={`Ripristina ${selectedIds.length} ${selectedIds.length === 1 ? 'servizio' : 'servizi'}?`}
        description="I servizi torneranno visibili nella lista principale."
        confirmLabel="Ripristina"
        onConfirm={async () => {
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
      />

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
