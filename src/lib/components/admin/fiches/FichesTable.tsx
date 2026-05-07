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
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { useFichesStore } from '@/lib/stores/fiches';
import { useClientsStore } from '@/lib/stores/clients';
import { useFicheServicesStore } from '@/lib/stores/fiche_services';
import { useServicesStore } from '@/lib/stores/services';
import { Fiche, FicheBucket, FICHE_BUCKET_LABELS, getFicheBucket } from '@/lib/types/Fiche';
import { Button } from '@/lib/components/shared/ui/Button';
import { Searchbar } from '@/lib/components/shared/ui/Searchbar';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { ColumnPicker } from '@/lib/components/admin/table/ColumnPicker';
import { useTableColumnPrefs } from '@/lib/hooks/useTableColumnPrefs';
import { useFitPageSize } from '@/lib/hooks/useFitPageSize';
import { FicheModal } from '@/lib/components/admin/fiches/FicheModal';
import { DeleteFicheModal } from './DeleteFicheModal';
import { cardStyle } from '@/lib/const/appearance';

interface FichesTableProps {
  fiches: Fiche[];
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  emptyText?: string;
}

const BUCKET_STYLES: Record<FicheBucket, string> = {
  [FicheBucket.PRENOTATA]: 'bg-primary/10 text-primary-hover dark:text-primary/70 border-primary/20',
  [FicheBucket.ARRETRATA]: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  [FicheBucket.CONCLUSA]: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
};

export function FichesTable({ fiches, globalFilter, onGlobalFilterChange, emptyText }: FichesTableProps) {
  const isLoading = useFichesStore((s) => s.isLoading);
  const clients = useClientsStore((s) => s.clients);
  const ficheServices = useFicheServicesStore((s) => s.fiche_services);
  const services = useServicesStore((s) => s.services);

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const serviceMap = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);
  const ficheServicesByFiche = useMemo(() => {
    const map = new Map<string, typeof ficheServices>();
    for (const fs of ficheServices) {
      const arr = map.get(fs.fiche_id);
      if (arr) arr.push(fs);
      else map.set(fs.fiche_id, [fs]);
    }
    return map;
  }, [ficheServices]);

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedFiche, setSelectedFiche] = useState<Fiche | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);

  const { ref: tableCardRef, pageSize } = useFitPageSize<HTMLDivElement>({ rowPx: 41 });

  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(fiches.length / pageSize) - 1);
    if (pageIndex > lastPage) setPageIndex(lastPage);
  }, [pageSize, fiches.length, pageIndex]);

  const columns = useMemo<ColumnDef<Fiche>[]>(
    () => [
      {
        accessorKey: 'client_id',
        header: 'Cliente',
        cell: ({ row }) => {
          const client = clientMap.get(row.original.client_id);
          return (
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {client ? `${client.firstName} ${client.lastName}` : <span className="text-zinc-400">—</span>}
            </span>
          );
        },
        sortingFn: (a, b) => {
          const ca = clientMap.get(a.original.client_id);
          const cb = clientMap.get(b.original.client_id);
          const na = ca ? `${ca.firstName} ${ca.lastName}` : '';
          const nb = cb ? `${cb.firstName} ${cb.lastName}` : '';
          return na.localeCompare(nb, 'it');
        },
        meta: { requiredVisible: true },
      },
      {
        id: 'date',
        header: 'Data',
        cell: ({ row }) => new Date(row.original.datetime).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        enableSorting: true,
        sortingFn: (a, b) =>
          new Date(a.original.datetime).getTime() - new Date(b.original.datetime).getTime(),
      },
      {
        id: 'time',
        header: 'Ora',
        cell: ({ row }) => new Date(row.original.datetime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
        enableSorting: true,
        sortingFn: (a, b) =>
          new Date(a.original.datetime).getTime() - new Date(b.original.datetime).getTime(),
      },
      {
        id: 'services',
        header: 'Servizi',
        enableSorting: false,
        cell: ({ row }) => {
          const fServices = ficheServicesByFiche.get(row.original.id) ?? [];
          const entries = fServices
            .map((fs) => ({ id: fs.id, name: serviceMap.get(fs.service_id)?.name }))
            .filter((e): e is { id: string; name: string } => Boolean(e.name));
          if (entries.length === 0) return <span className="text-zinc-400">—</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {entries.map((entry) => (
                <span
                  key={entry.id}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary-hover dark:text-primary/70 border border-primary/20"
                >
                  {entry.name}
                </span>
              ))}
            </div>
          );
        },
      },
      {
        id: 'total',
        header: 'Totale',
        enableSorting: true,
        sortingFn: (a, b) => a.original.getTotal() - b.original.getTotal(),
        cell: ({ row }) => {
          const total = row.original.getTotal();
          return (
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {total.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
            </span>
          );
        },
      },
      {
        id: 'status',
        header: 'Stato',
        accessorFn: (fiche) => getFicheBucket(fiche),
        cell: ({ row }) => {
          const bucket = getFicheBucket(row.original);
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${BUCKET_STYLES[bucket]}`}>
              {FICHE_BUCKET_LABELS[bucket]}
            </span>
          );
        },
      },
    ],
    [clientMap, ficheServicesByFiche, serviceMap]
  );

  const { columnVisibility, columnOrder, setColumnVisibility, setColumnOrder } =
    useTableColumnPrefs('fiches', columns);

  const table = useReactTable({
    data: fiches,
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
    manualFiltering: true,
  });

  const showSearch = onGlobalFilterChange !== undefined;

  return (
    <>
      <div className="flex-1 min-h-0 flex flex-col gap-4 w-full">
        {/* Toolbar */}
        <div className="flex items-center gap-2">
          {showSearch && (
            <Searchbar
              className="flex-1 max-w-sm"
              placeholder="Cerca fiche..."
              value={globalFilter ?? ''}
              onChange={(v) => onGlobalFilterChange?.(v)}
            />
          )}
          <ColumnPicker tableId="fiches" columns={columns} className="ml-auto" />
        </div>

        {/* Table */}
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
                    Caricando fiches...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-sm text-zinc-400">
                    {emptyText ?? 'Nessuna fiche trovata.'}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => { setSelectedFiche(row.original); setShowEdit(true); }}
                    className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                    <td className="px-4 py-2">
                      <div className="flex flex-row items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          iconOnly
                          aria-label="Elimina"
                          title="Elimina"
                          onClick={(e) => { e.stopPropagation(); setSelectedFiche(row.original); setShowDelete(true); }}
                          className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
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
          totalItems={fiches.length}
          itemsPerPage={pageSize}
          labelPlural="fiches"
        />
      </div>

      <FicheModal
        mode="edit"
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        fiche={selectedFiche}
      />
      <DeleteFicheModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        selectedFiche={selectedFiche}
      />
    </>
  );
}
