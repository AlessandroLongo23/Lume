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
import { useAbbonamentiStore } from '@/lib/stores/abbonamenti';
import { useClientsStore } from '@/lib/stores/clients';
import { useServicesStore } from '@/lib/stores/services';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { EditAbbonamentoModal } from './EditAbbonamentoModal';
import { DeleteAbbonamentoModal } from './DeleteAbbonamentoModal';
import { Abbonamento, type AbbonamentoStatus } from '@/lib/types/Abbonamento';
import { cardStyle } from '@/lib/const/appearance';

const PAGE_SIZE = 10;

const STATUS_STYLES: Record<AbbonamentoStatus, string> = {
  attivo: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  scaduto: 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/20',
  esaurito: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'in attesa': 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  inattivo: 'bg-zinc-500/10 text-zinc-400 dark:text-zinc-500 border-zinc-500/20 line-through',
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

  const columns = useMemo<ColumnDef<Abbonamento>[]>(() => [
    {
      id: 'client',
      header: 'Cliente',
      cell: ({ row }) => (
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {clientName(row.original.client_id)}
        </span>
      ),
      sortingFn: (a, b) => clientName(a.original.client_id).localeCompare(clientName(b.original.client_id), 'it'),
    },
    {
      id: 'services',
      header: 'Servizi',
      cell: ({ row }) => {
        const ids = row.original.scope_service_ids;
        if (ids.length === 0) return <span className="text-zinc-400">—</span>;
        if (ids.length === 1) return <span>{servicesMap.get(ids[0]) ?? '—'}</span>;
        return (
          <span title={ids.map((id) => servicesMap.get(id) ?? '—').join(', ')} className="text-zinc-700 dark:text-zinc-300">
            {ids.length} servizi
          </span>
        );
      },
    },
    {
      id: 'remaining',
      header: 'Rimanenti',
      cell: ({ row }) => {
        const a = row.original;
        const ratio = a.total_treatments > 0 ? a.remainingTreatments / a.total_treatments : 0;
        const color =
          ratio === 0 ? 'text-amber-500' : ratio < 0.4 ? 'text-orange-500' : 'text-emerald-500';
        return (
          <span className={`font-mono ${color}`}>
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
        <span className="font-mono text-zinc-900 dark:text-zinc-100">
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
          ? new Date(row.original.valid_until).toLocaleDateString('it-IT')
          : <span className="text-zinc-400">—</span>,
      sortingFn: (a, b) => {
        const av = a.original.valid_until ? new Date(a.original.valid_until).getTime() : Infinity;
        const bv = b.original.valid_until ? new Date(b.original.valid_until).getTime() : Infinity;
        return av - bv;
      },
    },
    {
      id: 'created',
      header: 'Creato',
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('it-IT'),
      sortingFn: (a, b) =>
        new Date(a.original.created_at).getTime() - new Date(b.original.created_at).getTime(),
    },
    {
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
    },
  ], [clientName, servicesMap]);

  const table = useReactTable({
    data: abbonamenti,
    columns,
    state: { sorting, pagination: { pageIndex, pageSize: PAGE_SIZE } },
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater({ pageIndex, pageSize: PAGE_SIZE }) : updater;
      setPageIndex(next.pageIndex);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      <div className="flex flex-col gap-4 w-full">
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
                              <ChevronUp className={`size-3 ${sorted === 'asc' ? 'text-indigo-500' : 'text-zinc-300 dark:text-zinc-600'}`} />
                              <ChevronDown className={`size-3 -mt-1 ${sorted === 'desc' ? 'text-indigo-500' : 'text-zinc-300 dark:text-zinc-600'}`} />
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
                    Nessun abbonamento.
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
                          onClick={() => { setSelected(row.original); setShowEdit(true); }}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                          title="Modifica"
                        >
                          <Pencil className="size-3.5" />
                        </button>
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

        <Pagination
          currentPage={pageIndex + 1}
          onPageChange={(p) => setPageIndex(p - 1)}
          totalItems={abbonamenti.length}
          itemsPerPage={PAGE_SIZE}
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
