'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { Trash2, Factory, Plus, ArrowDownToLine, Pencil } from 'lucide-react';
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
import { Searchbar } from '@/lib/components/shared/ui/Searchbar';
import { DeleteModal } from '@/lib/components/shared/ui/modals/DeleteModal';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useManufacturersStore } from '@/lib/stores/manufacturers';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { ConciergeImportModal } from '@/lib/components/shared/ui/ConciergeImportModal';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
import { Button } from '@/lib/components/shared/ui/Button';
import { Manufacturer } from '@/lib/types/Manufacturer';
import { AddMarchioModal } from './AddMarchioModal';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { ColumnPicker } from '@/lib/components/admin/table/ColumnPicker';
import { ExportMenu } from '@/lib/components/shared/ui/ExportMenu';
import type { ExportColumn } from '@/lib/utils/tableExport';
import { useTableColumnPrefs } from '@/lib/hooks/useTableColumnPrefs';
import { useFitPageSize } from '@/lib/hooks/useFitPageSize';

interface MarchiTabProps {
  addTrigger?: number;
}

export function MarchiTab({ addTrigger }: MarchiTabProps) {
  const manufacturers = useManufacturersStore((s) => s.manufacturers);
  const isLoading = useManufacturersStore((s) => s.isLoading);
  const deleteManufacturer = useManufacturersStore((s) => s.deleteManufacturer);

  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState<Manufacturer | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [globalFilter, setGlobalFilter] = useState('');

  const { ref: tableCardRef, pageSize } = useFitPageSize<HTMLDivElement>({ rowPx: 41 });

  useEffect(() => {
    if (!addTrigger) return;
    setSelected(null);
    setShowAdd(true);
  }, [addTrigger]);

  useEffect(() => {
    setPageIndex(0);
  }, [globalFilter]);

  const filteredManufacturers = useMemo(() => {
    if (!globalFilter.trim()) return manufacturers;
    const q = globalFilter.toLowerCase();
    return manufacturers.filter((m) => m.name.toLowerCase().includes(q));
  }, [manufacturers, globalFilter]);

  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(filteredManufacturers.length / pageSize) - 1);
    if (pageIndex > lastPage) setPageIndex(lastPage);
  }, [pageSize, filteredManufacturers.length, pageIndex]);

  const columns = useMemo<ColumnDef<Manufacturer>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nome',
        cell: ({ getValue }) => (
          <span className={cellStrongClass}>{getValue() as string}</span>
        ),
        meta: { requiredVisible: true },
      },
    ],
    []
  );

  const { columnVisibility, columnOrder, setColumnVisibility, setColumnOrder } =
    useTableColumnPrefs('brands', columns);

  const exportColumns: ExportColumn<Manufacturer>[] = useMemo(
    () => [{ label: 'Nome', accessor: (m) => m.name }],
    [],
  );

  const table = useReactTable({
    data: filteredManufacturers,
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

  const handleEditClick = (e: React.MouseEvent, item: Manufacturer) => {
    e.stopPropagation();
    setSelected(item);
    setShowAdd(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, item: Manufacturer) => {
    e.stopPropagation();
    setSelected(item);
    setShowDelete(true);
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await deleteManufacturer(selected.id);
      messagePopup.getState().success('Marchio eliminato.');
      setShowDelete(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error(msg);
    }
  };

  return (
    <>
      <AddMarchioModal
        isOpen={showAdd}
        onClose={() => { setShowAdd(false); setSelected(null); }}
        selectedManufacturer={selected}
      />
      <ConciergeImportModal isOpen={showImport} onClose={() => setShowImport(false)} />
      <DeleteModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Elimina Marchio"
      >
        <p className="text-[var(--lume-text-secondary)]">
          Sei sicuro di voler eliminare il marchio{' '}
          <strong className="text-[var(--lume-text)]">{selected?.name}</strong>?
        </p>
      </DeleteModal>

      {isLoading ? (
        <TableSkeleton />
      ) : manufacturers.length === 0 ? (
        <EmptyState
          icon={Factory}
          title="Nessun marchio trovato"
          description="Aggiungi il tuo primo marchio per classificare i prodotti per brand."
          secondaryAction={{ label: 'Importa dati', icon: ArrowDownToLine, onClick: () => setShowImport(true) }}
          action={{ label: 'Nuovo marchio', icon: Plus, onClick: () => { setSelected(null); setShowAdd(true); } }}
        />
      ) : (
        <div className="flex-1 min-h-0 flex flex-col gap-4 w-full">
          <div className="flex items-center gap-2 flex-wrap">
            <Searchbar
              className="flex-1 max-w-sm"
              placeholder="Cerca marchio..."
              value={globalFilter}
              onChange={setGlobalFilter}
            />
            <div className="ml-auto flex items-center gap-2">
              <ExportMenu
                rows={filteredManufacturers}
                columns={exportColumns}
                baseName="marchi"
                pdfTitle="Marchi"
              />
              <ColumnPicker tableId="brands" columns={columns} />
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
                      return (
                        <th
                          key={header.id}
                          onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                          className={thClass({ sortable: canSort })}
                        >
                          <span className="inline-flex items-center gap-1">
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
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className={tableMessageClass}>
                      Nessun marchio trovato.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className={trClass({ interactive: false })}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className={tdClass}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                      <td className={tdClass}>
                        <div className="flex flex-row items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            iconOnly
                            aria-label="Modifica"
                            onClick={(e) => handleEditClick(e, row.original)}
                          >
                            <Pencil />
                          </Button>
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
            totalItems={filteredManufacturers.length}
            itemsPerPage={pageSize}
            labelPlural="marchi"
          />
        </div>
      )}
    </>
  );
}
