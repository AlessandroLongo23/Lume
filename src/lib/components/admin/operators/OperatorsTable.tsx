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
import { Trash2, ArchiveRestore, Clock } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import { useOperatorsStore } from '@/lib/stores/operators';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { Operator } from '@/lib/types/Operator';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { ColumnPicker } from '@/lib/components/admin/table/ColumnPicker';
import { ExportMenu } from '@/lib/components/shared/ui/ExportMenu';
import type { ExportColumn } from '@/lib/utils/tableExport';
import { Button } from '@/lib/components/shared/ui/Button';
import { useTableColumnPrefs } from '@/lib/hooks/useTableColumnPrefs';
import { useFitPageSize } from '@/lib/hooks/useFitPageSize';
import { DeleteOperatorModal } from './DeleteOperatorModal';
import { Searchbar } from '@/lib/components/shared/ui/Searchbar';
import { TextLink } from '@/lib/components/shared/ui/TextLink';

interface OperatorsTableProps {
  operators: Operator[];
  showArchived?: boolean;
}

export function OperatorsTable({ operators, showArchived = false }: OperatorsTableProps) {
  const router = useRouter();
  const isLoading = useOperatorsStore((s) => s.isLoading);
  const restoreOperator = useOperatorsStore((s) => s.restoreOperator);
  const pendingInvites = useOperatorsStore((s) => s.pendingInvites);
  const pendingEmailSet = useMemo(
    () => new Set(pendingInvites.map((inv) => inv.email.toLowerCase())),
    [pendingInvites],
  );

  const [showDelete, setShowDelete] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);

  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);

  const { ref: tableCardRef, pageSize } = useFitPageSize<HTMLDivElement>({ rowPx: 41 });

  useEffect(() => { setPageIndex(0); }, [globalFilter]);

  const filteredData = useMemo(() => {
    if (!globalFilter.trim()) return operators;
    const q = globalFilter.toLowerCase();
    return operators.filter((o) =>
      o.firstName.toLowerCase().includes(q) ||
      o.lastName.toLowerCase().includes(q) ||
      (o.email?.toLowerCase().includes(q) ?? false)
    );
  }, [operators, globalFilter]);

  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(filteredData.length / pageSize) - 1);
    if (pageIndex > lastPage) setPageIndex(lastPage);
  }, [pageSize, filteredData.length, pageIndex]);

  const columns = useMemo<ColumnDef<Operator>[]>(() => [
    {
      accessorKey: 'firstName',
      header: 'Nome',
      cell: ({ getValue }) => (
        <span className={cellStrongClass}>{getValue() as string}</span>
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
        if (!email) {
          return <span className="text-[var(--lume-text-muted)]">—</span>;
        }
        return (
          <TextLink
            data-no-row-click
            href={`mailto:${email}`}
            className="font-normal"
            onClick={(e) => e.stopPropagation()}
          >
            {email}
          </TextLink>
        );
      },
    },
    {
      id: 'invite_status',
      header: '',
      cell: ({ row }) => {
        const email = row.original.email?.toLowerCase();
        if (!email || !pendingEmailSet.has(email)) return null;
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--lume-text-secondary)] whitespace-nowrap">
            <Clock className="size-3.5 shrink-0 text-warning-strong" />
            Invito in attesa
          </span>
        );
      },
      enableSorting: false,
    },
    {
      id: 'phone',
      header: 'Telefono',
      cell: ({ row }) => {
        const url = row.original.getWhatsAppUrl();
        if (!url) return <span className="text-[var(--lume-text-muted)]">—</span>;
        return (
          <TextLink
            data-no-row-click
            href={url}
            target="_blank"
            rel="noreferrer"
            className="font-normal"
            onClick={(e) => e.stopPropagation()}
          >
            {row.original.getPhoneNumber()}
          </TextLink>
        );
      },
      enableSorting: false,
    },
  ], [pendingEmailSet]);

  const { columnVisibility, columnOrder, setColumnVisibility, setColumnOrder } =
    useTableColumnPrefs('operators', columns);

  const exportColumns: ExportColumn<Operator>[] = useMemo(
    () => [
      { label: 'Nome', accessor: (o) => o.firstName },
      { label: 'Cognome', accessor: (o) => o.lastName },
      { label: 'Email', accessor: (o) => o.email },
      { label: 'Prefisso', accessor: (o) => o.phonePrefix },
      { label: 'Telefono', accessor: (o) => o.phoneNumber },
      { label: 'Invito in attesa', accessor: (o) => !!(o.email && pendingEmailSet.has(o.email.toLowerCase())) },
    ],
    [pendingEmailSet],
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
    manualFiltering: true,
  });

  const handleRestore = async (operator: Operator) => {
    try {
      await restoreOperator(operator.id);
      messagePopup.getState().success('Operatore ripristinato con successo.');
    } catch {
      messagePopup.getState().error('Errore durante il ripristino.');
    }
  };

  return (
    <>
      <div className="flex-1 min-h-0 flex flex-col gap-4 w-full">
        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Searchbar placeholder="Cerca operatore..." value={globalFilter} onChange={setGlobalFilter} bindShortcut={false} className="flex-1 basis-full sm:basis-auto sm:max-w-sm" />
          <div className="ml-auto flex items-center gap-2">
            <ExportMenu
              rows={filteredData}
              columns={exportColumns}
              baseName={showArchived ? 'operatori-archiviati' : 'operatori'}
              pdfTitle={showArchived ? 'Operatori archiviati' : 'Operatori del salone'}
            />
            <ColumnPicker tableId="operators" columns={columns} />
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
                    Caricando operatori...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className={tableMessageClass}>
                    Nessun operatore trovato.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button, a, [data-no-row-click]')) return;
                      router.push(`/admin/operatori/${row.original.id}`);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target === e.currentTarget) {
                        router.push(`/admin/operatori/${row.original.id}`);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={trClass()}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className={tdClass}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                    <td className={tdClass}>
                      <div className="flex flex-row items-center justify-end gap-1">
                        {showArchived && (
                          <Button
                            variant="ghost"
                            size="sm"
                            iconOnly
                            aria-label="Ripristina"
                            onClick={(e) => { e.stopPropagation(); handleRestore(row.original); }}
                          >
                            <ArchiveRestore />
                          </Button>
                        )}
                        <Button
                          variant="ghost-destructive"
                          size="sm"
                          iconOnly
                          aria-label="Elimina"
                          onClick={(e) => { e.stopPropagation(); setSelectedOperator(row.original); setShowDelete(true); }}
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
          labelPlural="operatori"
        />
      </div>

      <DeleteOperatorModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        selectedOperator={selectedOperator}
      />
    </>
  );
}
