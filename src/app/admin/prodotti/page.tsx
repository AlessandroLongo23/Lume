'use client';

import { useState } from 'react';
import { FlaskConical, Tags, TableProperties, ArrowDownToLine, FileDown } from 'lucide-react';
import { useProductsStore } from '@/lib/stores/products';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { ConciergeImportModal } from '@/lib/components/shared/ui/ConciergeImportModal';
import { useViewsStore } from '@/lib/stores/views';
import { AddProductModal } from '@/lib/components/admin/products/AddProductModal';
import { ProductsTable } from '@/lib/components/admin/products/ProductsTable';
import { ProductsCategories } from '@/lib/components/admin/products/ProductsCategories';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { DropdownMenu } from '@/lib/components/shared/ui/DropdownMenu';

export default function ProdottiPage() {
  const products = useProductsStore((s) => s.products);
  const isLoading = useProductsStore((s) => s.isLoading);
  const view = useViewsStore((s) => s.products);
  const setView = useViewsStore((s) => s.setView);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);

  return (
    <>
      <AddProductModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
      <ConciergeImportModal isOpen={showImport} onClose={() => setShowImport(false)} />

      <div className="flex flex-col gap-8">
        <div className="flex flex-row items-center justify-between gap-4 w-full">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Prodotti</h1>
          <div className="flex flex-row items-center gap-4">
            <ToggleButton
              value={view}
              onChange={(v) => setView('products', v)}
              options={['categories', 'table']}
              labels={['Categorie', 'Tabella']}
              icons={[Tags, TableProperties]}
            />
            <button
              className="flex flex-row items-center whitespace-nowrap justify-center px-4 py-2 gap-2 text-sm font-thin transition-all bg-black hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-lg border border-zinc-500/25"
              onClick={() => setShowAdd(true)}
            >
              <FlaskConical className="size-5" strokeWidth={1.5} />
              <span className="font-thin">Nuovo Prodotto</span>
            </button>
            <DropdownMenu items={[
              { label: 'Scarica PDF', icon: FileDown, onClick: () => { /* TODO: export PDF */ } },
            ]} />
          </div>
        </div>

        {!isLoading && products.length === 0 ? (
          <EmptyState
            icon={FlaskConical}
            title="Nessun prodotto trovato"
            description="Aggiungi il tuo primo prodotto per iniziare a gestire il magazzino."
            secondaryAction={{ label: 'Importa dati', icon: ArrowDownToLine, onClick: () => setShowImport(true) }}
            action={{ label: 'Nuovo Prodotto', icon: FlaskConical, onClick: () => setShowAdd(true) }}
          />
        ) : view === 'categories' ? (
          <ProductsCategories />
        ) : (
          <ProductsTable products={products} />
        )}
      </div>
    </>
  );
}
