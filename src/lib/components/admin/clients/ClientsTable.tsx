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
import { Search, X, ChevronUp, ChevronDown, Trash2, Plane, ArchiveRestore, NotebookText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useClientsStore } from '@/lib/stores/clients';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useClientRatingsStore } from '@/lib/stores/client_ratings';
import { useClientStatsStore } from '@/lib/stores/client_stats';
import { Client } from '@/lib/types/Client';
import { formatCurrency } from '@/lib/utils/format';
import { FacetedFilter } from '@/lib/components/admin/table/FacetedFilter';
import { ColumnPicker } from '@/lib/components/admin/table/ColumnPicker';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { useTableColumnPrefs } from '@/lib/hooks/useTableColumnPrefs';
import { useFitPageSize } from '@/lib/hooks/useFitPageSize';
import { ClientRatingBadge } from './ClientRatingBadge';
import { IncompleteContactBadge } from './IncompleteContactBadge';
import { DeleteClientModal } from './DeleteClientModal';
import { TreatmentHistory } from './TreatmentHistory';
import { SidePanel } from '@/lib/components/shared/ui/SidePanel';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import { cardStyle } from '@/lib/const/appearance';

interface ClientsTableProps {
  clients: Client[];
  showArchived?: boolean;
}

const GENDER_OPTIONS = [
  { value: 'M', label: 'Uomo', prefix: <span className="text-xs font-semibold text-blue-500 mr-0.5">M</span> },
  { value: 'F', label: 'Donna', prefix: <span className="text-xs font-semibold text-pink-500 mr-0.5">F</span> },
];

