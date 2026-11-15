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
import { Trash2, Truck, Plus, ArrowDownToLine, Pencil } from 'lucide-react';
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
import { useSuppliersStore } from '@/lib/stores/suppliers';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { ConciergeImportModal } from '@/lib/components/shared/ui/ConciergeImportModal';
import { Button } from '@/lib/components/shared/ui/Button';
import { Supplier } from '@/lib/types/Supplier';
import { AddFornitoreModal } from './AddFornitoreModal';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { ColumnPicker } from '@/lib/components/admin/table/ColumnPicker';
import { ExportMenu } from '@/lib/components/shared/ui/ExportMenu';
import type { ExportColumn } from '@/lib/utils/tableExport';
import { useTableColumnPrefs } from '@/lib/hooks/useTableColumnPrefs';
import { useFitPageSize } from '@/lib/hooks/useFitPageSize';

interface FornitoriTabProps {
  addTrigger?: number;
}

export function FornitoriTab({ addTrigger }: FornitoriTabProps) {
  const suppliers = useSuppliersStore((s) => s.suppliers);
  const isLoading = useSuppliersStore((s) => s.isLoading);
  const deleteSupplier = useSuppliersStore((s) => s.deleteSupplier);

  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState<Supplier | null>(null);
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

  const filteredSuppliers = useMemo(() => {
    if (!globalFilter.trim()) return suppliers;
    const q = globalFilter.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.city ?? '').toLowerCase().includes(q) ||
        (s.phone ?? '').toLowerCase().includes(q) ||
        (s.email ?? '').toLowerCase().includes(q)
    );
  }, [suppliers, globalFilter]);

  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(filteredSuppliers.length / pageSize) - 1);
    if (pageIndex > lastPage) setPageIndex(lastPage);
  }, [pageSize, filteredSuppliers.length, pageIndex]);

  const columns = useMemo<ColumnDef<Supplier>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nome',
        cell: ({ getValue }) => (
          <span className={cellStrongClass}>{getValue() as string}</span>
        ),
        meta: { requiredVisible: true },
      },
      {
        accessorKey: 'city',
        header: 'Città',
        cell: ({ getValue }) => (
          <span>{(getValue() as string | null) ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Telefono',
        enableSorting: false,
        cell: ({ getValue }) => (
          <span>{(getValue() as string | null) ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ getValue }) => (
          <span>{(getValue() as string | null) ?? '—'}</span>
        ),
      },
    ],
    []
  );

  const { columnVisibility, columnOrder, setColumnVisibility, setColumnOrder } =
    useTableColumnPrefs('suppliers', columns);

  const exportColumns: ExportColumn<Supplier>[] = useMemo(
    () => [
      { label: 'Nome', accessor: (s) => s.name },
      { label: 'Città', accessor: (s) => s.city },
      { label: 'Telefono', accessor: (s) => s.phone },
      { label: 'Email', accessor: (s) => s.email },
    ],
    [],
  );

  const table = useReactTable({
    data: filteredSuppliers,
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

  const handleEditClick = (e: React.MouseEvent, item: Supplier) => {
    e.stopPropagation();
    setSelected(item);
    setShowAdd(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, item: Supplier) => {
    e.stopPropagation();
    setSelected(item);
    setShowDelete(true);
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await deleteSupplier(selected.id);
      messagePopup.getState().success('Fornitore eliminato.');
      setShowDelete(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error(msg);
    }
  };

  return (
    <>
      <AddFornitoreModal
        isOpen={showAdd}
        onClose={() => { setShowAdd(false); setSelected(null); }}
        selectedSupplier={selected}
      />
      <ConciergeImportModal isOpen={showImport} onClose={() => setShowImport(false)} />
      <DeleteModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Elimina Fornitore"
      >
        <p className="text-[var(--lume-text-secondary)]">
          Sei sicuro di voler eliminare il fornitore{' '}
          <strong className="text-[var(--lume-text)]">{selected?.name}</strong>?
        </p>
      </DeleteModal>

      {!isLoading && suppliers.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Nessun fornitore trovato"
          description="Aggiungi il tuo primo fornitore per gestire gli approvvigionamenti."
          secondaryAction={{ label: 'Importa dati', icon: ArrowDownToLine, onClick: () => setShowImport(true) }}
          action={{ label: 'Nuovo fornitore', icon: Plus, onClick: () => { setSelected(null); setShowAdd(true); } }}
        />
      ) : (
        <div className="flex-1 min-h-0 flex flex-col gap-4 w-full">
          <div className="flex items-center gap-2 flex-wrap">
            <Searchbar
              className="flex-1 max-w-sm"
              placeholder="Cerca fornitore..."
              value={globalFilter}
              onChange={setGlobalFilter}
            />
            <div className="ml-auto flex items-center gap-2">
              <ExportMenu
                rows={filteredSuppliers}
                columns={exportColumns}
                baseName="fornitori"
                pdfTitle="Fornitori"
              />
              <ColumnPicker tableId="suppliers" columns={columns} />
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
                {isLoading ? (
                  <tr>
                    <td colSpan={columns.length + 1} className={tableMessageClass}>
                      Caricando fornitori...
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className={tableMessageClass}>
                      Nessun fornitore trovato.
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
            totalItems={filteredSuppliers.length}
            itemsPerPage={pageSize}
            labelPlural="fornitori"
          />
        </div>
      )}
    </>
  );
}
