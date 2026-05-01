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
import { useRouter } from 'next/navigation';
import { ChevronUp, ChevronDown, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { useOrdersStore } from '@/lib/stores/orders';
import { EditOrderModal } from './EditOrderModal';
import { DeleteOrderModal } from './DeleteOrderModal';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { ColumnPicker } from '@/lib/components/admin/table/ColumnPicker';
import { useTableColumnPrefs } from '@/lib/hooks/useTableColumnPrefs';
import { cardStyle } from '@/lib/const/appearance';
import type { Order } from '@/lib/types/Order';

const PAGE_SIZE = 10;

interface OrdersTableProps {
  orders: Order[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const isLoading = useOrdersStore((s) => s.isLoading);
  const router = useRouter();

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editedOrder, setEditedOrder] = useState<Partial<Order>>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{getValue() as string}</span>
        ),
        meta: { requiredVisible: true },
      },
      {
        accessorKey: 'datetime',
        header: 'Data',
        cell: ({ getValue }) => (
          <span>{new Date(getValue() as string).toLocaleString('it-IT')}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Stato',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cell: ({ row }) => <span>{(row.original as any).status ?? ''}</span>,
      },
    ],
    []
  );

  const { columnVisibility, columnOrder, setColumnVisibility, setColumnOrder } =
    useTableColumnPrefs('orders', columns);

  const table = useReactTable({
    data: orders,
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

  const handleEditClick = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    setSelectedOrder(order);
    setEditedOrder({ ...order });
    setShowEdit(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    setSelectedOrder(order);
    setShowDelete(true);
  };

  return (
    <>
      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center gap-2">
          <ColumnPicker tableId="orders" columns={columns} className="ml-auto" />
        </div>

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
                    Caricando ordini...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-sm text-zinc-400">
                    Nessun ordine trovato.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                    <td className="px-4 py-2">
                      <div className="flex flex-row items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/admin/ordini/${row.original.id}`)}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-primary-hover dark:hover:text-primary/70 hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
                          title="Dettaglio"
                        >
                          <ExternalLink className="size-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleEditClick(e, row.original)}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                          title="Modifica"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(e, row.original)}
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
          totalItems={orders.length}
          itemsPerPage={PAGE_SIZE}
          labelPlural="ordini"
        />
      </div>

      <EditOrderModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        editedOrder={editedOrder}
        onEditedOrderChange={setEditedOrder}
        selectedOrder={selectedOrder}
      />
      <DeleteOrderModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        selectedOrder={selectedOrder}
      />
    </>
  );
}
