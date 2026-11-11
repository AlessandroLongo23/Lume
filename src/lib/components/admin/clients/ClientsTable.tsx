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
import { X, Trash2, Plane, ArchiveRestore, NotebookText, Globe, GlobeLock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useClientsStore } from '@/lib/stores/clients';
import { useSalonSettingsStore } from '@/lib/stores/salonSettings';
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
import { TextLink } from '@/lib/components/shared/ui/TextLink';
import { Button } from '@/lib/components/shared/ui/Button';
import { Checkbox } from '@/lib/components/shared/ui/forms/Checkbox';
import { Select } from '@/lib/components/shared/ui/forms/Select';
import { ConfirmDialog } from '@/lib/components/shared/ui/modals/ConfirmDialog';
import { DeleteAllModal } from '@/lib/components/shared/ui/modals/DeleteAllModal';
import { Searchbar } from '@/lib/components/shared/ui/Searchbar';
import { tableCardClass, tableClass, theadClass, thClass, trClass, tdClass, cellStrongClass, cellNumClass, tableMessageClass, CellEmpty, SortIndicator } from '@/lib/components/shared/ui/table/tableStyles';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import { StatusDot } from '@/lib/components/shared/ui/StatusDot';

interface ClientsTableProps {
  clients: Client[];
  showArchived?: boolean;
}

