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
import { useAbbonamentiStore } from '@/lib/stores/abbonamenti';
import { useClientsStore } from '@/lib/stores/clients';
import { useServicesStore } from '@/lib/stores/services';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { ColumnPicker } from '@/lib/components/admin/table/ColumnPicker';
import { ExportMenu } from '@/lib/components/shared/ui/ExportMenu';
import type { ExportColumn } from '@/lib/utils/tableExport';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import { Button } from '@/lib/components/shared/ui/Button';
import { useTableColumnPrefs } from '@/lib/hooks/useTableColumnPrefs';
import { useFitPageSize } from '@/lib/hooks/useFitPageSize';
import { EditAbbonamentoModal } from './EditAbbonamentoModal';
import { DeleteAbbonamentoModal } from './DeleteAbbonamentoModal';
import { Abbonamento, type AbbonamentoStatus } from '@/lib/types/Abbonamento';
import { Searchbar } from '@/lib/components/shared/ui/Searchbar';

// Status as a dot beside a neutral word: colour carries the state only.
const STATUS_DOT: Record<AbbonamentoStatus, string> = {
  attivo: 'bg-success-strong',
  scaduto: 'bg-[var(--lume-text-muted)]',
  esaurito: 'bg-warning-strong',
  'in attesa': 'bg-info-strong',
  inattivo: 'bg-[var(--lume-text-muted)]',
};

interface AbbonamentiTableProps {
  abbonamenti: Abbonamento[];
}

