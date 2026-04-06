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
import { Trash2, Tags, Plus, ArrowDownToLine, ChevronUp, ChevronDown, Pencil } from 'lucide-react';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { ConciergeImportModal } from '@/lib/components/shared/ui/ConciergeImportModal';
import { ProductCategory } from '@/lib/types/ProductCategory';
import { AddCategoryModal } from './AddCategoryModal';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { cardStyle } from '@/lib/const/appearance';

const PAGE_SIZE = 10;

interface CategorieTabProps {
  addTrigger?: number;
}

export function CategorieTab({ addTrigger }: CategorieTabProps) {
  const categories = useProductCategoriesStore((s) => s.product_categories);
  const isLoading = useProductCategoriesStore((s) => s.isLoading);
  const deleteProductCategory = useProductCategoriesStore((s) => s.deleteProductCategory);

  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState<ProductCategory | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    if (!addTrigger) return;
    setSelected(null);
    setShowAdd(true);
  }, [addTrigger]);

  const columns = useMemo<ColumnDef<ProductCategory>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nome',
        cell: ({ getValue }) => (
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{getValue() as string}</span>
        ),
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

  const table = useReactTable({
    data: categories,
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

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await deleteProductCategory(selected.id);
      messagePopup.getState().success('Categoria eliminata.');
      setShowDelete(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error(msg);
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
      <AddModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onSubmit={handleDelete}
        title="Elimina Categoria"
        subtitle={selected ? `Stai eliminando: ${selected.name}` : ''}
        confirmText="Elimina"
        classes="max-w-sm"
        dangerAction={
          <div className="flex items-center gap-2 text-sm text-red-500">
            <Trash2 className="size-4" />
            <span>Azione irreversibile</span>
          </div>
        }
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Sei sicuro di voler eliminare la categoria{' '}
          <strong className="text-zinc-900 dark:text-zinc-100">{selected?.name}</strong>?
        </p>
      </AddModal>

      {!isLoading && categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="Nessuna categoria trovata"
          description="Crea la tua prima categoria per organizzare i prodotti."
          secondaryAction={{ label: 'Importa dati', icon: ArrowDownToLine, onClick: () => setShowImport(true) }}
          action={{ label: 'Nuova categoria', icon: Plus, onClick: () => { setSelected(null); setShowAdd(true); } }}
        />
      ) : (
        <div className="flex flex-col gap-4 w-full">
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
                          <button
                            onClick={(e) => handleEditClick(e, row.original)}
                            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                            title="Modifica"
                          >
                            <Pencil className="size-3.5" />
                          </button>
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
            totalItems={categories.length}
            itemsPerPage={PAGE_SIZE}
            labelPlural="categorie"
          />
        </div>
      )}
    </>
  );
}
