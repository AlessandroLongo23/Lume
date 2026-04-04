'use client';

import { ALargeSmall, Tag, Factory, Truck, Euro, Droplets } from 'lucide-react';
import { CustomNumberInput } from '@/lib/components/shared/ui/forms/CustomNumberInput';
import { useProductsStore } from '@/lib/stores/products';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { useManufacturersStore } from '@/lib/stores/manufacturers';
import { useSuppliersStore } from '@/lib/stores/suppliers';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { EditModal } from '@/lib/components/shared/ui/modals/EditModal';
import { CustomSelect } from '@/lib/components/shared/ui/forms/CustomSelect';
import type { Product } from '@/lib/types/Product';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editedProduct: Partial<Product>;
  onEditedProductChange: (p: Partial<Product>) => void;
  selectedProduct: Product | null;
}

export function EditProductModal({ isOpen, onClose, editedProduct, onEditedProductChange, selectedProduct }: EditProductModalProps) {
  const updateProduct = useProductsStore((s) => s.updateProduct);
  const categories = useProductCategoriesStore((s) => s.product_categories);
  const manufacturers = useManufacturersStore((s) => s.manufacturers);
  const suppliers = useSuppliersStore((s) => s.suppliers);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const set = (key: string, value: any) => onEditedProductChange({ ...editedProduct, [key]: value });

  const handleSubmit = async () => {
    if (!selectedProduct) return;
    try {
      await updateProduct(selectedProduct.id, { ...selectedProduct, ...editedProduct });
      messagePopup.getState().success('Prodotto aggiornato con successo!');
      onClose();
    } catch {
      messagePopup.getState().error("Errore durante l'aggiornamento.");
    }
  };

  const inputClass = 'w-full p-2 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100';
  const labelClass = 'flex flex-row items-center gap-2';

  return (
    <EditModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="Modifica Prodotto" subtitle="Aggiorna i dati del prodotto" classes="max-w-2xl">
      <div className="flex flex-col gap-4">
        <div className="flex flex-row gap-4">
          <div className="flex flex-1 flex-col gap-2">
            <label className={labelClass}><ALargeSmall className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Nome *</span></label>
            <input type="text" className={inputClass} value={editedProduct.name ?? ''} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div className="flex w-36 flex-col gap-2">
            <label className={labelClass}><Droplets className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Quantità</span></label>
            <CustomNumberInput value={editedProduct.quantity_ml ?? null} onChange={(v) => set('quantity_ml', v)} min={0} step={50} suffix="mL" />
          </div>
        </div>

        <div className="flex flex-row gap-4">
          <div className="flex flex-1 flex-col gap-2">
            <label className={labelClass}><Tag className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Categoria</span></label>
            <CustomSelect options={categories} labelKey="name" valueKey="id" value={editedProduct.product_category_id ?? ''} onChange={(v) => set('product_category_id', v)} placeholder="Seleziona categoria" />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <label className={labelClass}><Factory className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Produttore</span></label>
            <CustomSelect options={manufacturers} labelKey="name" valueKey="id" value={editedProduct.manufacturer_id ?? ''} onChange={(v) => set('manufacturer_id', v)} placeholder="Seleziona produttore" isNullable />
          </div>
        </div>

        <div className="flex flex-row gap-4">
          <div className="flex flex-1 flex-col gap-2">
            <label className={labelClass}><Truck className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Fornitore</span></label>
            <CustomSelect options={suppliers} labelKey="name" valueKey="id" value={editedProduct.supplier_id ?? ''} onChange={(v) => set('supplier_id', v)} placeholder="Seleziona fornitore" isNullable />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <label className={labelClass}><Euro className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Prezzo</span></label>
            <CustomNumberInput value={editedProduct.price ?? null} onChange={(v) => set('price', v ?? 0)} min={0} step={0.5} decimals={2} suffix="€" />
          </div>
        </div>
      </div>
    </EditModal>
  );
}
