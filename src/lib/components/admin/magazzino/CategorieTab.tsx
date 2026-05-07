'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { Trash2, Tags, Plus, ArrowDownToLine, ChevronUp, ChevronDown, Pencil, ArchiveRestore, Search, X } from 'lucide-react';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { ConciergeImportModal } from '@/lib/components/shared/ui/ConciergeImportModal';
import { ProductCategory } from '@/lib/types/ProductCategory';
import { AddCategoryModal } from './AddCategoryModal';
import { DeleteCategorieModal } from './DeleteCategorieModal';
import { Button } from '@/lib/components/shared/ui/Button';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { ColumnPicker } from '@/lib/components/admin/table/ColumnPicker';
import { useTableColumnPrefs } from '@/lib/hooks/useTableColumnPrefs';
import { useFitPageSize } from '@/lib/hooks/useFitPageSize';
import { cardStyle } from '@/lib/const/appearance';

interface CategorieTabProps {
  addTrigger?: number;
  categories?: ProductCategory[];
  showArchived?: boolean;
}

export function CategorieTab({ addTrigger, categories: categoriesProp, showArchived = false }: CategorieTabProps) {
  const storeCategories = useProductCategoriesStore((s) => s.product_categories);
  const isLoading = useProductCategoriesStore((s) => s.isLoading);
  const restoreProductCategory = useProductCategoriesStore((s) => s.restoreProductCategory);
  const categories = categoriesProp ?? storeCategories;

  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState<ProductCategory | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [globalFilter, setGlobalFilter] = useState('');

  const { ref: tableCardRef, pageSize } = useFitPageSize<HTMLDivElement>({ rowPx: 41 });

  useEffect(() => {
    if (!addTrigger) return;
    setSelected(null);
    setShowAdd(true);
  }, [addTrigger]);

  useEffect(() => {
    setPageIndex(0);
  }, [globalFilter]);

  const filteredCategories = useMemo(() => {
    if (!globalFilter.trim()) return categories;
    const q = globalFilter.toLowerCase();
    return categories.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q)
    );
  }, [categories, globalFilter]);

  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(filteredCategories.length / pageSize) - 1);
    if (pageIndex > lastPage) setPageIndex(lastPage);
  }, [pageSize, filteredCategories.length, pageIndex]);

  const columns = useMemo<ColumnDef<ProductCategory>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nome',
        cell: ({ getValue }) => (
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{getValue() as string}</span>
        ),
        meta: { requiredVisible: true },
      },
      {
        accessorKey: 'description',
        header: 'Descrizione',
        cell: ({ getValue }) => (
          <span className="text-zinc-500 dark:text-zinc-400">{(getValue() as string) || '—'}</span>
        ),
      },
    ],
    []
  );

  const { columnVisibility, columnOrder, setColumnVisibility, setColumnOrder } =
    useTableColumnPrefs('product-categories', columns);

  const table = useReactTable({
    data: filteredCategories,
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

  const handleEditClick = (e: React.MouseEvent, item: ProductCategory) => {
    e.stopPropagation();
    setSelected(item);
    setShowAdd(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, item: ProductCategory) => {
    e.stopPropagation();
    setSelected(item);
    setShowDelete(true);
  };

  const handleRestore = async (e: React.MouseEvent, item: ProductCategory) => {
    e.stopPropagation();
    try {
      await restoreProductCategory(item.id);
      messagePopup.getState().success('Categoria ripristinata con successo.');
    } catch {
      messagePopup.getState().error('Errore durante il ripristino.');
    }
  };

  return (
    <>
      <AddCategoryModal
        isOpen={showAdd}
        onClose={() => { setShowAdd(false); setSelected(null); }}
        selectedCategory={selected}
      />
      <ConciergeImportModal isOpen={showImport} onClose={() => setShowImport(false)} />
      <DeleteCategorieModal
        isOpen={showDelete}
        onClose={() => { setShowDelete(false); setSelected(null); }}
        category={selected}
      />

      {!isLoading && categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="Nessuna categoria trovata"
          description="Crea la tua prima categoria per organizzare i prodotti."
          secondaryAction={{ label: 'Importa dati', icon: ArrowDownToLine, onClick: () => setShowImport(true) }}
          action={{ label: 'Nuova categoria', icon: Plus, onClick: () => { setSelected(null); setShowAdd(true); } }}
        />
      ) : (
        <div className="flex-1 min-h-0 flex flex-col gap-4 w-full">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex items-center flex-1 max-w-sm">
              <Search className="absolute left-2.5 size-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cerca categoria..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full py-2 pl-9 pr-8 text-sm bg-transparent border rounded-lg
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
                  aria-label="Cancella ricerca"
                  onClick={() => setGlobalFilter('')}
                  className="absolute right-1"
                >
                  <X />
                </Button>
              )}
            </div>
            <ColumnPicker tableId="product-categories" columns={columns} className="ml-auto" />
          </div>

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
                    <th className="px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide text-right w-20">
                      Azioni
                    </th>
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-sm text-zinc-400">
                      Caricando categorie...
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-sm text-zinc-400">
                      Nessuna categoria trovata.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                      <td className="px-4 py-2">
                        <div className="flex flex-row items-center justify-end gap-1">
                          {showArchived ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              iconOnly
                              aria-label="Ripristina"
                              title="Ripristina"
                              onClick={(e) => handleRestore(e, row.original)}
                              className="text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            >
                              <ArchiveRestore />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              iconOnly
                              aria-label="Modifica"
                              title="Modifica"
                              onClick={(e) => handleEditClick(e, row.original)}
                              className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                            >
                              <Pencil />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            iconOnly
                            aria-label="Elimina"
                            title="Elimina"
                            onClick={(e) => handleDeleteClick(e, row.original)}
                            className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
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
            totalItems={filteredCategories.length}
            itemsPerPage={pageSize}
            labelPlural="categorie"
          />
        </div>
      )}
    </>
  );
}
