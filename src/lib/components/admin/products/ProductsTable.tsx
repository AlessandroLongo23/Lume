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
import { Search, X, ChevronUp, ChevronDown, Info, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useProductsStore } from '@/lib/stores/products';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { useManufacturersStore } from '@/lib/stores/manufacturers';
import { useSuppliersStore } from '@/lib/stores/suppliers';
import { Product } from '@/lib/types/Product';
import { FacetedFilter } from '@/lib/components/admin/table/FacetedFilter';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { EditProductModal } from './EditProductModal';
import { DeleteProductModal } from './DeleteProductModal';
import { cardStyle } from '@/lib/const/appearance';

interface ProductsTableProps {
  products: Product[];
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

export function ProductsTable({ products }: ProductsTableProps) {
  const router = useRouter();
  const isLoading = useProductsStore((s) => s.isLoading);
  const categories = useProductCategoriesStore((s) => s.product_categories);
  const manufacturers = useManufacturersStore((s) => s.manufacturers);
  const suppliers = useSuppliersStore((s) => s.suppliers);

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editedProduct, setEditedProduct] = useState<Partial<Product>>({});

  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => { setPageIndex(0); }, [globalFilter, selectedCategories, selectedManufacturers, selectedSuppliers]);

  const filteredData = useMemo(() => {
    let data = products;
    if (selectedCategories.length > 0) data = data.filter((p) => selectedCategories.includes(p.product_category_id));
    if (selectedManufacturers.length > 0) data = data.filter((p) => selectedManufacturers.includes(p.manufacturer_id));
    if (selectedSuppliers.length > 0) data = data.filter((p) => selectedSuppliers.includes(p.supplier_id));
    if (globalFilter.trim()) {
      const q = globalFilter.toLowerCase();
      data = data.filter((p) => {
        const cat = categories.find((c) => c.id === p.product_category_id);
        const mfr = manufacturers.find((m) => m.id === p.manufacturer_id);
        const sup = suppliers.find((s) => s.id === p.supplier_id);
        return (
          p.name.toLowerCase().includes(q) ||
          (cat?.name ?? '').toLowerCase().includes(q) ||
          (mfr?.name ?? '').toLowerCase().includes(q) ||
          (sup?.name ?? '').toLowerCase().includes(q)
        );
      });
    }
    return data;
  }, [products, selectedCategories, selectedManufacturers, selectedSuppliers, globalFilter, categories, manufacturers, suppliers]);

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: 'product_category_id',
        header: 'Categoria',
        cell: ({ row }) => {
          const cat = categories.find((c) => c.id === row.original.product_category_id);
          if (!cat) return <span className="text-zinc-400 text-xs">—</span>;
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorFromId(row.original.product_category_id)}`}>
              {cat.name}
            </span>
          );
        },
        sortingFn: (a, b) => {
          const ca = categories.find((c) => c.id === a.original.product_category_id)?.name ?? '';
          const cb = categories.find((c) => c.id === b.original.product_category_id)?.name ?? '';
          return ca.localeCompare(cb, 'it');
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
        accessorKey: 'manufacturer_id',
        header: 'Produttore',
        cell: ({ row }) => {
          const mfr = manufacturers.find((m) => m.id === row.original.manufacturer_id);
          return <span>{mfr?.name ?? <span className="text-zinc-400">—</span>}</span>;
        },
        sortingFn: (a, b) => {
          const ma = manufacturers.find((m) => m.id === a.original.manufacturer_id)?.name ?? '';
          const mb = manufacturers.find((m) => m.id === b.original.manufacturer_id)?.name ?? '';
          return ma.localeCompare(mb, 'it');
        },
      },
      {
        accessorKey: 'supplier_id',
        header: 'Fornitore',
        cell: ({ row }) => {
          const sup = suppliers.find((s) => s.id === row.original.supplier_id);
          return <span>{sup?.name ?? <span className="text-zinc-400">—</span>}</span>;
        },
        sortingFn: (a, b) => {
          const sa = suppliers.find((s) => s.id === a.original.supplier_id)?.name ?? '';
          const sb = suppliers.find((s) => s.id === b.original.supplier_id)?.name ?? '';
          return sa.localeCompare(sb, 'it');
        },
      },
      {
        accessorKey: 'price',
        header: () => <span className="block w-full text-right">Prezzo</span>,
        cell: ({ getValue }) => (
          <span className="block text-right tabular-nums">{(getValue() as number).toFixed(2)} €</span>
        ),
      },
    ],
    [categories, manufacturers, suppliers]
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
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories]
  );
  const manufacturerOptions = useMemo(
    () => manufacturers.map((m) => ({ value: m.id, label: m.name })),
    [manufacturers]
  );
  const supplierOptions = useMemo(
    () => suppliers.map((s) => ({ value: s.id, label: s.name })),
    [suppliers]
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
              placeholder="Cerca prodotto..."
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
          <FacetedFilter label="Produttore" options={manufacturerOptions} selected={selectedManufacturers} onChange={setSelectedManufacturers} />
          <FacetedFilter label="Fornitore" options={supplierOptions} selected={selectedSuppliers} onChange={setSelectedSuppliers} />
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
                    const isNumeric = header.column.id === 'price';
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
                    Caricando prodotti...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-sm text-zinc-400">
                    Nessun prodotto trovato.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={[
                          'px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300',
                          cell.column.id === 'price' ? 'text-right' : '',
                        ].join(' ')}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                    <td className="px-4 py-2">
                      <div className="flex flex-row items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/admin/prodotti/${row.original.id}`)}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                          title="Dettaglio"
                        >
                          <Info className="size-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedProduct(row.original); setEditedProduct(new Product(row.original)); setShowEdit(true); }}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                          title="Modifica"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedProduct(row.original); setShowDelete(true); }}
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
          labelPlural="prodotti"
        />
      </div>

      <EditProductModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        editedProduct={editedProduct}
        onEditedProductChange={setEditedProduct}
        selectedProduct={selectedProduct}
      />
      <DeleteProductModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        selectedProduct={selectedProduct}
      />
    </>
  );
}
