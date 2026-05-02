'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, Trash2, Plus, X, Check, Receipt } from 'lucide-react';
import { useSpeseStore } from '@/lib/stores/spese';
import { Spesa } from '@/lib/types/Spesa';
import { BilancioSpeseSkeleton } from '@/lib/components/admin/bilancio/BilancioSkeleton';
import { Modal } from '@/lib/components/shared/ui/modals/Modal';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { ColumnPicker } from '@/lib/components/admin/table/ColumnPicker';
import { useTableColumnPrefs } from '@/lib/hooks/useTableColumnPrefs';
import { useFitPageSize } from '@/lib/hooks/useFitPageSize';
import { cardStyle } from '@/lib/const/appearance';
import { formatCurrency, formatDateDisplay } from '@/lib/utils/format';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';

const CATEGORIE = ['Manutenzione', 'Prodotti', 'Utenze', 'Affitto', 'Marketing', 'Personale', 'Altro'] as const;

const CATEGORIA_COLORS: Record<string, string> = {
  Manutenzione: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  Prodotti:     'bg-primary/10 text-primary-hover dark:text-primary/70 border-primary/20',
  Utenze:       'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  Affitto:      'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  Marketing:    'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  Personale:    'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  Altro:        'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
};

const emptyForm = () => ({
  data: '',
  fornitore: '',
  categoria: 'Manutenzione' as string,
  importo: '',
});

