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
import { Search, X, ChevronUp, ChevronDown, Info, Pencil, Trash2, Mars, Venus, Plane } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useClientsStore } from '@/lib/stores/clients';
import { useClientCategoriesStore } from '@/lib/stores/client_categories';
import { Client } from '@/lib/types/Client';
import { FacetedFilter } from '@/lib/components/admin/table/FacetedFilter';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { EditClientModal } from './EditClientModal';
import { DeleteClientModal } from './DeleteClientModal';
import { cardStyle } from '@/lib/const/appearance';

interface ClientsTableProps {
  clients: Client[];
}

const PAGE_SIZE = 10;

const BADGE_COLORS = [
  'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
];

function colorFromId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return BADGE_COLORS[Math.abs(hash) % BADGE_COLORS.length];
}

const GENDER_OPTIONS = [
  { value: 'M', label: 'Uomo', prefix: <Mars className="size-3.5 text-blue-500 mr-0.5" /> },
  { value: 'F', label: 'Donna', prefix: <Venus className="size-3.5 text-pink-500 mr-0.5" /> },
];

export function ClientsTable({ clients }: ClientsTableProps) {
  const router = useRouter();
  const isLoading = useClientsStore((s) => s.isLoading);
  const clientCategories = useClientCategoriesStore((s) => s.client_categories);

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editedClient, setEditedClient] = useState<Partial<Client>>({});

  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => { setPageIndex(0); }, [globalFilter, selectedCategories, selectedGenders]);

  const filteredData = useMemo(() => {
    let data = clients;
    if (selectedCategories.length > 0) data = data.filter((c) => selectedCategories.includes(c.categoryId));
    if (selectedGenders.length > 0) data = data.filter((c) => selectedGenders.includes(c.gender));
    if (globalFilter.trim()) {
      const q = globalFilter.toLowerCase();
      data = data.filter((c) =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phonePrefix + ' ' + c.phoneNumber).toLowerCase().includes(q)
      );
    }
    return data;
  }, [clients, selectedCategories, selectedGenders, globalFilter]);

  const columns = useMemo<ColumnDef<Client>[]>(
    () => [
      {
        accessorKey: 'categoryId',
        header: 'Categoria',
        cell: ({ row }) => {
          const cat = clientCategories.find((c) => c.id === row.original.categoryId);
          if (!cat) return <span className="text-zinc-400 text-xs">—</span>;
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorFromId(row.original.categoryId)}`}>
              {cat.name}
            </span>
          );
        },
        sortingFn: (a, b) => {
          const ca = clientCategories.find((c) => c.id === a.original.categoryId)?.name ?? '';
          const cb = clientCategories.find((c) => c.id === b.original.categoryId)?.name ?? '';
          return ca.localeCompare(cb, 'it');
        },
      },
      {
        accessorKey: 'firstName',
        header: 'Nome',
        cell: ({ getValue }) => (
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'lastName',
        header: 'Cognome',
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <span
            className="cursor-pointer text-indigo-600 dark:text-indigo-400 hover:underline"
            onClick={() => window.open(`mailto:${row.original.email}`, '_blank')}
          >
            {row.original.email}
          </span>
        ),
      },
      {
        id: 'phone',
        header: 'Telefono',
        cell: ({ row }) => (
          <span
            className="cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            onClick={() => {
              const phone = row.original.phonePrefix.concat(row.original.phoneNumber).replace(/[^0-9]/g, '');
              window.open(`https://wa.me/${phone}`, '_blank');
            }}
          >
            {row.original.phonePrefix} {row.original.phoneNumber}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'gender',
        header: '',
        cell: ({ getValue }) => {
          const g = getValue() as string;
          if (g === 'M') return <Mars className="size-4 text-blue-500" />;
          if (g === 'F') return <Venus className="size-4 text-pink-500" />;
          return <span className="text-zinc-400">—</span>;
        },
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
        accessorKey: 'isTourist',
        header: '',
        cell: ({ getValue }) =>
          getValue() ? <Plane className="size-4 text-zinc-500" /> : null,
        enableSorting: false,
      },
    ],
    [clientCategories]
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

  const categoryOptions = useMemo(
    () => clientCategories.map((c) => ({ value: c.id, label: c.name })),
    [clientCategories]
  );

  return (
    <>
      <div className="flex flex-col gap-4 w-full">
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
          <FacetedFilter label="Categoria" options={categoryOptions} selected={selectedCategories} onChange={setSelectedCategories} />
          <FacetedFilter label="Genere" options={GENDER_OPTIONS} selected={selectedGenders} onChange={setSelectedGenders} />
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
                  <tr key={row.id} className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                    <td className="px-4 py-2">
                      <div className="flex flex-row items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/admin/clienti/${row.original.id}`)}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                          title="Dettaglio"
                        >
                          <Info className="size-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedClient(row.original); setEditedClient({ ...row.original }); setShowEdit(true); }}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                          title="Modifica"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedClient(row.original); setShowDelete(true); }}
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
          labelPlural="clienti"
        />
      </div>

      <EditClientModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        editedClient={editedClient}
        onEditedClientChange={setEditedClient}
        selectedClient={selectedClient}
      />
      <DeleteClientModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        selectedClient={selectedClient}
      />
    </>
  );
}
