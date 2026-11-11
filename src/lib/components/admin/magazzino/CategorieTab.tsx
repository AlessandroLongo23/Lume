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
import { Trash2, Tags, Plus, ArrowDownToLine, Pencil, ArchiveRestore } from 'lucide-react';
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
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { Searchbar } from '@/lib/components/shared/ui/Searchbar';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { ConciergeImportModal } from '@/lib/components/shared/ui/ConciergeImportModal';
import { ProductCategory } from '@/lib/types/ProductCategory';
import { AddCategoryModal } from './AddCategoryModal';
import { DeleteCategorieModal } from './DeleteCategorieModal';
import { Button } from '@/lib/components/shared/ui/Button';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { ColumnPicker } from '@/lib/components/admin/table/ColumnPicker';
import { ExportMenu } from '@/lib/components/shared/ui/ExportMenu';
import type { ExportColumn } from '@/lib/utils/tableExport';
import { useTableColumnPrefs } from '@/lib/hooks/useTableColumnPrefs';
import { useFitPageSize } from '@/lib/hooks/useFitPageSize';

function ColorNameCell({ color, name }: { color: string; name: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className={cellStrongClass}>{name}</span>
    </div>
  );
}

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
        cell: ({ row }) => <ColorNameCell color={row.original.color} name={row.original.name} />,
        meta: { requiredVisible: true },
      },
      {
        accessorKey: 'description',
        header: 'Descrizione',
        cell: ({ getValue }) => (
          <span className="text-[var(--lume-text-secondary)]">{(getValue() as string) || '—'}</span>
        ),
      },
    ],
    []
  );

  const { columnVisibility, columnOrder, setColumnVisibility, setColumnOrder } =
    useTableColumnPrefs('product-categories', columns);

  const exportColumns: ExportColumn<ProductCategory>[] = useMemo(
    () => [
      { label: 'Nome', accessor: (c) => c.name },
      { label: 'Descrizione', accessor: (c) => c.description },
      { label: 'Colore', accessor: (c) => c.color },
    ],
    [],
  );

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
            <Searchbar
              className="flex-1 max-w-sm"
              placeholder="Cerca categoria..."
              value={globalFilter}
              onChange={setGlobalFilter}
            />
            <div className="ml-auto flex items-center gap-2">
              <ExportMenu
                rows={filteredCategories}
                columns={exportColumns}
                baseName={showArchived ? 'categorie-prodotti-archiviate' : 'categorie-prodotti'}
                pdfTitle={showArchived ? 'Categorie prodotti archiviate' : 'Categorie prodotti'}
              />
              <ColumnPicker tableId="product-categories" columns={columns} />
            </div>
          </div>

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
                    <th className={`${thClass({ align: 'right' })} w-20`}>
                      Azioni
                    </th>
                  </tr>
                ))}
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={columns.length + 1} className={tableMessageClass}>
                      Caricando categorie...
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className={tableMessageClass}>
                      Nessuna categoria trovata.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className={trClass({ interactive: false })}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className={tdClass}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                      <td className={tdClass}>
                        <div className="flex flex-row items-center justify-end gap-1">
                          {showArchived ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              iconOnly
                              aria-label="Ripristina"
                              onClick={(e) => handleRestore(e, row.original)}
                            >
                              <ArchiveRestore />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              iconOnly
                              aria-label="Modifica"
                              onClick={(e) => handleEditClick(e, row.original)}
                            >
                              <Pencil />
                            </Button>
                          )}
                          <Button
                            variant="ghost-destructive"
                            size="sm"
                            iconOnly
                            aria-label="Elimina"
                            onClick={(e) => handleDeleteClick(e, row.original)}
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