export function ClientsTable({ clients, showArchived = false }: ClientsTableProps) {
  const router = useRouter();
  const isLoading = useClientsStore((s) => s.isLoading);
  const restoreClient = useClientsStore((s) => s.restoreClient);
  const ratings = useClientRatingsStore((s) => s.ratings);
  const stats = useClientStatsStore((s) => s.stats);

  const [showDelete, setShowDelete] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [schedaClient, setSchedaClient] = useState<Client | null>(null);

  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);

  // Rating column stacks two badges, so rows are taller than typical tables.
  const { ref: tableCardRef, pageSize } = useFitPageSize<HTMLDivElement>({ rowPx: 53 });

  useEffect(() => { setPageIndex(0); }, [globalFilter, selectedGenders]);

  const filteredData = useMemo(() => {
    let data = clients;
    if (selectedGenders.length > 0) data = data.filter((c) => selectedGenders.includes(c.gender));
    if (globalFilter.trim()) {
      const q = globalFilter.toLowerCase();
      data = data.filter((c) =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        `${c.phonePrefix ?? ''} ${c.phoneNumber ?? ''}`.toLowerCase().includes(q)
      );
    }
    return data;
  }, [clients, selectedGenders, globalFilter]);

  // Clamp the active page if the dataset shrinks past it (filter, viewport, delete).
  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(filteredData.length / pageSize) - 1);
    if (pageIndex > lastPage) setPageIndex(lastPage);
  }, [pageSize, filteredData.length, pageIndex]);

  const columns = useMemo<ColumnDef<Client>[]>(
    () => [
      {
        id: 'rating',
        header: 'Valutazione',
        accessorFn: (row) => ratings[row.id]?.spend_stars ?? 0,
        cell: ({ row }) => {
          const r = ratings[row.original.id];
          return (
            <div className="flex flex-col gap-0.5">
              <ClientRatingBadge stars={r ? r.spend_stars : null} kind="money" />
              <ClientRatingBadge stars={r ? r.visit_stars : null} kind="calendar" />
            </div>
          );
        },
      },
      {
        accessorKey: 'firstName',
        header: 'Nome',
        cell: ({ getValue, row }) => (
          <span className="inline-flex items-center gap-1.5">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{getValue() as string}</span>
            {row.original.hasIncompleteContact && <IncompleteContactBadge variant="icon" />}
          </span>
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
        cell: ({ row }) => {
          const email = row.original.email;
          if (!email) return <span className="text-zinc-400 italic">—</span>;
          return (
            <span
              data-no-row-click
              className="cursor-pointer text-primary-hover dark:text-primary/70 hover:underline"
              onClick={() => window.open(`mailto:${email}`, '_blank')}
            >
              {email}
            </span>
          );
        },
      },
      {
        id: 'phone',
        header: 'Telefono',
        cell: ({ row }) => {
          const { phonePrefix, phoneNumber } = row.original;
          if (!phonePrefix || !phoneNumber) return <span className="text-zinc-400 italic">—</span>;
          return (
            <span
              data-no-row-click
              className="cursor-pointer hover:text-primary-hover dark:hover:text-primary/70 transition-colors"
              onClick={() => {
                const phone = `${phonePrefix}${phoneNumber}`.replace(/[^0-9]/g, '');
                window.open(`https://wa.me/${phone}`, '_blank');
              }}
            >
              {phonePrefix} {phoneNumber}
            </span>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: 'gender',
        header: '',
        cell: ({ getValue }) => {
          const g = getValue() as string;
          if (g === 'M') return <span className="text-sm font-semibold text-blue-500">M</span>;
          if (g === 'F') return <span className="text-sm font-semibold text-pink-500">F</span>;
          return <span className="text-zinc-400">—</span>;
        },
        meta: { pickerLabel: 'Genere' },
      },
      {
        accessorKey: 'birthDate',
        header: 'Data di nascita',
        cell: ({ getValue }) => {
          const v = getValue() as string;
          return v ? new Date(v).toLocaleDateString('it-IT') : <span className="text-zinc-400">—</span>;
        },
      },
      {
        id: 'visit_count',
        header: 'Visite',
        accessorFn: (row) => stats[row.id]?.visit_count ?? 0,
        cell: ({ row }) => {
          const n = stats[row.original.id]?.visit_count ?? 0;
          return <span className="tabular-nums">{n}</span>;
        },
      },
      {
        id: 'total_spent',
        header: 'Speso',
        accessorFn: (row) => stats[row.id]?.total_spent ?? 0,
        cell: ({ row }) => {
          const v = stats[row.original.id]?.total_spent ?? 0;
          return <span className="tabular-nums">{formatCurrency(v)}</span>;
        },
      },
      {
        id: 'avg_ticket',
        header: 'Scontrino medio',
        accessorFn: (row) => stats[row.id]?.avg_ticket ?? 0,
        cell: ({ row }) => {
          const s = stats[row.original.id];
          if (!s || s.visit_count === 0) return <span className="text-zinc-400">—</span>;
          return <span className="tabular-nums">{formatCurrency(s.avg_ticket)}</span>;
        },
      },
      {
        id: 'first_visit',
        header: 'Prima visita',
        accessorFn: (row) => stats[row.id]?.first_visit?.getTime() ?? 0,
        cell: ({ row }) => {
          const d = stats[row.original.id]?.first_visit;
          if (!d) return <span className="text-zinc-400">—</span>;
          return <span className="tabular-nums">{d.toLocaleDateString('it-IT')}</span>;
        },
      },
      {
        id: 'last_visit',
        header: 'Ultima visita',
        accessorFn: (row) => stats[row.id]?.last_visit?.getTime() ?? 0,
        cell: ({ row }) => {
          const s = stats[row.original.id];
          if (!s?.last_visit) return <span className="text-zinc-400">—</span>;
          const days = s.daysSinceLastVisit() ?? 0;
          const color =
            days < 30
              ? 'text-emerald-600 dark:text-emerald-400'
              : days < 90
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-red-600 dark:text-red-400';
          return (
            <div className="flex flex-row items-baseline gap-1.5">
              <span className="tabular-nums">{s.last_visit.toLocaleDateString('it-IT')}</span>
              <span className={`text-xs tabular-nums ${color}`}>
                {days === 0 ? 'oggi' : `${days}g fa`}
              </span>
            </div>
          );
        },
      },
      {
        id: 'top_service',
        header: 'Servizio preferito',
        accessorFn: (row) => stats[row.id]?.top_service_name ?? '',
        sortingFn: (a, b) =>
          (stats[a.original.id]?.top_service_name ?? '').localeCompare(
            stats[b.original.id]?.top_service_name ?? ''
          ),
        cell: ({ row }) => {
          const name = stats[row.original.id]?.top_service_name;
          if (!name) return <span className="text-zinc-400">—</span>;
          return <span className="truncate max-w-[10rem] inline-block">{name}</span>;
        },
      },
      {
        id: 'top_operator',
        header: 'Operatore preferito',
        accessorFn: (row) => stats[row.id]?.top_operator_name ?? '',
        sortingFn: (a, b) =>
          (stats[a.original.id]?.top_operator_name ?? '').localeCompare(
            stats[b.original.id]?.top_operator_name ?? ''
          ),
        cell: ({ row }) => {
          const name = stats[row.original.id]?.top_operator_name;
          if (!name) return <span className="text-zinc-400">—</span>;
          return <span className="truncate max-w-[10rem] inline-block">{name}</span>;
        },
      },
      {
        accessorKey: 'isTourist',
        header: '',
        cell: ({ getValue }) =>
          getValue() ? <Plane className="size-4 text-zinc-500" /> : null,
        enableSorting: false,
        meta: { pickerLabel: 'Turista' },
      },
    ],
    [ratings, stats]
  );

  const { columnVisibility, columnOrder, setColumnVisibility, setColumnOrder } =
    useTableColumnPrefs('clients', columns);

  const table = useReactTable({
    data: filteredData,
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

  const handleRestore = async (client: Client) => {
    try {
      await restoreClient(client.id);
      messagePopup.getState().success('Cliente ripristinato con successo.');
    } catch {
      messagePopup.getState().error('Errore durante il ripristino.');
    }
  };

  return (
    <>
      <div className="flex-1 min-h-0 flex flex-col gap-4 w-full">
        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center flex-1 max-w-sm">
            <Search className="absolute left-2.5 size-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cerca cliente..."
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
          <FacetedFilter label="Genere" options={GENDER_OPTIONS} selected={selectedGenders} onChange={setSelectedGenders} />
          <ColumnPicker tableId="clients" columns={columns} className="ml-auto" />
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
                    Caricando clienti...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-sm text-zinc-400">
                    Nessun cliente trovato.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button, a, [data-no-row-click]')) return;
                      router.push(`/admin/clienti/${row.original.id}`);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target === e.currentTarget) {
                        router.push(`/admin/clienti/${row.original.id}`);
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
                        <Tooltip label="Scheda tecnica">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSchedaClient(row.original); }}
                            className="p-1.5 rounded-md text-zinc-400 hover:text-primary dark:hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/10 transition-colors"
                          >
                            <NotebookText className="size-3.5" />
                          </button>
                        </Tooltip>
                        {showArchived ? (
                          <Tooltip label="Ripristina">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRestore(row.original); }}
                              className="p-1.5 rounded-md text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                            >
                              <ArchiveRestore className="size-3.5" />
                            </button>
                          </Tooltip>
                        ) : (
                          <Tooltip label="Elimina">
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedClient(row.original); setShowDelete(true); }}
                              className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </Tooltip>
                        )}
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
          labelPlural="clienti"
        />
      </div>

      <DeleteClientModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        selectedClient={selectedClient}
      />

      <SidePanel
        isOpen={!!schedaClient}
        onClose={() => setSchedaClient(null)}
        title={schedaClient ? `Scheda — ${schedaClient.getFullName()}` : 'Scheda tecnica'}
      >
        {schedaClient && <TreatmentHistory clientId={schedaClient.id} />}
      </SidePanel>
    </>
  );
}
