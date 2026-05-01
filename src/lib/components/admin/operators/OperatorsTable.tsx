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
import { Search, X, ChevronUp, ChevronDown, Trash2, ArchiveRestore } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useOperatorsStore } from '@/lib/stores/operators';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { Operator } from '@/lib/types/Operator';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { ColumnPicker } from '@/lib/components/admin/table/ColumnPicker';
import { useTableColumnPrefs } from '@/lib/hooks/useTableColumnPrefs';
import { DeleteOperatorModal } from './DeleteOperatorModal';
import { cardStyle } from '@/lib/const/appearance';

interface OperatorsTableProps {
  operators: Operator[];
  showArchived?: boolean;
}

const PAGE_SIZE = 10;

export function OperatorsTable({ operators, showArchived = false }: OperatorsTableProps) {
  const router = useRouter();
  const isLoading = useOperatorsStore((s) => s.isLoading);
  const restoreOperator = useOperatorsStore((s) => s.restoreOperator);

  const [showDelete, setShowDelete] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);

  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => { setPageIndex(0); }, [globalFilter]);

  const filteredData = useMemo(() => {
    if (!globalFilter.trim()) return operators;
    const q = globalFilter.toLowerCase();
    return operators.filter((o) =>
      o.firstName.toLowerCase().includes(q) ||
      o.lastName.toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q)
    );
  }, [operators, globalFilter]);

  const columns = useMemo<ColumnDef<Operator>[]>(() => [
    {
      accessorKey: 'firstName',
      header: 'Nome',
      cell: ({ getValue }) => (
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{getValue() as string}</span>
      ),
      meta: { requiredVisible: true },
    },
    {
      accessorKey: 'lastName',
      header: 'Cognome',
      cell: ({ getValue }) => <span>{getValue() as string}</span>,
      meta: { requiredVisible: true },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span
          data-no-row-click
          className="cursor-pointer text-primary-hover dark:text-primary/70 hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            window.open(`mailto:${row.original.email}`, '_blank');
          }}
        >
          {row.original.email}
        </span>
      ),
    },
    {
      id: 'phone',
      header: 'Telefono',
      cell: ({ row }) => (
        <span
          data-no-row-click
          className="cursor-pointer hover:text-primary-hover dark:hover:text-primary/70 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            const phone = row.original.phonePrefix.concat(row.original.phoneNumber).replace(/[^0-9]/g, '');
            window.open(`https://wa.me/${phone}`, '_blank');
          }}
        >
          {row.original.phonePrefix} {row.original.phoneNumber}
        </span>
      ),
      enableSorting: false,
    },
  ], []);

  const { columnVisibility, columnOrder, setColumnVisibility, setColumnOrder } =
    useTableColumnPrefs('operators', columns);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, pagination: { pageIndex, pageSize: PAGE_SIZE }, columnVisibility, columnOrder },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater({ pageIndex, pageSize: PAGE_SIZE }) : updater;
      setPageIndex(next.pageIndex);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualFiltering: true,
  });

  const handleRestore = async (operator: Operator) => {
    try {
      await restoreOperator(operator.id);
      messagePopup.getState().success('Operatore ripristinato con successo.');
    } catch {
      messagePopup.getState().error('Errore durante il ripristino.');
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4 w-full">
        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center flex-1 max-w-sm">
            <Search className="absolute left-2.5 size-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cerca operatore..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full py-2 pl-9 pr-8 text-sm bg-transparent border rounded-lg
                border-zinc-200 dark:border-zinc-800
                focus:border-zinc-300 dark:focus:border-zinc-700
                text-zinc-900 dark:text-zinc-100
                placeholder:text-zinc-400 outline-none transition-colors"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter('')}
                className="absolute right-2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <ColumnPicker tableId="operators" columns={columns} className="ml-auto" />
        </div>

        {/* Table */}
        <div className={`w-full overflow-auto ${cardStyle}`}>
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        className={[
                          'px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide select-none whitespace-nowrap text-left',
                          canSort ? 'cursor-pointer hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors' : '',
                        ].join(' ')}
                      >
                        <span className="inline-flex items-center gap-1">
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
                  <th className="px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide text-right w-24">
                    Azioni
                  </th>
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-sm text-zinc-400">
                    Caricando operatori...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-sm text-zinc-400">
                    Nessun operatore trovato.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button, a, [data-no-row-click]')) return;
                      router.push(`/admin/operatori/${row.original.id}`);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target === e.currentTarget) {
                        router.push(`/admin/operatori/${row.original.id}`);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                    <td className="px-4 py-2">
                      <div className="flex flex-row items-center justify-end gap-1">
                        {showArchived && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRestore(row.original); }}
                            className="p-1.5 rounded-md text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                            title="Ripristina"
                          >
                            <ArchiveRestore className="size-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedOperator(row.original); setShowDelete(true); }}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Elimina"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={pageIndex + 1}
          onPageChange={(p) => setPageIndex(p - 1)}
          totalItems={filteredData.length}
          itemsPerPage={PAGE_SIZE}
          labelPlural="operatori"
        />
      </div>

      <DeleteOperatorModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        selectedOperator={selectedOperator}
      />
    </>
  );
}
