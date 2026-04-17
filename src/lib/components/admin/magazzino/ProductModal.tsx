'use client';

import { useState, useEffect } from 'react';
import { FlaskConical, Archive, ArchiveRestore } from 'lucide-react';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { Switch } from '@/lib/components/shared/ui/Switch';
import { CustomSelect } from '@/lib/components/shared/ui/forms/CustomSelect';
import { CustomNumberInput } from '@/lib/components/shared/ui/forms/CustomNumberInput';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useProductsStore } from '@/lib/stores/products';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { useSuppliersStore } from '@/lib/stores/suppliers';
import { useManufacturersStore } from '@/lib/stores/manufacturers';
import type { Product } from '@/lib/types/Product';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct: Product | null;
  trackInventory: boolean;
}

const emptyForm = () => ({
  name: '',
  manufacturer_id: '',
  product_category_id: '',
  supplier_id: '',
  price: null as number | null,
  sell_price: null as number | null,
  is_for_retail: false,
  stock_quantity: 0,
  min_threshold: 0,
  quantity_ml: null as number | null,
});

const emptyErrors = () => ({
  name: '',
  price: '',
});

// ─── Main ProductModal ────────────────────────────────────────────────────────

export function ProductModal({ isOpen, onClose, selectedProduct, trackInventory }: ProductModalProps) {
  const addProduct = useProductsStore((s) => s.addProduct);
  const updateProduct = useProductsStore((s) => s.updateProduct);
  const archiveProduct = useProductsStore((s) => s.archiveProduct);
  const restoreProduct = useProductsStore((s) => s.restoreProduct);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);

  const categories = useProductCategoriesStore((s) => s.product_categories);
  const manufacturers = useManufacturersStore((s) => s.manufacturers);
  const suppliers = useSuppliersStore((s) => s.suppliers);

  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState(emptyErrors());

  const set = <K extends keyof ReturnType<typeof emptyForm>>(key: K, value: ReturnType<typeof emptyForm>[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (selectedProduct) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        name: selectedProduct.name,
        manufacturer_id: selectedProduct.manufacturer_id ?? '',
        product_category_id: selectedProduct.product_category_id ?? '',
        supplier_id: selectedProduct.supplier_id ?? '',
        price: selectedProduct.price,
        sell_price: selectedProduct.sell_price ?? null,
        is_for_retail: selectedProduct.is_for_retail ?? false,
        stock_quantity: selectedProduct.stock_quantity ?? 0,
        min_threshold: selectedProduct.min_threshold ?? 0,
        quantity_ml: selectedProduct.quantity_ml ?? null,
      });
    } else {
      setForm(emptyForm());
    }
    setErrors(emptyErrors());
  }, [selectedProduct, isOpen]);

  const handleSubmit = async () => {
    const errs = emptyErrors();
    if (!form.name.trim()) errs.name = 'Il nome è obbligatorio.';
    if (form.price === null || form.price < 0) errs.price = 'Inserisci un prezzo valido.';
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    const payload: Partial<Product> = {
      name: form.name.trim(),
      manufacturer_id: form.manufacturer_id || undefined,
      product_category_id: form.product_category_id || undefined,
      supplier_id: form.supplier_id || undefined,
      price: form.price ?? 0,
      is_for_retail: form.is_for_retail,
      sell_price: form.is_for_retail && form.sell_price !== null ? form.sell_price : null,
      quantity_ml: form.quantity_ml,
      stock_quantity: trackInventory ? Number(form.stock_quantity) : 0,
      min_threshold: trackInventory ? Number(form.min_threshold) : 0,
    };

    try {
      if (selectedProduct) {
        await updateProduct(selectedProduct.id, payload);
        messagePopup.getState().success('Prodotto aggiornato con successo.');
      } else {
        await addProduct(payload);
        messagePopup.getState().success('Prodotto aggiunto con successo.');
      }
      await fetchProducts();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error(msg);
    }
  };

  const handleToggleArchive = async () => {
    if (!selectedProduct) return;
    try {
      if (selectedProduct.isArchived) {
        await restoreProduct(selectedProduct.id);
        messagePopup.getState().success('Prodotto ripristinato.');
      } else {
        await archiveProduct(selectedProduct.id);
        messagePopup.getState().success('Prodotto archiviato.');
      }
      await fetchProducts();
      onClose();
    } catch {
      messagePopup.getState().error("Errore durante l'operazione.");
    }
  };

  const inputClass = 'w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40';
  const labelClass = 'text-sm font-medium text-zinc-700 dark:text-zinc-300';
  const errorClass = 'text-xs text-red-500 mt-1';

  return (
    <>
      <AddModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleSubmit}
        title={selectedProduct ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
        subtitle={selectedProduct ? `Modifica i dati di ${selectedProduct.name}` : 'Aggiungi un nuovo prodotto al magazzino'}
        icon={FlaskConical}
        confirmText={selectedProduct ? 'Aggiorna' : 'Aggiungi'}
        classes="max-w-2xl"
        contentClasses="overflow-y-auto"
        footerContent={
          selectedProduct && (
            <button
              type="button"
              className="flex flex-row items-center justify-center gap-2 px-4 py-2.5 text-sm font-thin rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
              onClick={handleToggleArchive}
            >
              {selectedProduct.isArchived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
              {selectedProduct.isArchived ? 'Ripristina' : 'Archivia'}
            </button>
          )
        }
      >
        <div className="flex flex-col gap-5">
          {/* Nome | Quantità */}
          <div className="flex gap-4">
            <div className="flex flex-1 flex-col gap-1.5">
              <label className={labelClass}>Nome *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className={inputClass}
                placeholder="Inserisci nome prodotto"
              />
              {errors.name && <p className={errorClass}>{errors.name}</p>}
            </div>
            <div className="flex w-36 flex-col gap-1.5">
              <label className={labelClass}>Quantità</label>
              <CustomNumberInput value={form.quantity_ml} onChange={(v) => set('quantity_ml', v)} min={0} step={50} suffix="mL" />
            </div>
          </div>

          {/* Marca | Categoria */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Marca</label>
              <CustomSelect
                options={manufacturers}
                labelKey="name"
                valueKey="id"
                value={form.manufacturer_id}
                onChange={(v) => set('manufacturer_id', v ?? '')}
                placeholder="Seleziona marca"
                isNullable
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Categoria</label>
              <CustomSelect
                options={categories}
                labelKey="name"
                valueKey="id"
                value={form.product_category_id}
                onChange={(v) => set('product_category_id', v ?? '')}
                placeholder="Seleziona categoria"
                isNullable
              />
            </div>
          </div>

          {/* Fornitore | Prezzo Acquisto */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Fornitore</label>
              <CustomSelect
                options={suppliers}
                labelKey="name"
                valueKey="id"
                value={form.supplier_id}
                onChange={(v) => set('supplier_id', v ?? '')}
                placeholder="Seleziona fornitore"
                isNullable
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Prezzo Acquisto (€) *</label>
              <CustomNumberInput value={form.price} onChange={(v) => set('price', v)} min={0} step={0.5} decimals={2} suffix="€" />
              {errors.price && <p className={errorClass}>{errors.price}</p>}
            </div>
          </div>

          {/* Rivendita toggle — full width */}
          <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Destinato alla rivendita</p>
              <p className="text-xs text-zinc-500 mt-0.5">Abilita un prezzo di vendita al pubblico</p>
            </div>
            <Switch checked={form.is_for_retail} onChange={() => set('is_for_retail', !form.is_for_retail)} />
          </div>

          {/* Prezzo Vendita (conditional) */}
          {form.is_for_retail && (
            <div className="flex flex-col gap-1.5 max-w-[calc(50%-8px)]">
              <label className={labelClass}>Prezzo Vendita (€)</label>
              <CustomNumberInput value={form.sell_price} onChange={(v) => set('sell_price', v)} min={0} step={0.5} decimals={2} suffix="€" />
            </div>
          )}

          {/* Inventory fields (feature flag) */}
          {trackInventory && (
            <div className="flex flex-col gap-4 pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Gestione Scorte</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Giacenza Iniziale</label>
                  <CustomNumberInput value={form.stock_quantity} onChange={(v) => set('stock_quantity', v ?? 0)} min={0} step={1} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Soglia Minima</label>
                  <CustomNumberInput value={form.min_threshold} onChange={(v) => set('min_threshold', v ?? 0)} min={0} step={1} />
                  <p className="text-xs text-zinc-500">Alert rosso quando la giacenza scende sotto questa soglia.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </AddModal>
    </>
  );
}
