'use client';

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { useClientCategoriesStore } from '@/lib/stores/client_categories';
import { AddClientCategoryModal } from './AddClientCategoryModal';
import { DeleteClientCategoryModal } from './DeleteClientCategoryModal';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { ColumnPicker } from '@/lib/components/admin/table/ColumnPicker';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import { useTableColumnPrefs } from '@/lib/hooks/useTableColumnPrefs';
import { cardStyle } from '@/lib/const/appearance';
import type { ClientCategory } from '@/lib/types/ClientCategory';

const PAGE_SIZE = 10;

function ColorNameCell({ color, name }: { color: string; name: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="font-medium text-zinc-900 dark:text-zinc-100">{name}</span>
    </div>
  );
}

export function CategorieClientiTab() {
  const categories = useClientCategoriesStore((s) => s.client_categories);
  const isLoading = useClientCategoriesStore((s) => s.isLoading);

  const [showAdd, setShowAdd] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState<ClientCategory | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);

  const columns = useMemo<ColumnDef<ClientCategory>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nome',
        cell: ({ row }) => <ColorNameCell color={row.original.color} name={row.original.name} />,
        meta: { requiredVisible: true },
      },
      {
        accessorKey: 'client_count',
        header: () => <span className="block w-full text-right">Clienti</span>,
        cell: ({ getValue }) => (
          <span className="block text-right tabular-nums">{(getValue() as number) ?? 0}</span>
        ),
      },
    ],
    []
  );

  const { columnVisibility, columnOrder, setColumnVisibility, setColumnOrder } =
    useTableColumnPrefs('client-categories', columns);

  const table = useReactTable({
    data: categories,
    columns,
    state: {
      sorting,
      pagination: { pageIndex, pageSize: PAGE_SIZE },
      columnVisibility,
      columnOrder,
    },
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

  const handleEditClick = (e: React.MouseEvent, item: ClientCategory) => {
    e.stopPropagation();
    setSelected(item);
    setShowAdd(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, item: ClientCategory) => {
    e.stopPropagation();
    setSelected(item);
    setShowDelete(true);
  };

  return (
    <>
      <AddClientCategoryModal
        isOpen={showAdd}
        onClose={() => { setShowAdd(false); setSelected(null); }}
        selectedCategory={selected}
      />
      <DeleteClientCategoryModal
        isOpen={showDelete}
        onClose={() => { setShowDelete(false); setSelected(null); }}
        category={selected}
      />

      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center gap-2">
          <ColumnPicker tableId="client-categories" columns={columns} className="ml-auto" />
        </div>

        <div className={`w-full overflow-auto ${cardStyle}`}>
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    const isNumeric = header.column.id === 'client_count';
                    return (
                      <th
                        key={header.id}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        className={[
                          'px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide select-none whitespace-nowrap',
                          canSort ? 'cursor-pointer hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors' : '',
                          isNumeric ? 'text-right' : 'text-left',
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
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-sm text-zinc-400">
                    Caricando categorie...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-sm text-zinc-400">
                    Nessuna categoria trovata.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isNumeric = cell.column.id === 'client_count';
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
                        <Tooltip label="Modifica">
                          <button
                            onClick={(e) => handleEditClick(e, row.original)}
                            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip label="Elimina">
                          <button
                            onClick={(e) => handleDeleteClick(e, row.original)}
                            className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </Tooltip>
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
          totalItems={categories.length}
          itemsPerPage={PAGE_SIZE}
          labelPlural="categorie"
        />
      </div>
    </>
  );
}