export function AbbonamentiTable({ abbonamenti }: AbbonamentiTableProps) {
  const isLoading = useAbbonamentiStore((s) => s.isLoading);
  const clients = useClientsStore((s) => s.clients);
  const services = useServicesStore((s) => s.services);

  const clientName = useMemo(() => {
    const map = new Map(clients.map((c) => [c.id, `${c.firstName} ${c.lastName}`]));
    return (id: string) => map.get(id) ?? 'N/A';
  }, [clients]);

  const servicesMap = useMemo(() => new Map(services.map((s) => [s.id, s.name])), [services]);

  const [sorting, setSorting] = useState<SortingState>([{ id: 'created', desc: true }]);
  const [pageIndex, setPageIndex] = useState(0);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState<Abbonamento | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');

  const { ref: tableCardRef, pageSize } = useFitPageSize<HTMLDivElement>({ rowPx: 41 });

  useEffect(() => { setPageIndex(0); }, [globalFilter]);

  const filteredData = useMemo(() => {
    if (!globalFilter.trim()) return abbonamenti;
    const q = globalFilter.toLowerCase();
    return abbonamenti.filter((a) => clientName(a.client_id).toLowerCase().includes(q));
  }, [abbonamenti, globalFilter, clientName]);

  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(filteredData.length / pageSize) - 1);
    if (pageIndex > lastPage) setPageIndex(lastPage);
  }, [pageSize, filteredData.length, pageIndex]);

  const columns = useMemo<ColumnDef<Abbonamento>[]>(() => [
    {
      id: 'client',
      header: 'Cliente',
      cell: ({ row }) => (
        <span className={cellStrongClass}>
          {clientName(row.original.client_id)}
        </span>
      ),
      sortingFn: (a, b) => clientName(a.original.client_id).localeCompare(clientName(b.original.client_id), 'it'),
      meta: { requiredVisible: true },
    },
    {
      id: 'services',
      header: 'Servizi',
      cell: ({ row }) => {
        const ids = row.original.scope_service_ids;
        if (ids.length === 0) return <span className="text-[var(--lume-text-muted)]">—</span>;
        if (ids.length === 1) return <span>{servicesMap.get(ids[0]) ?? '—'}</span>;
        return (
          <Tooltip label={ids.map((id) => servicesMap.get(id) ?? '—').join(', ')}>
            <span className="text-[var(--lume-text)]">
              {ids.length} servizi
            </span>
          </Tooltip>
        );
      },
    },
    {
      id: 'remaining',
      header: 'Rimanenti',
      cell: ({ row }) => {
        const a = row.original;
        const ratio = a.total_treatments > 0 ? a.remainingTreatments / a.total_treatments : 0;
        // Running low is a state: a dot beside the count, the count stays neutral.
        const dot = ratio < 0.4 ? 'bg-warning-strong' : null;
        return (
          <span className="inline-flex items-center gap-1.5 tabular-nums text-compact text-[var(--lume-text)]">
            {dot && <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${dot}`} />}
            {a.remainingTreatments} / {a.total_treatments}
          </span>
        );
      },
      sortingFn: (a, b) => a.original.remainingTreatments - b.original.remainingTreatments,
    },
    {
      id: 'total_paid',
      header: 'Incasso',
      cell: ({ row }) => (
        <span className="tabular-nums text-compact text-[var(--lume-text)]">
          € {row.original.total_paid.toFixed(2)}
        </span>
      ),
      sortingFn: (a, b) => a.original.total_paid - b.original.total_paid,
    },
    {
      id: 'valid_until',
      header: 'Scadenza',
      cell: ({ row }) =>
        row.original.valid_until
          ? <span className="tabular-nums text-compact">{new Date(row.original.valid_until).toLocaleDateString('it-IT')}</span>
          : <span className="text-[var(--lume-text-muted)]">—</span>,
      sortingFn: (a, b) => {
        const av = a.original.valid_until ? new Date(a.original.valid_until).getTime() : Infinity;
        const bv = b.original.valid_until ? new Date(b.original.valid_until).getTime() : Infinity;
        return av - bv;
      },
    },
    {
      id: 'created',
      header: 'Creato',
      cell: ({ row }) => <span className="tabular-nums text-compact">{new Date(row.original.created_at).toLocaleDateString('it-IT')}</span>,
      sortingFn: (a, b) =>
        new Date(a.original.created_at).getTime() - new Date(b.original.created_at).getTime(),
    },
    {
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
    },
  ], [clientName, servicesMap]);

  const { columnVisibility, columnOrder, setColumnVisibility, setColumnOrder } =
    useTableColumnPrefs('subscriptions', columns);

  const exportColumns: ExportColumn<Abbonamento>[] = useMemo(
    () => [
      { label: 'Cliente', accessor: (a) => clientName(a.client_id) },
      {
        label: 'Servizi',
        accessor: (a) => a.scope_service_ids.map((id) => servicesMap.get(id) ?? '').filter(Boolean).join(', '),
      },
      { label: 'Trattamenti rimanenti', accessor: (a) => a.remainingTreatments },
      { label: 'Trattamenti totali', accessor: (a) => a.total_treatments },
      { label: 'Incasso (€)', accessor: (a) => a.total_paid },
      { label: 'Scadenza', accessor: (a) => (a.valid_until ? new Date(a.valid_until) : null) },
      { label: 'Creato', accessor: (a) => new Date(a.created_at) },
      { label: 'Stato', accessor: (a) => a.displayStatus() },
    ],
    [clientName, servicesMap],
  );

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

  return (
    <>
      <div className="flex-1 min-h-0 flex flex-col gap-4 w-full">
        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Searchbar placeholder="Cerca per cliente..." value={globalFilter} onChange={setGlobalFilter} bindShortcut={false} className="flex-1 basis-full sm:basis-auto sm:max-w-sm" />
          <div className="ml-auto flex items-center gap-2">
            <ExportMenu
              rows={filteredData}
              columns={exportColumns}
              baseName="abbonamenti"
              pdfTitle="Abbonamenti"
            />
            <ColumnPicker tableId="subscriptions" columns={columns} />
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
                    Nessun abbonamento.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => { setSelected(row.original); setShowEdit(true); }}
                    className={trClass()}
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
                          onClick={(e) => { e.stopPropagation(); setSelected(row.original); setShowDelete(true); }}
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
          labelPlural="abbonamenti"
        />
      </div>

      <EditAbbonamentoModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        abbonamento={selected}
      />
      <DeleteAbbonamentoModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        abbonamento={selected}
      />
    </>
  );
}
