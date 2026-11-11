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
import { Trash2, Plus, Receipt } from 'lucide-react';
import { useSpeseStore } from '@/lib/stores/spese';
import { Spesa } from '@/lib/types/Spesa';
import { BilancioSpeseSkeleton } from '@/lib/components/admin/bilancio/BilancioSkeleton';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { DeleteModal } from '@/lib/components/shared/ui/modals/DeleteModal';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { Field } from '@/lib/components/shared/ui/forms/Field';
import { DateField } from '@/lib/components/shared/ui/forms/DateField';
import { Button } from '@/lib/components/shared/ui/Button';
import { Select } from '@/lib/components/shared/ui/forms/Select';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { Pagination } from '@/lib/components/admin/table/Pagination';
import { ColumnPicker } from '@/lib/components/admin/table/ColumnPicker';
import { useTableColumnPrefs } from '@/lib/hooks/useTableColumnPrefs';
import { useFitPageSize } from '@/lib/hooks/useFitPageSize';
import { CellEmpty, SortIndicator, cellNumClass, tableCardClass, tableClass, tbodyClass, tdClass, thClass, theadClass, trClass } from '@/lib/components/shared/ui/table/tableStyles';
import { formatCurrency, formatDateDisplay } from '@/lib/utils/format';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';

// Ordered by P&L line; each one rolls up into a Bilancio heading through
// public.bilancio_voce_spesa(). Add a new category there too.
const CATEGORIE = [
  'Prodotti', 'Accoglienza e allestimento', 'Pulizia', 'Attrezzatura',
  'Utenze', 'Manutenzione', 'Marketing', 'Banca e POS', 'Telefono e internet', 'Gestionale',
  'Formazione', 'Consulenze', 'Assicurazioni', 'Viaggi e trasferte',
  'Affitto', 'Leasing attrezzature', 'Spese condominiali',
  'Personale',
  'Tasse e diritti', 'Ammortamenti', 'Altro',
] as const;

const emptyForm = () => ({
  data: '',
  fornitore: '',
  categoria: 'Prodotti' as string,
  importo: '',
  imponibile: '',
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
  // The row stays set after closing so the dialog text holds during its exit.
  const [toDelete, setToDelete] = useState<Spesa | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
    const importo = parseFloat(form.importo);
    const imponibile = form.imponibile ? parseFloat(form.imponibile) : null;
    if (imponibile !== null && (isNaN(imponibile) || imponibile < 0 || imponibile > importo)) {
      messagePopup.getState().error("L'importo senza IVA non può superare l'importo pagato.");
      return;
    }
    setIsSaving(true);
    try {
      await addSpesa({
        data: form.data,
        fornitore: form.fornitore.trim(),
        categoria: form.categoria,
        importo,
        imponibile,
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

  const handleDelete = async () => {
    if (!toDelete) return;
    setIsDeleting(true);
    try {
      await deleteSpesa(toDelete.id);
      messagePopup.getState().success('Spesa eliminata.');
      setDeleteOpen(false);
    } catch {
      messagePopup.getState().error('Impossibile eliminare la spesa.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo<ColumnDef<Spesa>[]>(() => [
    {
      id: 'data',
      header: 'Data',
      cell: ({ row }) => <span className={cellNumClass}>{formatDateDisplay(row.original.data, 'dd/MM/yyyy')}</span>,
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
        <span className="text-[var(--lume-text)]">{row.original.categoria}</span>
      ),
    },
    {
      id: 'importo',
      header: 'Importo',
      enableSorting: true,
      sortingFn: (a, b) => a.original.importo - b.original.importo,
      cell: ({ row }) => (
        <span className={`${cellNumClass} text-[var(--lume-text)]`}>
          {formatCurrency(row.original.importo)}
        </span>
      ),
    },
    {
      id: 'imponibile',
      header: 'Senza IVA',
      enableSorting: true,
      sortingFn: (a, b) => (a.original.imponibile ?? a.original.importo) - (b.original.imponibile ?? b.original.importo),
      cell: ({ row }) => (
        <span className={cellNumClass}>
          {row.original.imponibile == null ? <CellEmpty /> : formatCurrency(row.original.imponibile)}
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

  const openDialog = () => { setForm(emptyForm()); setDialogOpen(true); };

  if (isLoading) return <BilancioSpeseSkeleton />;

  return (
    <>
      <AddModal
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleAdd}
        title="Nuova spesa"
        subtitle="Registra una nuova spesa"
        classes="max-w-md"
        confirmText={isSaving ? 'Salvataggio…' : 'Aggiungi'}
        confirmDisabled={isSaving}
      >
        <div className="flex flex-col gap-4">
          <Field label="Data" required>
            {({ id }) => <DateField id={id} value={form.data} onChange={(v) => set('data', v)} />}
          </Field>
          <FormInput
            label="Fornitore"
            required
            placeholder="es. Enel, Amazon…"
            value={form.fornitore}
            onChange={(e) => set('fornitore', e.target.value)}
          />
          <Field label="Categoria" required>
            {({ id }) => (
              <Select
                id={id}
                value={form.categoria}
                onChange={(v) => set('categoria', v)}
                options={CATEGORIE.map((c) => ({ value: c, label: c }))}
                labelKey="label"
                valueKey="value"
                searchable={false}
              />
            )}
          </Field>
          <FormInput
            label="Importo pagato, IVA inclusa (€)"
            required
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={form.importo}
            onChange={(e) => set('importo', e.target.value)}
          />
          <FormInput
            label="Importo senza IVA (€)"
            type="number"
            min="0"
            step="0.01"
            placeholder="Facoltativo"
            value={form.imponibile}
            onChange={(e) => set('imponibile', e.target.value)}
            hint={<>Lo trovi in fattura come &quot;imponibile&quot;. Se lo lasci vuoto, nel bilancio conta l&apos;importo pagato.</>}
          />
        </div>
      </AddModal>

      <DeleteModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        busy={isDeleting}
        title="Elimina spesa"
        subtitle={toDelete ? `La spesa di ${toDelete.fornitore} del ${formatDateDisplay(toDelete.data, 'dd/MM/yyyy')} (${formatCurrency(toDelete.importo)}) esce dal bilancio. Non si può annullare.` : undefined}
        confirmText="Elimina spesa"
      />

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
          <Button variant="primary" leadingIcon={Plus} onClick={openDialog}>
            Nuova spesa
          </Button>
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
                        aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                        className={thClass({ sortable: canSort })}
                      >
                        <span className="inline-flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && <SortIndicator direction={sorted} />}
                        </span>
                      </th>
                    );
                  })}
                  <th className={`${thClass({ align: 'right' })} w-16`}>
                    Azioni
                  </th>
                </tr>
              ))}
            </thead>
            <tbody className={tbodyClass}>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className={trClass({ interactive: false })}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={tdClass}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                  <td className={tdClass}>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost-destructive"
                        size="sm"
                        iconOnly
                        aria-label="Elimina"
                        onClick={() => { setToDelete(row.original); setDeleteOpen(true); }}
                      >
                        <Trash2 />
                      </Button>
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
