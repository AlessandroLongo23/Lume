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
  type RowSelectionState,
} from '@tanstack/react-table';
import { Search, X, ChevronUp, ChevronDown, Trash2, Plane, ArchiveRestore, NotebookText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useClientsStore } from '@/lib/stores/clients';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useClientRatingsStore } from '@/lib/stores/client_ratings';
import { useClientStatsStore } from '@/lib/stores/client_stats';
import { usePreferencesStore } from '@/lib/stores/preferences';
import { Client } from '@/lib/types/Client';
import { formatCurrency } from '@/lib/utils/format';
import { daysUntilBirthday } from '@/lib/utils/date';
import { colorForClient } from '@/lib/utils/clientColor';
import { FACTORY_PREFERENCES } from '@/lib/const/factory-defaults';
import { FacetedFilter } from '@/lib/components/admin/table/FacetedFilter';
import { ColumnPicker } from '@/lib/components/admin/table/ColumnPicker';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { ExportMenu } from '@/lib/components/shared/ui/ExportMenu';
import type { ExportColumn } from '@/lib/utils/tableExport';
import { useTableColumnPrefs } from '@/lib/hooks/useTableColumnPrefs';
import { useFitPageSize } from '@/lib/hooks/useFitPageSize';
import { ClientRatingBadge } from './ClientRatingBadge';
import { IncompleteContactBadge } from './IncompleteContactBadge';
import { BirthdayBadge } from './BirthdayBadge';
import { DeleteClientModal } from './DeleteClientModal';
import { TreatmentHistory } from './TreatmentHistory';
import { SidePanel } from '@/lib/components/shared/ui/SidePanel';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import { Button } from '@/lib/components/shared/ui/Button';
import { Checkbox } from '@/lib/components/shared/ui/forms/Checkbox';
import { Select } from '@/lib/components/shared/ui/forms/Select';
import { Portal } from '@/lib/components/shared/ui/Portal';
import { DeleteAllModal } from '@/lib/components/shared/ui/modals/DeleteAllModal';
import { cardStyle } from '@/lib/const/appearance';

interface ClientsTableProps {
  clients: Client[];
  showArchived?: boolean;
}

const GENDER_OPTIONS = [
  { value: 'M', label: 'Uomo', prefix: <span className="text-xs font-semibold text-blue-500 mr-0.5">M</span> },
  { value: 'F', label: 'Donna', prefix: <span className="text-xs font-semibold text-pink-500 mr-0.5">F</span> },
];

const GENDER_BULK_OPTIONS = [
  { id: 'M', name: 'Uomo' },
  { id: 'F', name: 'Donna' },
];

