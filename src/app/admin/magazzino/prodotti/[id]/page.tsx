'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Tag, Factory, Truck, Euro, Droplets, FlaskConical, Archive, ArchiveRestore, Save, X, Package, ShoppingBag } from 'lucide-react';
import { useProductsStore } from '@/lib/stores/products';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { useManufacturersStore } from '@/lib/stores/manufacturers';
import { useSuppliersStore } from '@/lib/stores/suppliers';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { DeleteProductModal } from '@/lib/components/admin/magazzino/DeleteProductModal';
import { ProductForm, emptyProductForm, type ProductFormValue, type ProductFormErrors } from '@/lib/components/admin/magazzino/ProductForm';
import type { Product } from '@/lib/types/Product';

function productToDraft(product: Product): ProductFormValue {
  return {
    name: product.name,
    manufacturer_id: product.manufacturer_id ?? '',
    product_category_id: product.product_category_id ?? '',
    supplier_id: product.supplier_id ?? '',
    price: product.price,
    sell_price: product.sell_price ?? null,
    is_for_retail: product.is_for_retail ?? false,
    stock_quantity: product.stock_quantity ?? 0,
    min_threshold: product.min_threshold ?? 0,
    quantity_ml: product.quantity_ml ?? null,
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const products = useProductsStore((s) => s.products);
  const isLoading = useProductsStore((s) => s.isLoading);
  const updateProduct = useProductsStore((s) => s.updateProduct);
  const archiveProduct = useProductsStore((s) => s.archiveProduct);
  const restoreProduct = useProductsStore((s) => s.restoreProduct);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);
  const categories = useProductCategoriesStore((s) => s.product_categories);
  const manufacturers = useManufacturersStore((s) => s.manufacturers);
  const suppliers = useSuppliersStore((s) => s.suppliers);

  const [product, setProduct] = useState<Product | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ProductFormValue>(emptyProductForm());
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [trackInventory, setTrackInventory] = useState(false);

  const productId = params.id as string;

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.track_inventory === 'boolean') setTrackInventory(data.track_inventory);
      })
      .catch(() => {});
  }, []);

  const isDirty = useMemo(() => {
    if (!isEditing || !product) return false;
    const baseline = productToDraft(product);
    const keys: (keyof ProductFormValue)[] = ['name', 'manufacturer_id', 'product_category_id', 'supplier_id', 'price', 'sell_price', 'is_for_retail', 'stock_quantity', 'min_threshold', 'quantity_ml'];
    return keys.some((k) => draft[k] !== baseline[k]);
  }, [isEditing, draft, product]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  useEffect(() => {
    if (!isLoading) {
      const found = products.find((p) => p.id === productId);
      if (found) setProduct(found);
    }
  }, [products, productId, isLoading]);

  const handleEnterEdit = () => {
    if (!product) return;
    setDraft(productToDraft(product));
    setErrors({});
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (isDirty && !window.confirm('Scartare le modifiche?')) return;
    setIsEditing(false);
    setDraft(emptyProductForm());
    setErrors({});
  };

  const handleBack = () => {
    if (isEditing && isDirty && !window.confirm('Scartare le modifiche?')) return;
    router.push('/admin/magazzino');
  };

  const handleSave = async () => {
    if (!product) return;

    const newErrors: ProductFormErrors = {};
    if (!draft.name.trim()) newErrors.name = 'Il nome è obbligatorio.';
    if (draft.price === null || draft.price < 0) newErrors.price = 'Inserisci un prezzo valido.';
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) {
      messagePopup.getState().error('Correggi gli errori nel form');
      return;
    }

    const payload: Partial<Product> = {
      name: draft.name.trim(),
      manufacturer_id: draft.manufacturer_id || undefined,
      product_category_id: draft.product_category_id || undefined,
      supplier_id: draft.supplier_id || undefined,
      price: draft.price ?? 0,
      is_for_retail: draft.is_for_retail,
      sell_price: draft.is_for_retail && draft.sell_price !== null ? draft.sell_price : null,
      quantity_ml: draft.quantity_ml,
      stock_quantity: trackInventory ? Number(draft.stock_quantity) : 0,
      min_threshold: trackInventory ? Number(draft.min_threshold) : 0,
    };

    setSaving(true);
    try {
      await updateProduct(product.id, payload);
      await fetchProducts();
      messagePopup.getState().success('Prodotto aggiornato con successo.');
      setIsEditing(false);
      setDraft(emptyProductForm());
      setErrors({});
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleArchive = async () => {
    if (!product) return;
    try {
      if (product.isArchived) {
        await restoreProduct(product.id);
        messagePopup.getState().success('Prodotto ripristinato.');
      } else {
        await archiveProduct(product.id);
        messagePopup.getState().success('Prodotto archiviato.');
        router.push('/admin/magazzino');
      }
      await fetchProducts();
    } catch {
      messagePopup.getState().error("Errore durante l'operazione.");
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><div className="w-12 h-12 border-4 border-zinc-500/25 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <h2 className="text-xl font-bold">Prodotto non trovato</h2>
        <button className="mt-4 px-4 py-2 bg-zinc-200 rounded-md" onClick={() => router.push('/admin/magazzino')}>Torna al magazzino</button>
      </div>
    );
  }

  const category = categories.find((c) => c.id === product.product_category_id);
  const manufacturer = manufacturers.find((m) => m.id === product.manufacturer_id);
  const supplier = suppliers.find((s) => s.id === product.supplier_id);

  return (
    <>
      <DeleteProductModal isOpen={showDelete} onClose={() => setShowDelete(false)} selectedProduct={product} />

      <div className="flex flex-col gap-4 max-w-2xl">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors">
            <ArrowLeft className="size-5 text-zinc-600 dark:text-zinc-300" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="size-5 text-zinc-500" />
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{product.name}</h1>
              {product.isArchived && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">Archiviato</span>
              )}
            </div>
            <p className="text-sm text-zinc-500">{category?.name ?? 'Prodotto'}</p>
          </div>
          <div className="ml-auto flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-md transition-colors disabled:opacity-50"
                >
                  <X className="size-4" />
                  Annulla
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary-hover hover:bg-primary-active text-white rounded-md transition-colors disabled:opacity-50"
                >
                  <Save className="size-4" />
                  {saving ? 'Salvando...' : 'Salva'}
                </button>
              </>
            ) : (
              <>
                {!product.isArchived && (
                  <button onClick={handleEnterEdit} className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 rounded-md">
                    <Edit className="size-5 text-zinc-600 dark:text-zinc-300" />
                  </button>
                )}
                <button
                  onClick={handleToggleArchive}
                  className="p-2 bg-zinc-100 hover:bg-amber-100 dark:bg-zinc-800 dark:hover:bg-amber-900/30 rounded-md transition-colors"
                  title={product.isArchived ? 'Ripristina prodotto' : 'Archivia prodotto'}
                >
                  {product.isArchived ? <ArchiveRestore className="size-5 text-zinc-600 dark:text-zinc-300" /> : <Archive className="size-5 text-zinc-600 dark:text-zinc-300" />}
                </button>
                <button onClick={() => setShowDelete(true)} className="p-2 bg-zinc-100 hover:bg-red-100 dark:bg-zinc-800 rounded-md">
                  <Trash2 className="size-5 text-zinc-600 dark:text-zinc-300" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-500/25 p-6">
          {isEditing ? (
            <ProductForm value={draft} onChange={setDraft} errors={errors} trackInventory={trackInventory} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <Tag className="size-4 text-zinc-500" />
                <div>
                  <p className="text-xs text-zinc-500">Categoria</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{category?.name ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Factory className="size-4 text-zinc-500" />
                <div>
                  <p className="text-xs text-zinc-500">Marca</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{manufacturer?.name ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Truck className="size-4 text-zinc-500" />
                <div>
                  <p className="text-xs text-zinc-500">Fornitore</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{supplier?.name ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Droplets className="size-4 text-zinc-500" />
                <div>
                  <p className="text-xs text-zinc-500">Quantità</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{product.quantity_ml ? `${product.quantity_ml} mL` : '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Euro className="size-4 text-zinc-500" />
                <div>
                  <p className="text-xs text-zinc-500">Prezzo Acquisto</p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">€ {product.price.toFixed(2)}</p>
                </div>
              </div>
              {product.is_for_retail && (
                <div className="flex items-center gap-3">
                  <ShoppingBag className="size-4 text-zinc-500" />
                  <div>
                    <p className="text-xs text-zinc-500">Prezzo Vendita</p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {product.sell_price !== null ? `€ ${product.sell_price.toFixed(2)}` : '—'}
                    </p>
                  </div>
                </div>
              )}
              {trackInventory && (
                <>
                  <div className="flex items-center gap-3">
                    <Package className="size-4 text-zinc-500" />
                    <div>
                      <p className="text-xs text-zinc-500">Giacenza</p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{product.stock_quantity ?? 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Package className="size-4 text-zinc-500" />
                    <div>
                      <p className="text-xs text-zinc-500">Soglia Minima</p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{product.min_threshold ?? 0}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
