'use client';

import { useState } from 'react';
import { ALargeSmall, Tag, Factory, Truck, Euro } from 'lucide-react';
import { useProductsStore } from '@/lib/stores/products';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { useManufacturersStore } from '@/lib/stores/manufacturers';
import { useSuppliersStore } from '@/lib/stores/suppliers';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { CustomSelect } from '@/lib/components/shared/ui/forms/CustomSelect';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emptyProduct = () => ({ name: '', product_category_id: '', manufacturer_id: '', supplier_id: '', price: 0 });
const emptyErrors = () => ({ name: '', product_category_id: '', price: '' });

export function AddProductModal({ isOpen, onClose }: AddProductModalProps) {
  const addProduct = useProductsStore((s) => s.addProduct);
  const categories = useProductCategoriesStore((s) => s.product_categories);
  const manufacturers = useManufacturersStore((s) => s.manufacturers);
  const suppliers = useSuppliersStore((s) => s.suppliers);

  const [product, setProduct] = useState(emptyProduct());
  const [errors, setErrors] = useState(emptyErrors());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const set = (key: string, value: any) => setProduct((p) => ({ ...p, [key]: value }));

  const handleSubmit = async () => {
    const e = emptyErrors();
    if (!product.name) e.name = 'Inserisci un nome';
    if (!product.product_category_id) e.product_category_id = 'Seleziona una categoria';
    if (product.price <= 0) e.price = 'Inserisci un prezzo valido';
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;

    try {
      await addProduct(product);
      messagePopup.getState().success('Prodotto aggiunto con successo');
      setProduct(emptyProduct());
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error('Errore durante la creazione del prodotto: ' + msg);
    }
  };

  const inputClass = 'w-full p-2 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100';
  const labelClass = 'flex flex-row items-center gap-2';

  return (
    <AddModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="Nuovo prodotto" subtitle="Aggiungi un nuovo prodotto" classes="max-w-2xl">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className={labelClass}><ALargeSmall className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Nome *</span></label>
          <input type="text" className={inputClass} value={product.name} onChange={(e) => set('name', e.target.value)} />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>

        <div className="flex flex-row gap-4">
          <div className="flex flex-1 flex-col gap-2">
            <label className={labelClass}><Tag className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Categoria *</span></label>
            <CustomSelect options={categories} labelKey="name" valueKey="id" value={product.product_category_id} onChange={(v) => set('product_category_id', v)} placeholder="Seleziona categoria" />
            {errors.product_category_id && <p className="text-xs text-red-500">{errors.product_category_id}</p>}
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <label className={labelClass}><Factory className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Produttore</span></label>
            <CustomSelect options={manufacturers} labelKey="name" valueKey="id" value={product.manufacturer_id} onChange={(v) => set('manufacturer_id', v)} placeholder="Seleziona produttore" isNullable />
          </div>
        </div>

        <div className="flex flex-row gap-4">
          <div className="flex flex-1 flex-col gap-2">
            <label className={labelClass}><Truck className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Fornitore</span></label>
            <CustomSelect options={suppliers} labelKey="name" valueKey="id" value={product.supplier_id} onChange={(v) => set('supplier_id', v)} placeholder="Seleziona fornitore" isNullable />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <label className={labelClass}><Euro className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Prezzo *</span></label>
            <div className="relative">
              <input type="number" className={inputClass} min="0" step="0.01" value={product.price} onChange={(e) => set('price', parseFloat(e.target.value) || 0)} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">€</span>
            </div>
            {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
          </div>
        </div>
      </div>
    </AddModal>
  );
}
