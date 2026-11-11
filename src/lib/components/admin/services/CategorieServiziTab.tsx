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
} from '@tanstack/react-table';
import { Pencil, Trash2, ArchiveRestore } from 'lucide-react';
import {
  tableCardClass,
  tableClass,
  theadClass,
  thClass,
  trClass,
  tdClass,
  cellStrongClass,
  tableMessageClass,
  SortIndicator,
} from '@/lib/components/shared/ui/table/tableStyles';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { Button } from '@/lib/components/shared/ui/Button';
import { Searchbar } from '@/lib/components/shared/ui/Searchbar';
import { AddServiceCategoryModal } from './AddServiceCategoryModal';
import { DeleteCategoryModal } from './DeleteCategoryModal';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { ColumnPicker } from '@/lib/components/admin/table/ColumnPicker';
import { ExportMenu } from '@/lib/components/shared/ui/ExportMenu';
import type { ExportColumn } from '@/lib/utils/tableExport';
import { useTableColumnPrefs } from '@/lib/hooks/useTableColumnPrefs';
import { useFitPageSize } from '@/lib/hooks/useFitPageSize';
import type { ServiceCategory } from '@/lib/types/ServiceCategory';

function ColorNameCell({ color, name }: { color: string; name: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className={cellStrongClass}>{name}</span>
    </div>
  );
}

interface CategorieServiziTabProps {
  categories?: ServiceCategory[];
  showArchived?: boolean;
}

export function CategorieServiziTab({ categories: categoriesProp, showArchived = false }: CategorieServiziTabProps = {}) {
  const storeCategories = useServiceCategoriesStore((s) => s.service_categories);
  const isLoading = useServiceCategoriesStore((s) => s.isLoading);
  const restoreCategory = useServiceCategoriesStore((s) => s.restoreServiceCategory);
  const categories = categoriesProp ?? storeCategories;

  const [showAdd, setShowAdd] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState<ServiceCategory | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [globalFilter, setGlobalFilter] = useState('');

  const { ref: tableCardRef, pageSize } = useFitPageSize<HTMLDivElement>({ rowPx: 41 });

  useEffect(() => {
    setPageIndex(0);
  }, [globalFilter]);

  const filteredCategories = useMemo(() => {
    if (!globalFilter.trim()) return categories;
    const q = globalFilter.toLowerCase();
    return categories.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q)
    );
  }, [categories, globalFilter]);

  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(filteredCategories.length / pageSize) - 1);
    if (pageIndex > lastPage) setPageIndex(lastPage);
  }, [pageSize, filteredCategories.length, pageIndex]);

  const columns = useMemo<ColumnDef<ServiceCategory>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nome',
        cell: ({ row }) => <ColorNameCell color={row.original.color} name={row.original.name} />,
        meta: { requiredVisible: true },
      },
      {
        accessorKey: 'description',
        header: 'Descrizione',
        cell: ({ getValue }) => (
          <span className="text-[var(--lume-text-secondary)]">{(getValue() as string) || '—'}</span>
        ),
      },
      {
        accessorKey: 'service_count',
        header: () => <span className="block w-full text-right">Servizi</span>,
        cell: ({ getValue }) => (
          <span className="block text-right tabular-nums text-compact">{(getValue() as number) ?? 0}</span>
        ),
        meta: { pickerLabel: 'Servizi' },
      },
    ],
    []
  );

  const { columnVisibility, columnOrder, setColumnVisibility, setColumnOrder } =
    useTableColumnPrefs('service-categories', columns);

  const exportColumns: ExportColumn<ServiceCategory>[] = useMemo(
    () => [
      { label: 'Nome', accessor: (c) => c.name },
      { label: 'Descrizione', accessor: (c) => c.description },
      { label: 'Colore', accessor: (c) => c.color },
      { label: 'Servizi', accessor: (c) => c.service_count ?? 0 },
    ],
    [],
  );

  const table = useReactTable({
    data: filteredCategories,
    columns,
    state: {
      sorting,
      pagination: { pageIndex, pageSize },
      columnVisibility,
      columnOrder,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater;
      setPageIndex(next.pageIndex);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualFiltering: true,
  });

  const handleEditClick = (e: React.MouseEvent, item: ServiceCategory) => {
    e.stopPropagation();
    setSelected(item);
    setShowAdd(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, item: ServiceCategory) => {
    e.stopPropagation();
    setSelected(item);
    setShowDelete(true);
  };

  const handleRestore = async (e: React.MouseEvent, item: ServiceCategory) => {
    e.stopPropagation();
    try {
      await restoreCategory(item.id);
      messagePopup.getState().success('Categoria ripristinata con successo.');
    } catch {
      messagePopup.getState().error('Errore durante il ripristino.');
    }
  };

  return (
    <>
      <AddServiceCategoryModal
        isOpen={showAdd}
        onClose={() => { setShowAdd(false); setSelected(null); }}
        selectedCategory={selected}
      />
      <DeleteCategoryModal
        isOpen={showDelete}
        onClose={() => { setShowDelete(false); setSelected(null); }}
        category={selected}
      />

      <div className="flex-1 min-h-0 flex flex-col gap-4 w-full">
        <div className="flex items-center gap-2 flex-wrap">
          <Searchbar
            className="flex-1 max-w-sm"
            placeholder="Cerca categoria..."
            value={globalFilter}
            onChange={setGlobalFilter}
          />
          <div className="ml-auto flex items-center gap-2">
            <ExportMenu
              rows={filteredCategories}
              columns={exportColumns}
              baseName={showArchived ? 'categorie-servizi-archiviate' : 'categorie-servizi'}
              pdfTitle={showArchived ? 'Categorie servizi archiviate' : 'Categorie servizi'}
            />
            <ColumnPicker tableId="service-categories" columns={columns} />
          </div>
        </div>

        <div ref={tableCardRef} className="flex-1 min-h-0 w-full">
          <div className={`max-h-full w-full overflow-x-auto overflow-y-hidden ${tableCardClass}`}>
          <table className={tableClass}>
            <thead className={theadClass}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    const isNumeric = header.column.id === 'service_count';
                    return (
                      <th
                        key={header.id}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        className={thClass({ sortable: canSort, align: isNumeric ? 'right' : 'left' })}
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
                    Caricando categorie...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className={tableMessageClass}>
                    Nessuna categoria trovata.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={trClass({ interactive: false })}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isNumeric = cell.column.id === 'service_count';
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
                            variant="ghost"
                            size="sm"
                            iconOnly
                            aria-label="Modifica"
                            onClick={(e) => handleEditClick(e, row.original)}
                          >
                            <Pencil />
                          </Button>
                        )}
                        <Button
                          variant="ghost-destructive"
                          size="sm"
                          iconOnly
                          aria-label="Elimina"
                          onClick={(e) => handleDeleteClick(e, row.original)}
                        >
                          <Trash2 />
                        </Button>
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
          totalItems={filteredCategories.length}
          itemsPerPage={pageSize}
          labelPlural="categorie"
        />
      </div>
    </>
  );
}
