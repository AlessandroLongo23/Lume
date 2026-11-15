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
import { useFichesStore } from '@/lib/stores/fiches';
import { useClientsStore } from '@/lib/stores/clients';
import { useFicheServicesStore } from '@/lib/stores/fiche_services';
import { useServicesStore } from '@/lib/stores/services';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { DEFAULT_CATEGORY_COLOR } from '@/lib/const/category-colors';
import { Fiche, FICHE_BUCKET_LABELS, getFicheBucket } from '@/lib/types/Fiche';
import { Button } from '@/lib/components/shared/ui/Button';
import { Searchbar } from '@/lib/components/shared/ui/Searchbar';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { ColumnPicker } from '@/lib/components/admin/table/ColumnPicker';
import { ExportMenu } from '@/lib/components/shared/ui/ExportMenu';
import type { ExportColumn } from '@/lib/utils/tableExport';
import { useTableColumnPrefs } from '@/lib/hooks/useTableColumnPrefs';
import { useFitPageSize } from '@/lib/hooks/useFitPageSize';
import { FicheModal } from '@/lib/components/admin/fiches/FicheModal';
import { DeleteFicheModal } from './DeleteFicheModal';
import { tableCardClass, tableClass, theadClass, thClass, trClass, tdClass, cellStrongClass, cellNumClass, tableMessageClass, CellEmpty, SortIndicator } from '@/lib/components/shared/ui/table/tableStyles';
import { StatusDot } from '@/lib/components/shared/ui/StatusDot';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import { FICHE_BUCKET_TONE } from './ficheBucketTone';

interface FichesTableProps {
  fiches: Fiche[];
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  emptyText?: string;
}



export function FichesTable({ fiches, globalFilter, onGlobalFilterChange, emptyText }: FichesTableProps) {
  const isLoading = useFichesStore((s) => s.isLoading);
  const clients = useClientsStore((s) => s.clients);
  const ficheServices = useFicheServicesStore((s) => s.fiche_services);
  const services = useServicesStore((s) => s.services);
  const categories = useServiceCategoriesStore((s) => s.service_categories);

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const serviceMap = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
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
            <span className={cellStrongClass}>
              {client ? `${client.firstName} ${client.lastName}` : <CellEmpty />}
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
        cell: ({ row }) => (
          <span className={cellNumClass}>
            {new Date(row.original.datetime).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </span>
        ),
        enableSorting: true,
        sortingFn: (a, b) =>
          new Date(a.original.datetime).getTime() - new Date(b.original.datetime).getTime(),
      },
      {
        id: 'time',
        header: 'Ora',
        cell: ({ row }) => (
          <span className={cellNumClass}>
            {new Date(row.original.datetime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
          </span>
        ),
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
            .map((fs) => {
              const svc = serviceMap.get(fs.service_id);
              if (!svc) return null;
              const color = (svc.category_id ? categoryMap.get(svc.category_id)?.color : undefined) ?? DEFAULT_CATEGORY_COLOR;
              return { id: fs.id, name: svc.name, color };
            })
            .filter((e): e is { id: string; name: string; color: string } => e !== null);
          if (entries.length === 0) return <CellEmpty />;
          // Keep every row exactly one line tall: chips never wrap. Variable row
          // heights make useFitPageSize's "rows that fit" count oscillate and the
          // table flicker on narrow screens. Surplus services collapse into a +N
          // chip; the full list is one click away in the fiche modal.
          const MAX_CHIPS = 3;
          const shown = entries.slice(0, MAX_CHIPS);
          const overflow = entries.length - shown.length;
          return (
            <div className="flex items-center gap-1 overflow-hidden">
              {shown.map((entry) => (
                <span
                  key={entry.id}
                  className="inline-flex shrink-0 items-center h-6 px-2 rounded-md text-xs text-[var(--lume-text)] whitespace-nowrap"
                  // Category colour as a soft tint, same recipe as the calendar's FicheBlock.
                  style={{
                    backgroundColor: `color-mix(in oklab, ${entry.color} 16%, transparent)`,
                    boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${entry.color} 28%, transparent)`,
                  }}
                >
                  {entry.name}
                </span>
              ))}
              {overflow > 0 && (
                <Tooltip label={entries.slice(MAX_CHIPS).map((e) => e.name).join(', ')}>
                  <span className="inline-flex shrink-0 items-center h-6 px-1.5 rounded-md bg-active tabular-nums text-xs text-[var(--lume-text-secondary)] whitespace-nowrap">
                    +{overflow}
                  </span>
                </Tooltip>
              )}
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
            <span className={`${cellNumClass} text-[var(--lume-text)]`}>
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
            <StatusDot tone={FICHE_BUCKET_TONE[bucket]}>{FICHE_BUCKET_LABELS[bucket]}</StatusDot>
          );
        },
      },
    ],
    [clientMap, ficheServicesByFiche, serviceMap, categoryMap]
  );

  const { columnVisibility, columnOrder, setColumnVisibility, setColumnOrder } =
    useTableColumnPrefs('fiches', columns);

  const exportColumns: ExportColumn<Fiche>[] = useMemo(
    () => [
      {
        label: 'Cliente',
        accessor: (f) => {
          const c = clientMap.get(f.client_id);
          return c ? `${c.firstName} ${c.lastName}` : '';
        },
      },
      { label: 'Data', accessor: (f) => new Date(f.datetime) },
      {
        label: 'Servizi',
        accessor: (f) =>
          (ficheServicesByFiche.get(f.id) ?? [])
            .map((fs) => serviceMap.get(fs.service_id)?.name)
            .filter(Boolean)
            .join(', '),
      },
      { label: 'Totale (€)', accessor: (f) => f.getTotal() },
      { label: 'Stato', accessor: (f) => FICHE_BUCKET_LABELS[getFicheBucket(f)] },
    ],
    [clientMap, ficheServicesByFiche, serviceMap],
  );

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
        <div className="flex flex-wrap items-center gap-2">
          {showSearch && (
            <Searchbar
              className="basis-full sm:basis-auto sm:flex-1 sm:max-w-sm"
              placeholder="Cerca fiche..."
              value={globalFilter ?? ''}
              onChange={(v) => onGlobalFilterChange?.(v)}
            />
          )}
          <div className="ml-auto flex items-center gap-2">
            <ExportMenu
              rows={fiches}
              columns={exportColumns}
              baseName="fiches"
              pdfTitle="Elenco fiches"
            />
            <ColumnPicker tableId="fiches" columns={columns} />
          </div>
        </div>

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
                    return (
                      <th
                        key={header.id}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
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
                    <span className="sr-only">Azioni</span>
                  </th>
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length + 1} className={tableMessageClass}>
                    Caricando fiches...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className={tableMessageClass}>
                    {emptyText ?? 'Nessuna fiche trovata.'}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => { setSelectedFiche(row.original); setShowEdit(true); }}
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
                          onClick={(e) => { e.stopPropagation(); setSelectedFiche(row.original); setShowDelete(true); }}
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