export function BilancioSpeseTab() {
  const spese = useSpeseStore((s) => s.spese);
  const isLoading = useSpeseStore((s) => s.isLoading);
  const fetchSpese = useSpeseStore((s) => s.fetchSpese);
  const addSpesa = useSpeseStore((s) => s.addSpesa);
  const deleteSpesa = useSpeseStore((s) => s.deleteSpesa);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [isSaving, setIsSaving] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'data', desc: true }]);
  const [pageIndex, setPageIndex] = useState(0);

  const { ref: tableCardRef, pageSize } = useFitPageSize<HTMLDivElement>({ rowPx: 41 });

  useEffect(() => { fetchSpese(); }, [fetchSpese]);

  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(spese.length / pageSize) - 1);
    if (pageIndex > lastPage) setPageIndex(lastPage);
  }, [pageSize, spese.length, pageIndex]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleAdd = async () => {
    if (!form.data || !form.fornitore || !form.importo) {
      messagePopup.getState().error('Compila tutti i campi obbligatori.');
      return;
    }
    setIsSaving(true);
    try {
      await addSpesa({
        data: form.data,
        fornitore: form.fornitore.trim(),
        categoria: form.categoria,
        importo: parseFloat(form.importo),
      });
      messagePopup.getState().success('Spesa aggiunta.');
      setDialogOpen(false);
      setForm(emptyForm());
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
      messagePopup.getState().error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSpesa(id);
      messagePopup.getState().success('Spesa eliminata.');
    } catch {
      messagePopup.getState().error('Impossibile eliminare la spesa.');
    }
  };

  const columns = useMemo<ColumnDef<Spesa>[]>(() => [
    {
      id: 'data',
      header: 'Data',
      cell: ({ row }) => formatDateDisplay(row.original.data, 'dd/MM/yyyy'),
      sortingFn: (a, b) => a.original.data.localeCompare(b.original.data),
      enableSorting: true,
    },
    {
      accessorKey: 'fornitore',
      header: 'Fornitore',
      meta: { requiredVisible: true },
    },
    {
      accessorKey: 'categoria',
      header: 'Categoria',
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${CATEGORIA_COLORS[row.original.categoria] ?? CATEGORIA_COLORS.Altro}`}>
          {row.original.categoria}
        </span>
      ),
    },
    {
      id: 'importo',
      header: 'Importo',
      enableSorting: true,
      sortingFn: (a, b) => a.original.importo - b.original.importo,
      cell: ({ row }) => (
        <span className="tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
          {formatCurrency(row.original.importo)}
        </span>
      ),
    },
  ], []);

  const { columnVisibility, columnOrder, setColumnVisibility, setColumnOrder } =
    useTableColumnPrefs('expenses', columns);

  const table = useReactTable({
    data: spese,
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

  const inputClass = 'w-full px-4 py-3 h-12 rounded-xl border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-shadow text-base';
  const labelClass = 'text-base font-medium text-zinc-700 dark:text-zinc-300';

  const openDialog = () => { setForm(emptyForm()); setDialogOpen(true); };

  if (isLoading) return <BilancioSpeseSkeleton />;

  return (
    <>
      <Modal isOpen={dialogOpen} onClose={() => setDialogOpen(false)} classes="max-w-md">
        <div className="flex flex-col bg-zinc-50 dark:bg-zinc-800 rounded-lg shadow-xl w-full">
          <div className="flex flex-row items-center justify-between p-6 border-b border-zinc-500/25 shrink-0">
            <div className="flex flex-row items-center gap-3">
              <div className="flex shrink-0 items-center justify-center size-10 rounded-lg bg-primary/10">
                <Receipt className="size-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Nuova Spesa</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Registra una nuova spesa</p>
              </div>
            </div>
            <button
              aria-label="Chiudi"
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              onClick={() => setDialogOpen(false)}
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Data *</label>
              <input type="date" className={inputClass} value={form.data} onChange={(e) => set('data', e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Fornitore *</label>
              <input type="text" className={inputClass} placeholder="es. Enel, Amazon…" value={form.fornitore} onChange={(e) => set('fornitore', e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Categoria *</label>
              <select className={inputClass} value={form.categoria} onChange={(e) => set('categoria', e.target.value)}>
                {CATEGORIE.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Importo (€) *</label>
              <input type="number" min="0" step="0.01" className={inputClass} placeholder="0,00" value={form.importo} onChange={(e) => set('importo', e.target.value)} />
            </div>
          </div>

          <div className="flex flex-row items-center justify-end gap-3 p-6 border-t border-zinc-500/25 shrink-0">
            <button
              type="button"
              className="flex flex-row items-center justify-center gap-2 px-4 py-2.5 text-sm font-thin rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-all text-zinc-900 dark:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              onClick={() => setDialogOpen(false)}
            >
              <X className="size-4" />
              Annulla
            </button>
            <button
              type="button"
              disabled={isSaving}
              className="flex flex-row items-center justify-center gap-2 px-4 py-2.5 text-sm font-thin rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-50 disabled:pointer-events-none transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-800"
              onClick={handleAdd}
            >
              <Check className="size-4" />
              {isSaving ? 'Salvataggio…' : 'Aggiungi'}
            </button>
          </div>
        </div>
      </Modal>

      {spese.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Nessuna spesa registrata"
          description="Aggiungi la tua prima spesa per tenere traccia dei costi del salone."
          action={{ label: 'Nuova spesa', icon: Plus, onClick: openDialog }}
        />
      ) : (
      <div className="flex-1 min-h-0 flex flex-col gap-4 w-full">
        <div className="flex items-center justify-end gap-2">
          <ColumnPicker tableId="expenses" columns={columns} />
          <button
            className="flex flex-row items-center whitespace-nowrap justify-center px-4 py-2 gap-2 text-sm font-thin transition-all bg-black hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-lg border border-zinc-500/25"
            onClick={openDialog}
          >
            <Plus className="size-4" />
            <span>Nuova Spesa</span>
          </button>
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
                  <th className="px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide text-right w-16">
                    Azioni
                  </th>
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                  <td className="px-4 py-2">
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDelete(row.original.id)}
                        className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Elimina"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>

        <Pagination
          currentPage={pageIndex + 1}
          onPageChange={(p) => setPageIndex(p - 1)}
          totalItems={spese.length}
          itemsPerPage={pageSize}
          labelPlural="spese"
        />
      </div>
      )}
    </>
  );
}
