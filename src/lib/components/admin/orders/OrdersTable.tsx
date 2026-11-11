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
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, ExternalLink } from 'lucide-react';
import {
  tableCardClass,
  tableClass,
  theadClass,
  thClass,
  trClass,
  tdClass,
  tableMessageClass,
  SortIndicator,
} from '@/lib/components/shared/ui/table/tableStyles';
import { Button } from '@/lib/components/shared/ui/Button';
import { useOrdersStore } from '@/lib/stores/orders';
import { EditOrderModal } from './EditOrderModal';
import { DeleteOrderModal } from './DeleteOrderModal';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { ColumnPicker } from '@/lib/components/admin/table/ColumnPicker';
import { ExportMenu } from '@/lib/components/shared/ui/ExportMenu';
import type { ExportColumn } from '@/lib/utils/tableExport';
import { useTableColumnPrefs } from '@/lib/hooks/useTableColumnPrefs';
import { useFitPageSize } from '@/lib/hooks/useFitPageSize';
import type { Order } from '@/lib/types/Order';


interface OrdersTableProps {
  orders: Order[];
}

// Status as a dot beside a neutral word: colour carries the state only.
const STATUS_LABEL: Record<string, string> = {
  pending: 'In attesa',
  confirmed: 'Confermato',
  delivered: 'Consegnato',
  cancelled: 'Annullato',
};

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-warning-strong',
  confirmed: 'bg-info-strong',
  delivered: 'bg-success-strong',
  cancelled: 'bg-danger-strong',
};

export function OrdersTable({ orders }: OrdersTableProps) {
  const isLoading = useOrdersStore((s) => s.isLoading);
  const router = useRouter();

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editedOrder, setEditedOrder] = useState<Partial<Order>>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);

  const { ref: tableCardRef, pageSize } = useFitPageSize<HTMLDivElement>({ rowPx: 41 });

  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(orders.length / pageSize) - 1);
    if (pageIndex > lastPage) setPageIndex(lastPage);
  }, [pageSize, orders.length, pageIndex]);

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ getValue }) => (
          <span className="tabular-nums text-xs text-[var(--lume-text-secondary)]">{getValue() as string}</span>
        ),
        meta: { requiredVisible: true },
      },
      {
        accessorKey: 'datetime',
        header: 'Data',
        cell: ({ getValue }) => (
          <span className="tabular-nums text-compact">{new Date(getValue() as string).toLocaleString('it-IT')}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Stato',
        cell: ({ row }) => {
          const raw = row.original.status ?? '';
          const key = raw.toLowerCase();
          const label = STATUS_LABEL[key] ?? raw;
          const dot = STATUS_DOT[key];
          return (
            <span className="inline-flex items-center gap-1.5 text-[var(--lume-text)]">
              {dot && <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${dot}`} />}
              {label}
            </span>
          );
        },
      },
    ],
    []
  );

  const { columnVisibility, columnOrder, setColumnVisibility, setColumnOrder } =
    useTableColumnPrefs('orders', columns);

  const exportColumns: ExportColumn<Order>[] = useMemo(
    () => [
      { label: 'ID', accessor: (o) => o.id },
      { label: 'Data', accessor: (o) => o.datetime },
      { label: 'Stato', accessor: (o) => o.status },
    ],
    [],
  );

  const table = useReactTable({
    data: orders,
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
      <div className="flex-1 min-h-0 flex flex-col gap-4 w-full">
        <div className="flex items-center gap-2">
          <div className="ml-auto flex items-center gap-2">
            <ExportMenu
              rows={orders}
              columns={exportColumns}
              baseName="ordini"
              pdfTitle="Ordini"
            />
            <ColumnPicker tableId="orders" columns={columns} />
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
                  <th className={`${thClass({ align: 'right' })} w-24`}>
                    Azioni
                  </th>
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length + 1} className={tableMessageClass}>
                    Caricando ordini...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className={tableMessageClass}>
                    Nessun ordine trovato.
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
                          aria-label="Dettaglio"
                          onClick={() => router.push(`/admin/ordini/${row.original.id}`)}
                        >
                          <ExternalLink />
                        </Button>
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
          totalItems={orders.length}
          itemsPerPage={pageSize}
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