const GENDER_OPTIONS = [
  { value: 'M', label: 'Uomo', prefix: <span className="tabular-nums text-xs text-[var(--lume-text-muted)] mr-0.5">M</span> },
  { value: 'F', label: 'Donna', prefix: <span className="tabular-nums text-xs text-[var(--lume-text-muted)] mr-0.5">F</span> },
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
  // Whitelist bulk-edit is only meaningful in `selected` access mode — the
  // flag is ignored by the server in the other modes (see is_client_allowed_to_book).
  const isSelectedMode =
    useSalonSettingsStore((s) => s.settings?.booking_config?.access_mode) === 'selected';
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
    if (selectedGenders.length > 0) data = data.filter((c) => c.gender !== null && selectedGenders.includes(c.gender));
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
            className="inline-block size-2.5 rounded-full shadow-[inset_0_0_0_1px_var(--lume-edge)]"
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
            <span className={cellStrongClass}>{getValue() as string}</span>
            {row.original.hasIncompleteContact && <IncompleteContactBadge variant="icon" />}
          </span>
        ),
        meta: { requiredVisible: true },
      },
      {
        accessorKey: 'lastName',
        header: 'Cognome',
        cell: ({ getValue }) => <span className={cellStrongClass}>{getValue() as string}</span>,
        meta: { requiredVisible: true },
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => {
          const email = row.original.email;
          if (!email) return <CellEmpty />;
          return (
            <TextLink quiet data-no-row-click href={`mailto:${email}`} target="_blank" className="text-inherit">
              {email}
            </TextLink>
          );
        },
      },
      {
        id: 'phone',
        header: 'Telefono',
        cell: ({ row }) => {
          const { phonePrefix, phoneNumber } = row.original;
          if (!phonePrefix || !phoneNumber) return <CellEmpty />;
          return (
            <TextLink
              quiet
              data-no-row-click
              href={`https://wa.me/${`${phonePrefix}${phoneNumber}`.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-inherit tabular-nums text-compact"
            >
              {phonePrefix} {phoneNumber}
            </TextLink>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: 'gender',
        header: '',
        cell: ({ getValue }) => {
          const g = getValue() as string;
          if (g === 'M') return <Tooltip label="Uomo"><span className="tabular-nums text-xs text-[var(--lume-text-secondary)]">M</span></Tooltip>;
          if (g === 'F') return <Tooltip label="Donna"><span className="tabular-nums text-xs text-[var(--lume-text-secondary)]">F</span></Tooltip>;
          return <CellEmpty />;
        },
        meta: { pickerLabel: 'Genere' },
      },
      {
        accessorKey: 'birthDate',
        header: 'Data di nascita',
        cell: ({ getValue }) => {
          const v = getValue() as string;
          if (!v) return <CellEmpty />;
          const daysLeft = birthdayReminder.enabled ? daysUntilBirthday(v) : null;
          const showBadge =
            daysLeft !== null && daysLeft <= birthdayReminder.daysAhead;
          return (
            <span className="inline-flex items-center gap-2">
              <span className={cellNumClass}>{new Date(v).toLocaleDateString('it-IT')}</span>
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
          return <span className={cellNumClass}>{n}</span>;
        },
      },
      {
        id: 'total_spent',
        header: 'Speso',
        accessorFn: (row) => stats[row.id]?.total_spent ?? 0,
        cell: ({ row }) => {
          const v = stats[row.original.id]?.total_spent ?? 0;
          return <span className={`${cellNumClass} text-[var(--lume-text)]`}>{formatCurrency(v)}</span>;
        },
      },
      {
        id: 'avg_ticket',
        header: 'Scontrino medio',
        accessorFn: (row) => stats[row.id]?.avg_ticket ?? 0,
        cell: ({ row }) => {
          const s = stats[row.original.id];
          if (!s || s.visit_count === 0) return <CellEmpty />;
          return <span className={cellNumClass}>{formatCurrency(s.avg_ticket)}</span>;
        },
      },
      {
        id: 'first_visit',
        header: 'Prima visita',
        accessorFn: (row) => stats[row.id]?.first_visit?.getTime() ?? 0,
        cell: ({ row }) => {
          const d = stats[row.original.id]?.first_visit;
          if (!d) return <CellEmpty />;
          return <span className={cellNumClass}>{d.toLocaleDateString('it-IT')}</span>;
        },
      },
      {
        id: 'last_visit',
        header: 'Ultima visita',
        accessorFn: (row) => stats[row.id]?.last_visit?.getTime() ?? 0,
        cell: ({ row }) => {
          const s = stats[row.original.id];
          if (!s?.last_visit) return <CellEmpty />;
          const days = s.daysSinceLastVisit() ?? 0;
          const tone = days < 30 ? 'success' : days < 90 ? 'warning' : 'danger';
          return (
            <div className="flex flex-row items-center gap-2.5">
              <span className={cellNumClass}>{s.last_visit.toLocaleDateString('it-IT')}</span>
              <StatusDot tone={tone} className="text-xs text-[var(--lume-text-muted)]">
                {days === 0 ? 'oggi' : days === 1 ? 'ieri' : `${days} giorni fa`}
              </StatusDot>
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
          if (!name) return <CellEmpty />;
          return <span className="truncate max-w-40 inline-block">{name}</span>;
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
          if (!name) return <CellEmpty />;
          return <span className="truncate max-w-40 inline-block">{name}</span>;
        },
      },
      {
        id: 'created_at',
        header: 'Cliente dal',
        accessorFn: (row) => (row.created_at ? new Date(row.created_at).getTime() : 0),
        cell: ({ row }) => {
          const v = row.original.created_at;
          if (!v) return <CellEmpty />;
          return <span className={cellNumClass}>{new Date(v).toLocaleDateString('it-IT')}</span>;
        },
      },
      {
        accessorKey: 'isTourist',
        header: '',
        cell: ({ getValue }) =>
          getValue() ? <Plane className="size-4 text-[var(--lume-text-muted)]" aria-label="Turista" /> : null,
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
      { label: 'Cliente dal', accessor: (c) => (c.created_at ? new Date(c.created_at) : null) },
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
            <span className="text-sm font-medium text-[var(--lume-text)]">
              <span className="tabular-nums">{selectedIds.length}</span> {selectedIds.length === 1 ? 'selezionato' : 'selezionati'}
            </span>
            <span className="text-[var(--lume-text-muted)]" aria-hidden>·</span>

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
              className="w-32"
            />

            {isSelectedMode && !showArchived && (
              <>
                <Button
                  variant="secondary"
                  leadingIcon={Globe}
                  onClick={() => {
                    setBulkLoading(true);
                    bulkUpdateClients(selectedIds, { can_book_online: true })
                      .then(() => {
                        messagePopup
                          .getState()
                          .success(`${selectedIds.length} clienti abilitati alle prenotazioni online`);
                        setRowSelection({});
                      })
                      .catch(() => messagePopup.getState().error("Errore durante l'aggiornamento"))
                      .finally(() => setBulkLoading(false));
                  }}
                  disabled={bulkLoading}
                >
                  Abilita online
                </Button>
                <Button
                  variant="secondary"
                  leadingIcon={GlobeLock}
                  onClick={() => {
                    setBulkLoading(true);
                    bulkUpdateClients(selectedIds, { can_book_online: false })
                      .then(() => {
                        messagePopup
                          .getState()
                          .success(`${selectedIds.length} clienti disabilitati dalle prenotazioni online`);
                        setRowSelection({});
                      })
                      .catch(() => messagePopup.getState().error("Errore durante l'aggiornamento"))
                      .finally(() => setBulkLoading(false));
                  }}
                  disabled={bulkLoading}
                >
                  Disabilita online
                </Button>
              </>
            )}

            {showArchived ? (
              <Button
                variant="secondary"
                leadingIcon={ArchiveRestore}
                onClick={() => setBulkRestoreConfirm(true)}
                disabled={bulkLoading}
              >
                Ripristina
              </Button>
            ) : (
              <Button
                variant="secondary"
                leadingIcon={ArchiveRestore}
                onClick={() => setBulkArchiveConfirm(true)}
                disabled={bulkLoading}
              >
                Archivia
              </Button>
            )}

            <Button
              variant="ghost-destructive"
              leadingIcon={Trash2}
              onClick={() => setBulkDeleteConfirm(true)}
              disabled={bulkLoading}
            >
              Elimina
            </Button>

            <Button
              variant="ghost"
              leadingIcon={X}
              className="ml-auto"
              onClick={() => setRowSelection({})}
            >
              Annulla
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Searchbar
              className="basis-full sm:basis-auto sm:flex-1 sm:max-w-sm"
              placeholder="Cerca cliente..."
              value={globalFilter}
              onChange={setGlobalFilter}
            />
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
          <div className={`max-h-full w-full overflow-x-auto overflow-y-hidden ${tableCardClass}`}>
          <table className={tableClass}>
            <thead className={theadClass}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    const isSelect = header.column.id === 'select';
                    return (
                      <th
                        key={header.id}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                        className={`${thClass({ sortable: canSort })} ${isSelect ? 'w-10' : ''}`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && <SortIndicator direction={sorted} />}
                        </span>
                      </th>
                    );
                  })}
                  <th className={`${thClass({ align: 'right' })} w-24`}>
                    <span className="sr-only">Azioni</span>
                  </th>
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length + 1} className={tableMessageClass}>
                    Caricando clienti...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className={tableMessageClass}>
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
                    className={trClass({ selected: row.getIsSelected() })}
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
                          aria-label="Scheda tecnica"
                          onClick={(e) => { e.stopPropagation(); setSchedaClient(row.original); }}
                        >
                          <NotebookText />
                        </Button>
                        {showArchived ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            iconOnly
                            aria-label="Ripristina"
                            onClick={(e) => { e.stopPropagation(); handleRestore(row.original); }}
                          >
                            <ArchiveRestore />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            iconOnly
                            aria-label="Elimina"
                            onClick={(e) => { e.stopPropagation(); setSelectedClient(row.original); setShowDelete(true); }}
                          >
                            <Trash2 />
                          </Button>
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
      <ConfirmDialog
        isOpen={bulkArchiveConfirm}
        onClose={() => setBulkArchiveConfirm(false)}
        tone="default"
        title={`Archivia ${selectedIds.length} ${selectedIds.length === 1 ? 'cliente' : 'clienti'}?`}
        description="I clienti archiviati non saranno visibili nella lista principale."
        confirmLabel="Archivia"
        onConfirm={async () => {
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
      />

      {/* Bulk restore confirm */}
      <ConfirmDialog
        isOpen={bulkRestoreConfirm}
        onClose={() => setBulkRestoreConfirm(false)}
        tone="default"
        title={`Ripristina ${selectedIds.length} ${selectedIds.length === 1 ? 'cliente' : 'clienti'}?`}
        description="I clienti torneranno visibili nella lista principale."
        confirmLabel="Ripristina"
        onConfirm={async () => {
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
      />

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
