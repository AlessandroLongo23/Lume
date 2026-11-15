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
import { Trash2 } from 'lucide-react';
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
import { useCouponsStore } from '@/lib/stores/coupons';
import { useClientsStore } from '@/lib/stores/clients';
import { Button } from '@/lib/components/shared/ui/Button';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { ColumnPicker } from '@/lib/components/admin/table/ColumnPicker';
import { ExportMenu } from '@/lib/components/shared/ui/ExportMenu';
import type { ExportColumn } from '@/lib/utils/tableExport';
import { useTableColumnPrefs } from '@/lib/hooks/useTableColumnPrefs';
import { useFitPageSize } from '@/lib/hooks/useFitPageSize';
import { DeleteCouponModal } from './DeleteCouponModal';
import { Coupon } from '@/lib/types/Coupon';
import { Searchbar } from '@/lib/components/shared/ui/Searchbar';

type CouponStatus = 'attivo' | 'scaduto' | 'esaurito' | 'in attesa' | 'inattivo';

// Status as a dot beside a neutral word: colour carries the state only.
const STATUS_DOT: Record<CouponStatus, string> = {
  attivo: 'bg-success-strong',
  scaduto: 'bg-[var(--lume-text-muted)]',
  esaurito: 'bg-warning-strong',
  'in attesa': 'bg-info-strong',
  inattivo: 'bg-[var(--lume-text-muted)]',
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
          <span className={cellStrongClass}>
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
          <span className="text-[var(--lume-text)]">
            {clientName(row.original.purchaser_client_id)}
          </span>
        ),
      });
      baseCols.push({
        id: 'balance',
        header: 'Saldo',
        cell: ({ row }) => (
          <span className="tabular-nums text-compact text-[var(--lume-text)]">{row.original.displayDiscount()}</span>
        ),
        sortingFn: (a, b) => (a.original.remaining_value ?? 0) - (b.original.remaining_value ?? 0),
      });
      baseCols.push({
        id: 'sale',
        header: 'Incasso',
        cell: ({ row }) =>
          row.original.sale_amount != null
            ? <span className="tabular-nums text-compact">€ {row.original.sale_amount.toFixed(2)}</span>
            : <span className="text-[var(--lume-text-muted)]">—</span>,
      });
    } else {
      baseCols.push({
        id: 'discount',
        header: 'Sconto',
        cell: ({ row }) => (
          <span className="tabular-nums text-compact text-[var(--lume-text)]">{row.original.displayDiscount()}</span>
        ),
      });
      baseCols.push({
        id: 'scope',
        header: 'Ambito',
        cell: ({ row }) => {
          const c = row.original;
          if (c.hasUnlimitedScope) {
            return <span className="text-[var(--lume-text-muted)] italic">tutto</span>;
          }
          const parts: string[] = [];
          if (c.scope_service_ids?.length) parts.push(`${c.scope_service_ids.length} servizi`);
          if (c.scope_service_category_ids?.length) parts.push(`${c.scope_service_category_ids.length} cat. servizi`);
          if (c.scope_product_ids?.length) parts.push(`${c.scope_product_ids.length} prodotti`);
          if (c.scope_product_category_ids?.length) parts.push(`${c.scope_product_category_ids.length} cat. prodotti`);
          return <span className="text-xs text-[var(--lume-text-secondary)]">{parts.join(' · ')}</span>;
        },
      });
    }

    baseCols.push({
      id: 'valid_until',
      header: 'Scadenza',
      cell: ({ row }) => <span className="tabular-nums text-compact">{new Date(row.original.valid_until).toLocaleDateString('it-IT')}</span>,
      sortingFn: (a, b) =>
        new Date(a.original.valid_until).getTime() - new Date(b.original.valid_until).getTime(),
    });

    baseCols.push({
      id: 'created',
      header: 'Creato',
      cell: ({ row }) => <span className="tabular-nums text-compact">{new Date(row.original.created_at).toLocaleDateString('it-IT')}</span>,
      sortingFn: (a, b) =>
        new Date(a.original.created_at).getTime() - new Date(b.original.created_at).getTime(),
    });

    baseCols.push({
      id: 'status',
      header: 'Stato',
      cell: ({ row }) => {
        const status = row.original.displayStatus();
        return (
          <span className={`inline-flex items-center gap-1.5 ${status === 'inattivo' || status === 'scaduto' ? 'text-[var(--lume-text-secondary)]' : 'text-[var(--lume-text)]'}`}>
            <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${STATUS_DOT[status]}`} />
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

  const exportColumns: ExportColumn<Coupon>[] = useMemo(() => {
    const cols: ExportColumn<Coupon>[] = [
      { label: 'Destinatario', accessor: (c) => clientName(c.recipient_client_id) },
    ];
    if (variant === 'gift_card') {
      cols.push({ label: 'Acquirente', accessor: (c) => clientName(c.purchaser_client_id) });
      cols.push({ label: 'Saldo', accessor: (c) => c.displayDiscount() });
      cols.push({ label: 'Incasso (€)', accessor: (c) => c.sale_amount ?? '' });
    } else {
      cols.push({ label: 'Sconto', accessor: (c) => c.displayDiscount() });
    }
    cols.push({ label: 'Scadenza', accessor: (c) => new Date(c.valid_until) });
    cols.push({ label: 'Creato', accessor: (c) => new Date(c.created_at) });
    cols.push({ label: 'Stato', accessor: (c) => c.displayStatus() });
    return cols;
  }, [variant, clientName]);

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
        <div className="flex items-center gap-2 flex-wrap">
          <Searchbar placeholder={variant === 'gift_card' ? 'Cerca per cliente...' : 'Cerca per destinatario...'} value={globalFilter} onChange={setGlobalFilter} bindShortcut={false} className="flex-1 basis-full sm:basis-auto sm:max-w-sm" />
          <div className="ml-auto flex items-center gap-2">
            <ExportMenu
              rows={filteredData}
              columns={exportColumns}
              baseName={tableId}
              pdfTitle={variant === 'gift_card' ? 'Gift card' : 'Coupon'}
            />
            <ColumnPicker tableId={tableId} columns={columns} />
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
                    Caricamento…
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className={tableMessageClass}>
                    {emptyLabel}
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
                          variant="ghost-destructive"
                          size="sm"
                          iconOnly
                          aria-label="Elimina"
                          onClick={() => { setSelected(row.original); setShowDelete(true); }}
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
