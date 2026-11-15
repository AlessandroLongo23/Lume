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
import { Trash2, ExternalLink, Pencil } from 'lucide-react';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { useFitPageSize } from '@/lib/hooks/useFitPageSize';
import { useTableColumnPrefs } from '@/lib/hooks/useTableColumnPrefs';
import { Button } from '@/lib/components/shared/ui/Button';
import {
  SortIndicator,
  tableCardClass,
  tableClass,
  tableMessageClass,
  tbodyClass,
  tdClass,
  thClass,
  theadClass,
  trClass,
} from '@/lib/components/shared/ui/table/tableStyles';
import { cn } from '@/lib/utils';
import { Prospect } from '@/lib/types/Prospect';
import { TextLink } from '@/lib/components/shared/ui/TextLink';
import { ProspectStatusChip } from './ProspectStatusChip';

interface ProspectsTableProps {
  prospects: Prospect[];
  onEdit:    (p: Prospect) => void;
  onDelete:  (p: Prospect) => void;
}

/** A phone number that opens the WhatsApp chat in a new tab (plain text when it has no digits). */
function WhatsAppPhone({ phone, url }: { phone: string; url: string | null }) {
  if (!url) return <span className="tabular-nums text-[var(--lume-text)]">{phone}</span>;
  return (
    <TextLink href={url} target="_blank" rel="noopener noreferrer" data-no-row-click className="tabular-nums font-normal">
      {phone}
    </TextLink>
  );
}

export function useProspectColumns(): ColumnDef<Prospect>[] {
  return useMemo<ColumnDef<Prospect>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Salone',
      cell: ({ row }) => (
        <span className="font-medium text-[var(--lume-text)] truncate max-w-56 inline-block">
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
        if (!p.city) return <span className="text-[var(--lume-text-muted)]">—</span>;
        return (
          <span className="inline-flex items-center gap-1.5">
            <span>{p.city}</span>
            {p.province && (
              <span className="text-2xs tabular-nums px-1.5 py-0.5 rounded-md bg-active text-[var(--lume-text-secondary)]">
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
        getValue() ? <span>{getValue() as string}</span> : <span className="text-[var(--lume-text-muted)]">—</span>,
    },
    {
      accessorKey: 'phone_shop',
      header: 'Telefono salone',
      enableSorting: false,
      cell: ({ row }) => {
        const phone = row.original.phone_shop;
        if (!phone) return <span className="text-[var(--lume-text-muted)]">—</span>;
        return <WhatsAppPhone phone={phone} url={row.original.whatsappUrl(phone)} />;
      },
    },
    {
      accessorKey: 'phone_personal',
      header: 'Tel. titolare',
      enableSorting: false,
      cell: ({ row }) => {
        const phone = row.original.phone_personal;
        if (!phone) return <span className="text-[var(--lume-text-muted)]">—</span>;
        return <WhatsAppPhone phone={phone} url={row.original.whatsappUrl(phone)} />;
      },
    },
    {
      accessorKey: 'owner_name',
      header: 'Titolare',
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        return v ? <span>{v}</span> : <span className="text-[var(--lume-text-muted)]">—</span>;
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
        if (!v) return <span className="text-[var(--lume-text-muted)]">—</span>;
        const d = new Date(v);
        const now = Date.now();
        const overdue = d.getTime() < now;
        return (
          <span className={overdue ? 'text-danger-strong font-medium tabular-nums' : 'tabular-nums'}>
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
          : <span className="text-[var(--lume-text-muted)]">—</span>;
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
          ? <span className="text-xs px-1.5 py-0.5 rounded-md bg-active text-[var(--lume-text-secondary)]">{v}</span>
          : <span className="text-[var(--lume-text-muted)]">—</span>;
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Aggiunto',
      cell: ({ getValue }) => (
        <span className="text-[var(--lume-text-secondary)] tabular-nums text-xs">
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
        <div className={cn(tableCardClass, 'max-h-full w-full overflow-x-auto overflow-y-hidden')}>
          <table className={tableClass}>
            <thead className={theadClass}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted  = header.column.getIsSorted();
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
                  <th className={cn(thClass({ align: 'right' }), 'w-20')}>
                    Azioni
                  </th>
                </tr>
              ))}
            </thead>
            <tbody className={tbodyClass}>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className={tableMessageClass}>
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
                    className={trClass()}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className={cn(tdClass, 'text-[var(--lume-text)]')}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                    <td className={tdClass}>
                      <div className="flex flex-row items-center justify-end gap-1">
                        {row.original.google_maps_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            iconOnly
                            aria-label="Apri su Maps"
                            onClick={(e) => { e.stopPropagation(); window.open(row.original.google_maps_url!, '_blank'); }}
                          >
                            <ExternalLink />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          iconOnly
                          aria-label="Modifica"
                          onClick={(e) => { e.stopPropagation(); onEdit(row.original); }}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          iconOnly
                          aria-label="Elimina"
                          onClick={(e) => { e.stopPropagation(); onDelete(row.original); }}
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
        totalItems={prospects.length}
        itemsPerPage={pageSize}
        labelPlural="prospect"
      />
    </div>
  );
}
