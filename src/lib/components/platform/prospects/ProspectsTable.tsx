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
import { ChevronUp, ChevronDown, Trash2, ExternalLink, Pencil } from 'lucide-react';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { useFitPageSize } from '@/lib/hooks/useFitPageSize';
import { useTableColumnPrefs } from '@/lib/hooks/useTableColumnPrefs';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import { Button } from '@/lib/components/shared/ui/Button';
import { cardStyle } from '@/lib/const/appearance';
import { Prospect } from '@/lib/types/Prospect';
import { ProspectStatusChip } from './ProspectStatusChip';

interface ProspectsTableProps {
  prospects: Prospect[];
  onEdit:    (p: Prospect) => void;
  onDelete:  (p: Prospect) => void;
}

export function useProspectColumns(): ColumnDef<Prospect>[] {
  return useMemo<ColumnDef<Prospect>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Salone',
      cell: ({ row }) => (
        <span className="font-medium text-foreground truncate max-w-[14rem] inline-block">
          {row.original.name}
        </span>
      ),
      meta: { requiredVisible: true },
    },
    {
      id: 'comune',
      header: 'Comune',
      accessorFn: (row) => row.city ?? '',
      cell: ({ row }) => {
        const p = row.original;
        if (!p.city) return <span className="text-muted-foreground italic">—</span>;
        return (
          <span className="inline-flex items-center gap-1.5">
            <span>{p.city}</span>
            {p.province && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {p.province}
              </span>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: 'region',
      header: 'Regione',
      cell: ({ getValue }) =>
        getValue() ? <span>{getValue() as string}</span> : <span className="text-muted-foreground italic">—</span>,
    },
    {
      accessorKey: 'phone_shop',
      header: 'Telefono salone',
      enableSorting: false,
      cell: ({ row }) => {
        const phone = row.original.phone_shop;
        if (!phone) return <span className="text-muted-foreground italic">—</span>;
        const link = row.original.whatsappUrl(phone);
        return (
          <span
            data-no-row-click
            className="cursor-pointer text-foreground hover:text-[var(--lume-accent)] transition-colors"
            onClick={() => link && window.open(link, '_blank')}
          >
            {phone}
          </span>
        );
      },
    },
    {
      accessorKey: 'phone_personal',
      header: 'Tel. titolare',
      enableSorting: false,
      cell: ({ row }) => {
        const phone = row.original.phone_personal;
        if (!phone) return <span className="text-muted-foreground italic">—</span>;
        const link = row.original.whatsappUrl(phone);
        return (
          <span
            data-no-row-click
            className="cursor-pointer text-foreground hover:text-[var(--lume-accent)] transition-colors"
            onClick={() => link && window.open(link, '_blank')}
          >
            {phone}
          </span>
        );
      },
    },
    {
      accessorKey: 'owner_name',
      header: 'Titolare',
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        return v ? <span>{v}</span> : <span className="text-muted-foreground italic">—</span>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Stato',
      cell: ({ row }) => <ProspectStatusChip status={row.original.status} />,
      meta: { requiredVisible: true },
    },
    {
      accessorKey: 'callback_at',
      header: 'Da richiamare',
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        if (!v) return <span className="text-muted-foreground italic">—</span>;
        const d = new Date(v);
        const now = Date.now();
        const overdue = d.getTime() < now;
        return (
          <span className={overdue ? 'text-[var(--lume-danger-fg)] font-medium tabular-nums' : 'tabular-nums'}>
            {d.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </span>
        );
      },
    },
    {
      accessorKey: 'last_call_at',
      header: 'Ultima chiamata',
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        return v
          ? <span className="tabular-nums">{new Date(v).toLocaleDateString('it-IT')}</span>
          : <span className="text-muted-foreground italic">—</span>;
      },
    },
    {
      accessorKey: 'call_count',
      header: 'Chiamate',
      cell: ({ getValue }) => <span className="tabular-nums">{getValue() as number}</span>,
    },
    {
      accessorKey: 'current_software',
      header: 'Software',
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        return v
          ? <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{v}</span>
          : <span className="text-muted-foreground italic">—</span>;
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Aggiunto',
      cell: ({ getValue }) => (
        <span className="text-muted-foreground tabular-nums text-xs">
          {new Date(getValue() as string).toLocaleDateString('it-IT')}
        </span>
      ),
    },
  ], []);
}

export function ProspectsTable({ prospects, onEdit, onDelete }: ProspectsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }]);
  const [pageIndex, setPageIndex] = useState(0);
  const { ref: tableCardRef, pageSize } = useFitPageSize<HTMLDivElement>({ rowPx: 49 });

  useEffect(() => { setPageIndex(0); }, [prospects.length]);

  const columns = useProspectColumns();

  const { columnVisibility, columnOrder, setColumnVisibility, setColumnOrder } =
    useTableColumnPrefs('prospects', columns);

  const table = useReactTable({
    data: prospects,
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
  });

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 w-full">
      <div ref={tableCardRef} className="flex-1 min-h-0 w-full">
        <div className={`max-h-full w-full overflow-x-auto overflow-y-hidden ${cardStyle}`}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted  = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        className={[
                          'px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide select-none whitespace-nowrap text-left',
                          canSort ? 'cursor-pointer hover:text-foreground transition-colors' : '',
                        ].join(' ')}
                      >
                        <span className="inline-flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            <span className="flex flex-col">
                              <ChevronUp   className={`size-3   ${sorted === 'asc'  ? 'text-[var(--lume-accent)]' : 'text-muted-foreground/40'}`} />
                              <ChevronDown className={`size-3 -mt-1 ${sorted === 'desc' ? 'text-[var(--lume-accent)]' : 'text-muted-foreground/40'}`} />
                            </span>
                          )}
                        </span>
                      </th>
                    );
                  })}
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide text-right w-20">
                    Azioni
                  </th>
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Nessun prospect corrispondente ai filtri.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button, a, [data-no-row-click]')) return;
                      onEdit(row.original);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target === e.currentTarget) onEdit(row.original);
                    }}
                    role="button"
                    tabIndex={0}
                    className="bg-card hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2 text-sm text-foreground">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                    <td className="px-4 py-2">
                      <div className="flex flex-row items-center justify-end gap-1">
                        {row.original.google_maps_url && (
                          <Tooltip label="Apri su Maps">
                            <Button
                              variant="ghost"
                              size="sm"
                              iconOnly
                              aria-label="Apri su Maps"
                              onClick={(e) => { e.stopPropagation(); window.open(row.original.google_maps_url!, '_blank'); }}
                            >
                              <ExternalLink />
                            </Button>
                          </Tooltip>
                        )}
                        <Tooltip label="Modifica">
                          <Button
                            variant="ghost"
                            size="sm"
                            iconOnly
                            aria-label="Modifica"
                            onClick={(e) => { e.stopPropagation(); onEdit(row.original); }}
                          >
                            <Pencil />
                          </Button>
                        </Tooltip>
                        <Tooltip label="Elimina">
                          <Button
                            variant="ghost"
                            size="sm"
                            iconOnly
                            aria-label="Elimina"
                            onClick={(e) => { e.stopPropagation(); onDelete(row.original); }}
                          >
                            <Trash2 />
                          </Button>
                        </Tooltip>
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
        totalItems={prospects.length}
        itemsPerPage={pageSize}
        labelPlural="prospect"
      />
    </div>
  );
}
