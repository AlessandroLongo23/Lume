'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { Search, X, ChevronUp, ChevronDown, SlidersHorizontal, Check, Pencil, Trash2, ArchiveRestore } from 'lucide-react';
import { useServicesStore } from '@/lib/stores/services';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { Service } from '@/lib/types/Service';
import { CategoryBadge } from './CategoryBadge';
import { EditServiceModal } from './EditServiceModal';
import { DeleteServiceModal } from './DeleteServiceModal';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { cardStyle } from '@/lib/const/appearance';

interface ServicesTableProps {
  services: Service[];
  showArchived?: boolean;
}

const PAGE_SIZE = 10;

export function ServicesTable({ services, showArchived = false }: ServicesTableProps) {
  const isLoading = useServicesStore((s) => s.isLoading);
  const restoreService = useServicesStore((s) => s.restoreService);
  const categories = useServiceCategoriesStore((s) => s.service_categories);

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [editedService, setEditedService] = useState<Partial<Service>>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setPageIndex(0);
  }, [globalFilter, selectedCategories]);

  const filteredData = useMemo(() => {
    let data = services;

    if (selectedCategories.length > 0) {
      data = data.filter((s) => selectedCategories.includes(s.category_id));
    }

    if (globalFilter.trim()) {
      const q = globalFilter.toLowerCase();
      data = data.filter((s) => {
        const cat = categories.find((c) => c.id === s.category_id);
        return (
          s.name.toLowerCase().includes(q) ||
          (cat?.name ?? '').toLowerCase().includes(q)
        );
      });
    }

    return data;
  }, [services, selectedCategories, globalFilter, categories]);

  const columns = useMemo<ColumnDef<Service>[]>(
    () => [
      {
        accessorKey: 'category_id',
        header: 'Categoria',
        cell: ({ row }) => <CategoryBadge category_id={row.original.category_id} />,
        sortingFn: (a, b) => {
          const catA = categories.find((c) => c.id === a.original.category_id)?.name ?? '';
          const catB = categories.find((c) => c.id === b.original.category_id)?.name ?? '';
          return catA.localeCompare(catB, 'it');
        },
      },
      {
        accessorKey: 'name',
        header: 'Nome',
        cell: ({ getValue }) => (
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'duration',
        header: () => <span className="block w-full text-right">Durata</span>,
        cell: ({ getValue }) => (
          <span className="block text-right tabular-nums">{getValue() as number} min</span>
        ),
      },
      {
        accessorKey: 'price',
        header: () => <span className="block w-full text-right">Prezzo</span>,
        cell: ({ getValue }) => (
          <span className="block text-right tabular-nums">{(getValue() as number).toFixed(2)} €</span>
        ),
      },
      {
        accessorKey: 'product_cost',
        header: () => <span className="block w-full text-right">Costo prodotti</span>,
        cell: ({ getValue }) => (
          <span className="block text-right tabular-nums">{(getValue() as number).toFixed(2)} €</span>
        ),
      },
    ],
    [categories]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      pagination: { pageIndex, pageSize: PAGE_SIZE },
    },
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

  const handleEditClick = (e: React.MouseEvent, service: Service) => {
    e.stopPropagation();
    setSelectedService(service);
    setEditedService(new Service(service));
    setShowEdit(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, service: Service) => {
    e.stopPropagation();
    setSelectedService(service);
    setShowDelete(true);
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleRestore = async (service: Service) => {
    try {
      await restoreService(service.id);
      messagePopup.getState().success('Servizio ripristinato con successo.');
    } catch {
      messagePopup.getState().error('Errore durante il ripristino.');
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4 w-full">
        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center flex-1 max-w-sm">
            <Search className="absolute left-2.5 size-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cerca servizio..."
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

          {/* Category faceted filter */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setCategoryDropdownOpen((o) => !o)}
              className={[
                'flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors',
                selectedCategories.length > 0
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
              ].join(' ')}
            >
              <SlidersHorizontal className="size-4" />
              <span>Categoria</span>
              {selectedCategories.length > 0 && (
                <span className="bg-indigo-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none font-medium">
                  {selectedCategories.length}
                </span>
              )}
            </button>

            {categoryDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 z-20 w-52 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden">
                <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Filtra per categoria
                  </span>
                </div>
                <div className="py-1 max-h-56 overflow-y-auto">
                  {categories.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-zinc-400">Nessuna categoria</p>
                  ) : (
                    categories.map((cat) => {
                      const checked = selectedCategories.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          onClick={() => toggleCategory(cat.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                          <span
                            className={[
                              'shrink-0 size-4 rounded border transition-colors flex items-center justify-center',
                              checked
                                ? 'bg-indigo-500 border-indigo-500'
                                : 'border-zinc-300 dark:border-zinc-600',
                            ].join(' ')}
                          >
                            {checked && <Check className="size-3 text-white" />}
                          </span>
                          {cat.name}
                        </button>
                      );
                    })
                  )}
                </div>
                {selectedCategories.length > 0 && (
                  <div className="px-3 py-1.5 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      onClick={() => setSelectedCategories([])}
                      className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                    >
                      Azzera filtri
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
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
                    const isNumeric = header.column.id === 'duration' || header.column.id === 'price' || header.column.id === 'product_cost';
                    return (
                      <th
                        key={header.id}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        className={[
                          'px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide select-none whitespace-nowrap',
                          canSort ? 'cursor-pointer hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors' : '',
                          isNumeric ? 'text-right' : 'text-left',
                        ].join(' ')}
                      >
                        <span className={['inline-flex items-center gap-1', isNumeric ? 'flex-row-reverse' : ''].join(' ')}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            <span className="flex flex-col">
                              <ChevronUp
                                className={`size-3 ${sorted === 'asc' ? 'text-indigo-500' : 'text-zinc-300 dark:text-zinc-600'}`}
                              />
                              <ChevronDown
                                className={`size-3 -mt-1 ${sorted === 'desc' ? 'text-indigo-500' : 'text-zinc-300 dark:text-zinc-600'}`}
                              />
                            </span>
                          )}
                        </span>
                      </th>
                    );
                  })}
                  <th className="px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide text-right w-20">
                    Azioni
                  </th>
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-10 text-center text-sm text-zinc-400"
                  >
                    Caricando servizi...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-10 text-center text-sm text-zinc-400"
                  >
                    Nessun servizio trovato.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isNumeric = cell.column.id === 'duration' || cell.column.id === 'price' || cell.column.id === 'product_cost';
                      return (
                        <td
                          key={cell.id}
                          className={[
                            'px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300',
                            isNumeric ? 'text-right' : '',
                          ].join(' ')}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                    <td className="px-4 py-2">
                      <div className="flex flex-row items-center justify-end gap-1">
                        {showArchived ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRestore(row.original); }}
                            className="p-1.5 rounded-md text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                            title="Ripristina"
                          >
                            <ArchiveRestore className="size-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleEditClick(e, row.original)}
                            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                            title="Modifica"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteClick(e, row.original)}
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
          labelPlural="servizi"
        />
      </div>

      <EditServiceModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        editedService={editedService}
        onEditedServiceChange={setEditedService}
        selectedService={selectedService}
      />
      <DeleteServiceModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        selectedService={selectedService}
      />
    </>
  );
}