export function ClientsTable({ clients, showArchived = false }: ClientsTableProps) {
  const router = useRouter();
  const isLoading = useClientsStore((s) => s.isLoading);
  const restoreClient = useClientsStore((s) => s.restoreClient);
  const bulkUpdateClients = useClientsStore((s) => s.bulkUpdateClients);
  const bulkArchiveClients = useClientsStore((s) => s.bulkArchiveClients);
  const bulkRestoreClients = useClientsStore((s) => s.bulkRestoreClients);
  const bulkDeleteClients = useClientsStore((s) => s.bulkDeleteClients);
  const ratings = useClientRatingsStore((s) => s.ratings);
  const stats = useClientStatsStore((s) => s.stats);
  const birthdayReminder =
    usePreferencesStore((s) => s.preferences.clientsTable?.birthdayReminder) ??
    FACTORY_PREFERENCES.clientsTable.birthdayReminder;

  const [showDelete, setShowDelete] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [schedaClient, setSchedaClient] = useState<Client | null>(null);

  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkArchiveConfirm, setBulkArchiveConfirm] = useState(false);
  const [bulkRestoreConfirm, setBulkRestoreConfirm] = useState(false);

  const selectedIds = Object.keys(rowSelection);
  const hasSelection = selectedIds.length > 0;

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
        id: 'select',
        enableSorting: false,
        size: 40,
        meta: { requiredVisible: true, pinned: 'start' },
        header: ({ table }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              size="sm"
              checked={table.getIsAllPageRowsSelected()}
              indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
              aria-label="Seleziona tutti"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()} data-no-row-click>
            <Checkbox
              size="sm"
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
              aria-label="Seleziona riga"
            />
          </div>
        ),
      },
      {
        id: 'color',
        header: '',
        size: 24,
        enableSorting: false,
        meta: { pickerLabel: 'Colore' },
        cell: ({ row }) => (
          <span
            className="inline-block size-2.5 rounded-full ring-1 ring-black/15 dark:ring-white/20"
            style={{ backgroundColor: colorForClient(row.original) }}
            aria-hidden
          />
        ),
      },
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
          if (!v) return <span className="text-zinc-400">—</span>;
          const daysLeft = birthdayReminder.enabled ? daysUntilBirthday(v) : null;
          const showBadge =
            daysLeft !== null && daysLeft <= birthdayReminder.daysAhead;
          return (
            <span className="inline-flex items-center gap-2">
              <span className="tabular-nums">{new Date(v).toLocaleDateString('it-IT')}</span>
              {showBadge && <BirthdayBadge daysLeft={daysLeft} />}
            </span>
          );
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
    [ratings, stats, birthdayReminder]
  );

  const { columnVisibility, columnOrder, setColumnVisibility, setColumnOrder } =
    useTableColumnPrefs('clients', columns);

  // Export descriptors — flat primitives, separate from the React/TanStack
  // column defs because the rendered cells contain badges, icons and links.
  const exportColumns: ExportColumn<Client>[] = useMemo(
    () => [
      { label: 'Nome', accessor: (c) => c.firstName },
      { label: 'Cognome', accessor: (c) => c.lastName },
      { label: 'Email', accessor: (c) => c.email },
      { label: 'Prefisso', accessor: (c) => c.phonePrefix },
      { label: 'Telefono', accessor: (c) => c.phoneNumber },
      { label: 'Genere', accessor: (c) => (c.gender === 'M' ? 'Uomo' : c.gender === 'F' ? 'Donna' : '') },
      { label: 'Data di nascita', accessor: (c) => (c.birthDate ? new Date(c.birthDate) : null) },
      { label: 'Turista', accessor: (c) => c.isTourist },
      { label: 'Visite', accessor: (c) => stats[c.id]?.visit_count ?? 0 },
      { label: 'Speso (€)', accessor: (c) => stats[c.id]?.total_spent ?? 0 },
      { label: 'Scontrino medio (€)', accessor: (c) => stats[c.id]?.avg_ticket ?? 0 },
      { label: 'Prima visita', accessor: (c) => stats[c.id]?.first_visit ?? null },
      { label: 'Ultima visita', accessor: (c) => stats[c.id]?.last_visit ?? null },
      { label: 'Servizio preferito', accessor: (c) => stats[c.id]?.top_service_name ?? '' },
      { label: 'Operatore preferito', accessor: (c) => stats[c.id]?.top_operator_name ?? '' },
    ],
    [stats],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      pagination: { pageIndex, pageSize },
      columnVisibility,
      columnOrder,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater;
      setPageIndex(next.pageIndex);
    },
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    enableRowSelection: true,
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
        {/* Toolbar — transforms to action bar when rows are selected */}
        {hasSelection ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-primary">
              {selectedIds.length} {selectedIds.length === 1 ? 'selezionato' : 'selezionati'}
            </span>
            <span className="text-zinc-400 dark:text-zinc-600">·</span>

            <Select
              value={null}
              onChange={(v) => {
                if (!v) return;
                setBulkLoading(true);
                bulkUpdateClients(selectedIds, { gender: v })
                  .then(() => {
                    messagePopup.getState().success(`Genere aggiornato per ${selectedIds.length} clienti`);
                    setRowSelection({});
                  })
                  .catch(() => messagePopup.getState().error('Errore durante l\'aggiornamento'))
                  .finally(() => setBulkLoading(false));
              }}
              options={GENDER_BULK_OPTIONS}
              labelKey="name"
              valueKey="id"
              placeholder="Genere"
              disabled={bulkLoading}
              size="md"
              width="w-32"
            />

            {showArchived ? (
              <button
                onClick={() => setBulkRestoreConfirm(true)}
                disabled={bulkLoading}
                className="inline-flex items-center h-[var(--lume-control-h-md)] gap-[var(--lume-control-gap-md)] px-[var(--lume-control-px-md)] text-[length:var(--lume-control-text-md)] rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                <ArchiveRestore className="size-4" />
                Ripristina
              </button>
            ) : (
              <button
                onClick={() => setBulkArchiveConfirm(true)}
                disabled={bulkLoading}
                className="inline-flex items-center h-[var(--lume-control-h-md)] gap-[var(--lume-control-gap-md)] px-[var(--lume-control-px-md)] text-[length:var(--lume-control-text-md)] rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                <ArchiveRestore className="size-4" />
                Archivia
              </button>
            )}

            <button
              onClick={() => setBulkDeleteConfirm(true)}
              disabled={bulkLoading}
              className="inline-flex items-center h-[var(--lume-control-h-md)] gap-[var(--lume-control-gap-md)] px-[var(--lume-control-px-md)] text-[length:var(--lume-control-text-md)] rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              <Trash2 className="size-4" />
              Elimina
            </button>

            <button
              onClick={() => setRowSelection({})}
              className="ml-auto inline-flex items-center h-[var(--lume-control-h-md)] gap-[var(--lume-control-gap-md)] px-[var(--lume-control-px-md)] text-[length:var(--lume-control-text-md)] rounded-lg text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <X className="size-4" />
              Annulla
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="relative flex items-center flex-1 max-w-sm">
              <Search className="absolute left-2.5 size-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cerca cliente..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full h-[var(--lume-control-h-md)] pl-9 pr-8 text-[length:var(--lume-control-text-md)] bg-transparent border rounded-lg
                  border-zinc-200 dark:border-zinc-800
                  focus:border-zinc-300 dark:focus:border-zinc-700
                  text-zinc-900 dark:text-zinc-100
                  placeholder:text-zinc-400 outline-none transition-colors"
              />
              {globalFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  aria-label="Azzera ricerca"
                  onClick={() => setGlobalFilter('')}
                  className="absolute right-1"
                >
                  <X />
                </Button>
              )}
            </div>
            <FacetedFilter label="Genere" options={GENDER_OPTIONS} selected={selectedGenders} onChange={setSelectedGenders} />
            <div className="ml-auto flex items-center gap-2">
              <ExportMenu
                rows={filteredData}
                columns={exportColumns}
                baseName={showArchived ? 'clienti-archiviati' : 'clienti'}
                pdfTitle={showArchived ? 'Clienti archiviati' : 'Anagrafica clienti'}
              />
              <ColumnPicker tableId="clients" columns={columns} />
            </div>
          </div>
        )}

        {/* Table */}
        <div ref={tableCardRef} className="flex-1 min-h-0 w-full">
          <div className={`max-h-full w-full overflow-x-auto overflow-y-hidden ${cardStyle}`}>
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="group">
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    const isSelect = header.column.id === 'select';
                    return (
                      <th
                        key={header.id}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        className={[
                          'px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide select-none whitespace-nowrap text-left',
                          canSort ? 'cursor-pointer hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors' : '',
                          isSelect ? 'w-10' : '',
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
                      if (hasSelection) { row.toggleSelected(); return; }
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
                      <td key={cell.id} className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex flex-row items-center justify-end gap-1">
                        <Tooltip label="Scheda tecnica">
                          <Button
                            variant="ghost"
                            size="sm"
                            iconOnly
                            aria-label="Scheda tecnica"
                            onClick={(e) => { e.stopPropagation(); setSchedaClient(row.original); }}
                          >
                            <NotebookText />
                          </Button>
                        </Tooltip>
                        {showArchived ? (
                          <Tooltip label="Ripristina">
                            <Button
                              variant="ghost"
                              size="sm"
                              iconOnly
                              aria-label="Ripristina"
                              onClick={(e) => { e.stopPropagation(); handleRestore(row.original); }}
                            >
                              <ArchiveRestore />
                            </Button>
                          </Tooltip>
                        ) : (
                          <Tooltip label="Elimina">
                            <Button
                              variant="ghost"
                              size="sm"
                              iconOnly
                              aria-label="Elimina"
                              onClick={(e) => { e.stopPropagation(); setSelectedClient(row.original); setShowDelete(true); }}
                            >
                              <Trash2 />
                            </Button>
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

      {/* Bulk archive confirm */}
      {bulkArchiveConfirm && (
        <Portal>
          <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-full max-w-sm shadow-xl">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Archivia {selectedIds.length} {selectedIds.length === 1 ? 'cliente' : 'clienti'}?
              </h3>
              <p className="text-sm text-zinc-500 mb-6">
                I clienti archiviati non saranno visibili nella lista principale.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setBulkArchiveConfirm(false)}>Annulla</Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    setBulkArchiveConfirm(false);
                    setBulkLoading(true);
                    try {
                      await bulkArchiveClients(selectedIds);
                      messagePopup.getState().success(`${selectedIds.length} clienti archiviati`);
                      setRowSelection({});
                    } catch {
                      messagePopup.getState().error('Errore durante l\'archiviazione');
                    } finally {
                      setBulkLoading(false);
                    }
                  }}
                >
                  Archivia
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Bulk restore confirm */}
      {bulkRestoreConfirm && (
        <Portal>
          <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-full max-w-sm shadow-xl">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Ripristina {selectedIds.length} {selectedIds.length === 1 ? 'cliente' : 'clienti'}?
              </h3>
              <p className="text-sm text-zinc-500 mb-6">
                I clienti torneranno visibili nella lista principale.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setBulkRestoreConfirm(false)}>Annulla</Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    setBulkRestoreConfirm(false);
                    setBulkLoading(true);
                    try {
                      await bulkRestoreClients(selectedIds);
                      messagePopup.getState().success(`${selectedIds.length} clienti ripristinati`);
                      setRowSelection({});
                    } catch {
                      messagePopup.getState().error('Errore durante il ripristino');
                    } finally {
                      setBulkLoading(false);
                    }
                  }}
                >
                  Ripristina
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      <DeleteAllModal
        isOpen={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        entityLabel="clienti"
        count={selectedIds.length}
        mode="selected"
        cascadeNotice={
          <>
            Verranno cancellate anche <strong>tutte le fiche</strong>, gli abbonamenti e i coupon
            collegati ai clienti selezionati. Lo storico del bilancio risulterà
            <strong> permanentemente alterato</strong>.
          </>
        }
        onConfirm={async () => {
          await bulkDeleteClients(selectedIds);
          setRowSelection({});
        }}
      />
    </>
  );
}
