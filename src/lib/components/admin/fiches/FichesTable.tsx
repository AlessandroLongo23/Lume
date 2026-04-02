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
import { Search, X, ChevronUp, ChevronDown, Trash2, ReceiptText } from 'lucide-react';
import { useFichesStore } from '@/lib/stores/fiches';
import { useClientsStore } from '@/lib/stores/clients';
import { Fiche } from '@/lib/types/Fiche';
import { FicheStatus } from '@/lib/types/ficheStatus';
import { FacetedFilter, type FacetedFilterOption } from '@/lib/components/admin/table/FacetedFilter';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { FicheModal } from '@/lib/components/admin/fiches/FicheModal';
import { DeleteFicheModal } from './DeleteFicheModal';
import { CheckoutFicheModal } from './CheckoutFicheModal';
import { cardStyle } from '@/lib/const/appearance';

interface FichesTableProps {
  fiches: Fiche[];
}

const PAGE_SIZE = 10;

const STATUS_STYLES: Record<string, string> = {
  [FicheStatus.CREATED]: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  [FicheStatus.PENDING]: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  [FicheStatus.COMPLETED]: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  [FicheStatus.CREATED]: 'Creata',
  [FicheStatus.PENDING]: 'In corso',
  [FicheStatus.COMPLETED]: 'Completata',
};

const STATUS_OPTIONS: FacetedFilterOption[] = [
  { value: FicheStatus.CREATED, label: 'Creata' },
  { value: FicheStatus.PENDING, label: 'In corso' },
  { value: FicheStatus.COMPLETED, label: 'Completata' },
];

export function FichesTable({ fiches }: FichesTableProps) {
  const isLoading = useFichesStore((s) => s.isLoading);
  const clients = useClientsStore((s) => s.clients);

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedFiche, setSelectedFiche] = useState<Fiche | null>(null);

  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([FicheStatus.CREATED, FicheStatus.PENDING]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => { setPageIndex(0); }, [globalFilter, selectedStatuses]);

  const filteredData = useMemo(() => {
    let data = fiches;
    if (selectedStatuses.length > 0) data = data.filter((f) => selectedStatuses.includes(f.status));
    if (globalFilter.trim()) {
      const q = globalFilter.toLowerCase();
      data = data.filter((f) => {
        const client = clients.find((c) => c.id === f.client_id);
        const fullName = client ? `${client.firstName} ${client.lastName}`.toLowerCase() : '';
        return fullName.includes(q) || f.status.toLowerCase().includes(q);
      });
    }
    return data;
  }, [fiches, selectedStatuses, globalFilter, clients]);

  const columns = useMemo<ColumnDef<Fiche>[]>(
    () => [
      {
        accessorKey: 'client_id',
        header: 'Cliente',
        cell: ({ row }) => {
          const client = clients.find((c) => c.id === row.original.client_id);
          return (
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {client ? `${client.firstName} ${client.lastName}` : <span className="text-zinc-400">—</span>}
            </span>
          );
        },
        sortingFn: (a, b) => {
          const ca = clients.find((c) => c.id === a.original.client_id);
          const cb = clients.find((c) => c.id === b.original.client_id);
          const na = ca ? `${ca.firstName} ${ca.lastName}` : '';
          const nb = cb ? `${cb.firstName} ${cb.lastName}` : '';
          return na.localeCompare(nb, 'it');
        },
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
        accessorKey: 'status',
        header: 'Stato',
        cell: ({ getValue }) => {
          const s = getValue() as string;
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[s] ?? ''}`}>
              {STATUS_LABELS[s] ?? s}
            </span>
          );
        },
      },
    ],
    [clients]
  );

  const table = useReactTable({
    data: filteredData,
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
    manualFiltering: true,
  });

  return (
    <>
      <div className="flex flex-col gap-4 w-full">
        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center flex-1 max-w-sm">
            <Search className="absolute left-2.5 size-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cerca fiche..."
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
          <FacetedFilter label="Stato" options={STATUS_OPTIONS} selected={selectedStatuses} onChange={setSelectedStatuses} />
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
                    Caricando fiches...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-sm text-zinc-400">
                    Nessuna fiche trovata.
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
                        {row.original.status !== FicheStatus.COMPLETED && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedFiche(row.original); setShowCheckout(true); }}
                            className="p-1.5 rounded-md text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                            title="Chiudi Fiche"
                          >
                            <ReceiptText className="size-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedFiche(row.original); setShowDelete(true); }}
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
      <CheckoutFicheModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        fiche={selectedFiche}
      />
    </>
  );
}
