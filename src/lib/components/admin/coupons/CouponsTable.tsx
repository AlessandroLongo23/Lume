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
import { ChevronUp, ChevronDown, Trash2, Search, X } from 'lucide-react';
import { useCouponsStore } from '@/lib/stores/coupons';
import { useClientsStore } from '@/lib/stores/clients';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { ColumnPicker } from '@/lib/components/admin/table/ColumnPicker';
import { useTableColumnPrefs } from '@/lib/hooks/useTableColumnPrefs';
import { useFitPageSize } from '@/lib/hooks/useFitPageSize';
import { DeleteCouponModal } from './DeleteCouponModal';
import { Coupon } from '@/lib/types/Coupon';
import { cardStyle } from '@/lib/const/appearance';

type CouponStatus = 'attivo' | 'scaduto' | 'esaurito' | 'in attesa' | 'inattivo';

const STATUS_STYLES: Record<CouponStatus, string> = {
  attivo: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  scaduto: 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/20',
  esaurito: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'in attesa': 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  inattivo: 'bg-zinc-500/10 text-zinc-400 dark:text-zinc-500 border-zinc-500/20 line-through',
};

interface CouponsTableProps {
  coupons: Coupon[];
  variant: 'gift' | 'gift_card';
}

export function CouponsTable({ coupons, variant }: CouponsTableProps) {
  const isLoading = useCouponsStore((s) => s.isLoading);
  const clients = useClientsStore((s) => s.clients);
  const clientName = useMemo(() => {
    const map = new Map(clients.map((c) => [c.id, `${c.firstName} ${c.lastName}`]));
    return (id: string | null | undefined) => (id ? map.get(id) ?? 'N/A' : '—');
  }, [clients]);

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created', desc: true },
  ]);
  const [pageIndex, setPageIndex] = useState(0);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState<Coupon | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');

  const { ref: tableCardRef, pageSize } = useFitPageSize<HTMLDivElement>({ rowPx: 41 });

  useEffect(() => { setPageIndex(0); }, [globalFilter]);

  const filteredData = useMemo(() => {
    if (!globalFilter.trim()) return coupons;
    const q = globalFilter.toLowerCase();
    return coupons.filter((c) => {
      if (clientName(c.recipient_client_id).toLowerCase().includes(q)) return true;
      if (variant === 'gift_card' && clientName(c.purchaser_client_id).toLowerCase().includes(q)) return true;
      return false;
    });
  }, [coupons, globalFilter, clientName, variant]);

  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(filteredData.length / pageSize) - 1);
    if (pageIndex > lastPage) setPageIndex(lastPage);
  }, [pageSize, filteredData.length, pageIndex]);

  const columns = useMemo<ColumnDef<Coupon>[]>(() => {
    const baseCols: ColumnDef<Coupon>[] = [
      {
        id: 'recipient',
        header: 'Destinatario',
        cell: ({ row }) => (
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {clientName(row.original.recipient_client_id)}
          </span>
        ),
        sortingFn: (a, b) =>
          clientName(a.original.recipient_client_id).localeCompare(
            clientName(b.original.recipient_client_id),
            'it',
          ),
        meta: { requiredVisible: true },
      },
    ];

    if (variant === 'gift_card') {
      baseCols.push({
        id: 'purchaser',
        header: 'Acquirente',
        cell: ({ row }) => (
          <span className="text-zinc-700 dark:text-zinc-300">
            {clientName(row.original.purchaser_client_id)}
          </span>
        ),
      });
      baseCols.push({
        id: 'balance',
        header: 'Saldo',
        cell: ({ row }) => (
          <span className="font-mono text-zinc-900 dark:text-zinc-100">{row.original.displayDiscount()}</span>
        ),
        sortingFn: (a, b) => (a.original.remaining_value ?? 0) - (b.original.remaining_value ?? 0),
      });
      baseCols.push({
        id: 'sale',
        header: 'Incasso',
        cell: ({ row }) =>
          row.original.sale_amount != null
            ? <span className="font-mono">€ {row.original.sale_amount.toFixed(2)}</span>
            : <span className="text-zinc-400">—</span>,
      });
    } else {
      baseCols.push({
        id: 'discount',
        header: 'Sconto',
        cell: ({ row }) => (
          <span className="font-mono text-zinc-900 dark:text-zinc-100">{row.original.displayDiscount()}</span>
        ),
      });
      baseCols.push({
        id: 'scope',
        header: 'Ambito',
        cell: ({ row }) => {
          const c = row.original;
          if (c.hasUnlimitedScope) {
            return <span className="text-zinc-400 italic">tutto</span>;
          }
          const parts: string[] = [];
          if (c.scope_service_ids?.length) parts.push(`${c.scope_service_ids.length} servizi`);
          if (c.scope_service_category_ids?.length) parts.push(`${c.scope_service_category_ids.length} cat. servizi`);
          if (c.scope_product_ids?.length) parts.push(`${c.scope_product_ids.length} prodotti`);
          if (c.scope_product_category_ids?.length) parts.push(`${c.scope_product_category_ids.length} cat. prodotti`);
          return <span className="text-xs text-zinc-500">{parts.join(' · ')}</span>;
        },
      });
    }

    baseCols.push({
      id: 'valid_until',
      header: 'Scadenza',
      cell: ({ row }) => new Date(row.original.valid_until).toLocaleDateString('it-IT'),
      sortingFn: (a, b) =>
        new Date(a.original.valid_until).getTime() - new Date(b.original.valid_until).getTime(),
    });

    baseCols.push({
      id: 'created',
      header: 'Creato',
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('it-IT'),
      sortingFn: (a, b) =>
        new Date(a.original.created_at).getTime() - new Date(b.original.created_at).getTime(),
    });

    baseCols.push({
      id: 'status',
      header: 'Stato',
      cell: ({ row }) => {
        const status = row.original.displayStatus();
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[status]}`}>
            {status}
          </span>
        );
      },
    });

    return baseCols;
  }, [variant, clientName]);

  const tableId = variant === 'gift_card' ? 'gift-cards' : 'coupons';
  const { columnVisibility, columnOrder, setColumnVisibility, setColumnOrder } =
    useTableColumnPrefs(tableId, columns);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, pagination: { pageIndex, pageSize }, columnVisibility, columnOrder },
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
  });

  const emptyLabel = variant === 'gift_card' ? 'Nessuna gift card.' : 'Nessun coupon.';

  return (
    <>
      <div className="flex-1 min-h-0 flex flex-col gap-4 w-full">
        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center flex-1 max-w-sm">
            <Search className="absolute left-2.5 size-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder={variant === 'gift_card' ? 'Cerca per cliente...' : 'Cerca per destinatario...'}
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
          <ColumnPicker tableId={tableId} columns={columns} className="ml-auto" />
        </div>

        <div ref={tableCardRef} className="flex-1 min-h-0 w-full">
          <div className={`max-h-full w-full overflow-x-auto overflow-y-hidden ${cardStyle}`}>
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
                    Caricamento…
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-sm text-zinc-400">
                    {emptyLabel}
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
                          onClick={() => { setSelected(row.original); setShowDelete(true); }}
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
        </div>

        <Pagination
          currentPage={pageIndex + 1}
          onPageChange={(p) => setPageIndex(p - 1)}
          totalItems={filteredData.length}
          itemsPerPage={pageSize}
          labelPlural={variant === 'gift_card' ? 'gift card' : 'coupons'}
        />
      </div>

      <DeleteCouponModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        coupon={selected}
      />
    </>
  );
}
