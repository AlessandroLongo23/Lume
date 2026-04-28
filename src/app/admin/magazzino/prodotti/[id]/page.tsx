'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { Trash2, FlaskConical, Archive, ArchiveRestore, PackageX, ShoppingBag } from 'lucide-react';
import { useProductsStore } from '@/lib/stores/products';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { useManufacturersStore } from '@/lib/stores/manufacturers';
import { useSuppliersStore } from '@/lib/stores/suppliers';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { trackRecent } from '@/lib/components/shell/commandMenu/recents';
import { ConfirmDialog } from '@/lib/components/shared/ui/modals/ConfirmDialog';
import {
  DetailHero,
  DetailSection,
  DetailHeroActions,
  DetailChip,
  HeroIconTile,
  StatTile,
  ProgressBar,
} from '@/lib/components/shared/ui/detail';
import { DeleteProductModal } from '@/lib/components/admin/magazzino/DeleteProductModal';
import { ProductForm, emptyProductForm, type ProductFormValue, type ProductFormErrors } from '@/lib/components/admin/magazzino/ProductForm';
import type { Product } from '@/lib/types/Product';

function formatEur(amount: number | null): string {
  if (amount === null) return '—';
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

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
  const searchParams = useSearchParams();
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
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ProductFormValue>(emptyProductForm());
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [trackInventory, setTrackInventory] = useState(false);
  const [discardConfirm, setDiscardConfirm] = useState<{ action: () => void } | null>(null);

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
      else setError('Prodotto non trovato');
    }
  }, [products, productId, isLoading]);

  useEffect(() => {
    if (!product) return;
    const sellPrice = product.sell_price != null ? Number(product.sell_price) : product.price;
    const subtitle = sellPrice
      ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(sellPrice)
      : undefined;
    trackRecent({
      type: 'product',
      id: product.id,
      label: product.name || 'Prodotto',
      subtitle,
      href: `/admin/magazzino/prodotti/${product.id}`,
    });
  }, [product]);

  useEffect(() => {
    if (!product) return;
    if (searchParams.get('edit') !== product.id) return;
    setDraft(productToDraft(product));
    setErrors({});
    setIsEditing(true);
    router.replace(`/admin/magazzino/prodotti/${product.id}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, searchParams]);

  const handleEnterEdit = () => {
    if (!product) return;
    setDraft(productToDraft(product));
    setErrors({});
    setIsEditing(true);
  };

  const exitEditMode = () => {
    setIsEditing(false);
    setDraft(emptyProductForm());
    setErrors({});
  };

  const handleCancel = () => {
    if (isDirty) {
      setDiscardConfirm({ action: exitEditMode });
      return;
    }
    exitEditMode();
  };

  const handleBack = () => {
    const goBack = () => router.push('/admin/magazzino');
    if (isEditing && isDirty) {
      setDiscardConfirm({ action: goBack });
      return;
    }
    goBack();
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
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="w-16 h-16 border-4 border-zinc-500/25 border-t-primary rounded-full animate-spin" />
        <p className="mt-4 text-zinc-500 dark:text-zinc-400">Caricamento...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <PackageX className="size-16 text-zinc-300 dark:text-zinc-600 mb-4" strokeWidth={1.5} />
        <h2 className="text-xl font-semibold text-zinc-700 dark:text-zinc-200 mb-2">Prodotto non trovato</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{error ?? 'Il prodotto non esiste o è stato rimosso.'}</p>
        <button
          className="mt-6 px-4 py-2 text-sm bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-md transition-colors"
          onClick={() => router.push('/admin/magazzino')}
        >
          Torna al magazzino
        </button>
      </div>
    );
  }

  const category = categories.find((c) => c.id === product.product_category_id);
  const manufacturer = manufacturers.find((m) => m.id === product.manufacturer_id);
  const supplier = suppliers.find((s) => s.id === product.supplier_id);

  const stock = product.stock_quantity ?? 0;
  const minThreshold = product.min_threshold ?? 0;
  const isOut = trackInventory && stock <= 0;
  const isLow = trackInventory && !isOut && stock < minThreshold;
  const stockTone = isOut ? 'red' : isLow ? 'amber' : 'emerald';
  const stockAccent = isOut ? 'Esaurito' : isLow ? 'Sotto soglia' : 'OK';
  const stockDenom = Math.max(stock, minThreshold, 1);
  const stockRatio = stock / stockDenom;

  const margin = product.is_for_retail && product.sell_price !== null ? product.sell_price - product.price : null;
  const marginPct = margin !== null && product.sell_price ? Math.round((margin / product.sell_price) * 100) : null;
  const marginTone = marginPct === null ? 'neutral' : marginPct >= 50 ? 'emerald' : marginPct >= 25 ? 'sky' : marginPct >= 0 ? 'amber' : 'red';

  return (
    <>
      <DeleteProductModal isOpen={showDelete} onClose={() => setShowDelete(false)} selectedProduct={product} />
      <ConfirmDialog
        isOpen={discardConfirm !== null}
        onClose={() => setDiscardConfirm(null)}
        onConfirm={() => {
          discardConfirm?.action();
          setDiscardConfirm(null);
        }}
        title="Scartare le modifiche?"
        description="Le modifiche non salvate andranno perse."
        confirmLabel="Scarta"
        tone="warning"
      />

      <div className="flex flex-col">
        <DetailHero
          onBack={handleBack}
          avatar={<HeroIconTile icon={FlaskConical} tone="primary" />}
          title={product.name}
          chips={
            <>
              {product.isArchived && <DetailChip tone="amber">Archiviato</DetailChip>}
              {category && <DetailChip tone="zinc">{category.name}</DetailChip>}
              {product.is_for_retail && (
                <DetailChip tone="emerald" icon={ShoppingBag}>
                  Vendita
                </DetailChip>
              )}
            </>
          }
          meta={
            <>
              {manufacturer && <span>{manufacturer.name}</span>}
              {manufacturer && product.quantity_ml && <span aria-hidden>·</span>}
              {product.quantity_ml && <span>{product.quantity_ml} mL</span>}
            </>
          }
          actions={
            <DetailHeroActions
              isEditing={isEditing}
              isLocked={product.isArchived}
              saving={saving}
              isDirty={isDirty}
              onEdit={handleEnterEdit}
              onCancel={handleCancel}
              onSave={handleSave}
              menuItems={[
                {
                  label: product.isArchived ? 'Ripristina' : 'Archivia',
                  icon: product.isArchived ? ArchiveRestore : Archive,
                  onClick: handleToggleArchive,
                },
                { label: 'Elimina', icon: Trash2, onClick: () => setShowDelete(true) },
              ]}
            />
          }
        />

        <div className="px-6 lg:px-10 py-8 max-w-5xl w-full mx-auto">
          <AnimatePresence mode="wait" initial={false}>
            {isEditing ? (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <DetailSection label="Modifica prodotto">
                  <ProductForm value={draft} onChange={setDraft} errors={errors} trackInventory={trackInventory} />
                </DetailSection>
              </motion.div>
            ) : (
              <motion.div
                key="view"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex flex-col gap-12"
              >
                <DetailSection index={0} label="Inventario">
                  <div className={`grid grid-cols-1 ${trackInventory ? 'sm:grid-cols-3' : product.is_for_retail ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
                    {trackInventory && (
                      <StatTile
                        label="Giacenza"
                        value={stock}
                        accent={{ tone: stockTone, text: stockAccent }}
                        hint={minThreshold > 0 ? `Soglia minima: ${minThreshold}` : undefined}
                      >
                        <ProgressBar ratio={stockRatio} tone={stockTone} delay={0.1} />
                      </StatTile>
                    )}
                    <StatTile label="Costo" value={formatEur(product.price)} />
                    {product.is_for_retail && (
                      <StatTile
                        label="Vendita"
                        value={formatEur(product.sell_price)}
                        accent={margin !== null && marginPct !== null ? { tone: marginTone, text: `${marginPct}%` } : undefined}
                        hint={margin !== null ? `Margine: ${formatEur(margin)}` : undefined}
                      />
                    )}
                  </div>
                </DetailSection>

                <DetailSection index={1} label="Dettagli">
                  <dl className="divide-y divide-zinc-500/10 border-y border-zinc-500/10">
                    <DefRow label="Categoria" value={category?.name ?? '—'} />
                    <DefRow label="Marca" value={manufacturer?.name ?? '—'} />
                    <DefRow label="Fornitore" value={supplier?.name ?? '—'} />
                    {product.quantity_ml != null && <DefRow label="Quantità" value={`${product.quantity_ml} mL`} />}
                  </dl>
                </DetailSection>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

function DefRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3">
      <dt className="text-sm text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{value}</dd>
    </div>
  );
}
