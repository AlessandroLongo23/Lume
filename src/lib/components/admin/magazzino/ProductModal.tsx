'use client';

import { useState, useEffect } from 'react';
import { Plus, FlaskConical } from 'lucide-react';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { Switch } from '@/lib/components/shared/ui/Switch';
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
  price: '' as string | number,
  sell_price: '' as string | number,
  is_for_retail: false,
  stock_quantity: 0,
  min_threshold: 0,
});

const emptyErrors = () => ({
  name: '',
  price: '',
});

// ─── Inline mini-modals ───────────────────────────────────────────────────────

function AddCategoryInline({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const addProductCategory = useProductCategoriesStore((s) => s.addProductCategory);
  const fetchProductCategories = useProductCategoriesStore((s) => s.fetchProductCategories);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) return;
    try {
      const created = await addProductCategory({ name: name.trim(), description: description.trim() || undefined });
      await fetchProductCategories();
      onCreated(created.id);
    } catch {
      messagePopup.getState().error('Errore durante la creazione della categoria.');
    }
  };

  return (
    <AddModal isOpen onClose={onClose} onSubmit={handleSubmit} title="Nuova Categoria" subtitle="Aggiungi una categoria prodotto" classes="max-w-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            placeholder="es. Coloranti, Shampoo..."
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Descrizione</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>
      </div>
    </AddModal>
  );
}

function AddManufacturerInline({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const addManufacturer = useManufacturersStore((s) => s.addManufacturer);
  const fetchManufacturers = useManufacturersStore((s) => s.fetchManufacturers);
  const [name, setName] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) return;
    try {
      const created = await addManufacturer({ name: name.trim() });
      await fetchManufacturers();
      onCreated(created.id);
    } catch {
      messagePopup.getState().error('Errore durante la creazione della marca.');
    }
  };

  return (
    <AddModal isOpen onClose={onClose} onSubmit={handleSubmit} title="Nuova Marca" subtitle="Aggiungi una marca prodotto" classes="max-w-sm">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          placeholder="es. L'Oréal, Wella..."
        />
      </div>
    </AddModal>
  );
}

function AddSupplierInline({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const addSupplier = useSuppliersStore((s) => s.addSupplier);
  const fetchSuppliers = useSuppliersStore((s) => s.fetchSuppliers);
  const [name, setName] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) return;
    try {
      const created = await addSupplier({ name: name.trim() });
      await fetchSuppliers();
      onCreated(created.id);
    } catch {
      messagePopup.getState().error('Errore durante la creazione del fornitore.');
    }
  };

  return (
    <AddModal isOpen onClose={onClose} onSubmit={handleSubmit} title="Nuovo Fornitore" subtitle="Aggiungi un fornitore" classes="max-w-sm">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          placeholder="es. Distribuzione Sud..."
        />
      </div>
    </AddModal>
  );
}

// ─── Main ProductModal ────────────────────────────────────────────────────────

export function ProductModal({ isOpen, onClose, selectedProduct, trackInventory }: ProductModalProps) {
  const addProduct = useProductsStore((s) => s.addProduct);
  const updateProduct = useProductsStore((s) => s.updateProduct);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);

  const categories = useProductCategoriesStore((s) => s.product_categories);
  const manufacturers = useManufacturersStore((s) => s.manufacturers);
  const suppliers = useSuppliersStore((s) => s.suppliers);

  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState(emptyErrors());
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddManufacturer, setShowAddManufacturer] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);

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
        sell_price: selectedProduct.sell_price ?? '',
        is_for_retail: selectedProduct.is_for_retail ?? false,
        stock_quantity: selectedProduct.stock_quantity ?? 0,
        min_threshold: selectedProduct.min_threshold ?? 0,
      });
    } else {
      setForm(emptyForm());
    }
    setErrors(emptyErrors());
  }, [selectedProduct, isOpen]);

  const handleSubmit = async () => {
    const errs = emptyErrors();
    if (!form.name.trim()) errs.name = 'Il nome è obbligatorio.';
    if (form.price === '' || Number(form.price) < 0) errs.price = 'Inserisci un prezzo valido.';
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    const payload: Partial<Product> = {
      name: form.name.trim(),
      manufacturer_id: form.manufacturer_id || undefined,
      product_category_id: form.product_category_id || undefined,
      supplier_id: form.supplier_id || undefined,
      price: Number(form.price),
      is_for_retail: form.is_for_retail,
      sell_price: form.is_for_retail && form.sell_price !== '' ? Number(form.sell_price) : null,
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

  const inputClass = 'w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40';
  const labelClass = 'text-sm font-medium text-zinc-700 dark:text-zinc-300';
  const errorClass = 'text-xs text-red-500 mt-1';

  return (
    <>
      {showAddCategory && (
        <AddCategoryInline
          onClose={() => setShowAddCategory(false)}
          onCreated={(id) => { set('product_category_id', id); setShowAddCategory(false); }}
        />
      )}
      {showAddManufacturer && (
        <AddManufacturerInline
          onClose={() => setShowAddManufacturer(false)}
          onCreated={(id) => { set('manufacturer_id', id); setShowAddManufacturer(false); }}
        />
      )}
      {showAddSupplier && (
        <AddSupplierInline
          onClose={() => setShowAddSupplier(false)}
          onCreated={(id) => { set('supplier_id', id); setShowAddSupplier(false); }}
        />
      )}

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
      >
        <div className="flex flex-col gap-5">
          {/* Nome — full width */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Nome *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className={inputClass}
              placeholder="es. Shampoo Idratante 500ml"
            />
            {errors.name && <p className={errorClass}>{errors.name}</p>}
          </div>

          {/* Marca | Categoria */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Marca</label>
              <select
                value={form.manufacturer_id}
                onChange={(e) => set('manufacturer_id', e.target.value)}
                className={inputClass}
              >
                <option value="">— Seleziona marca —</option>
                {manufacturers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowAddManufacturer(true)}
                className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors w-fit"
              >
                <Plus className="size-3.5" />
                Aggiungi nuova marca
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Categoria</label>
              <select
                value={form.product_category_id}
                onChange={(e) => set('product_category_id', e.target.value)}
                className={inputClass}
              >
                <option value="">— Seleziona categoria —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowAddCategory(true)}
                className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors w-fit"
              >
                <Plus className="size-3.5" />
                Aggiungi nuova categoria
              </button>
            </div>
          </div>

          {/* Fornitore | Prezzo Acquisto */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Fornitore</label>
              <select
                value={form.supplier_id}
                onChange={(e) => set('supplier_id', e.target.value)}
                className={inputClass}
              >
                <option value="">— Seleziona fornitore —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowAddSupplier(true)}
                className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors w-fit"
              >
                <Plus className="size-3.5" />
                Aggiungi nuovo fornitore
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Prezzo Acquisto (€) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                className={inputClass}
                placeholder="0.00"
              />
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
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.sell_price}
                onChange={(e) => set('sell_price', e.target.value)}
                className={inputClass}
                placeholder="0.00"
              />
            </div>
          )}

          {/* Inventory fields (feature flag) */}
          {trackInventory && (
            <div className="flex flex-col gap-4 pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Gestione Scorte</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Giacenza Iniziale</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock_quantity}
                    onChange={(e) => set('stock_quantity', Number(e.target.value))}
                    className={inputClass}
                    placeholder="0"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Soglia Minima</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.min_threshold}
                    onChange={(e) => set('min_threshold', Number(e.target.value))}
                    className={inputClass}
                    placeholder="0"
                  />
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
