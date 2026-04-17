'use client';

import { useState, useEffect } from 'react';
import { FlaskConical } from 'lucide-react';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useProductsStore } from '@/lib/stores/products';
import { ProductForm, emptyProductForm, type ProductFormValue, type ProductFormErrors } from './ProductForm';
import type { Product } from '@/lib/types/Product';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackInventory: boolean;
}

export function ProductModal({ isOpen, onClose, trackInventory }: ProductModalProps) {
  const addProduct = useProductsStore((s) => s.addProduct);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);

  const [form, setForm] = useState<ProductFormValue>(emptyProductForm());
  const [errors, setErrors] = useState<ProductFormErrors>({});

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(emptyProductForm());
      setErrors({});
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    const errs: ProductFormErrors = {};
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
      await addProduct(payload);
      await fetchProducts();
      messagePopup.getState().success('Prodotto aggiunto con successo.');
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error(msg);
    }
  };

  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Nuovo Prodotto"
      subtitle="Aggiungi un nuovo prodotto al magazzino"
      icon={FlaskConical}
      confirmText="Aggiungi"
      classes="max-w-2xl"
      contentClasses="overflow-y-auto"
    >
      <ProductForm value={form} onChange={setForm} errors={errors} trackInventory={trackInventory} />
    </AddModal>
  );
}
