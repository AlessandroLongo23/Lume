'use client';

import { useState, useMemo } from 'react';
import { ShoppingCart, Download, TableProperties, CalendarDays } from 'lucide-react';
import { useOrdersStore } from '@/lib/stores/orders';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { useViewsStore } from '@/lib/stores/views';
import { useSearchStore } from '@/lib/stores/search';
import { AddOrderModal } from '@/lib/components/admin/orders/AddOrderModal';
import { OrdersTable } from '@/lib/components/admin/orders/OrdersTable';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { Searchbar } from '@/lib/components/shared/ui/Searchbar';

export default function OrdiniPage() {
  const orders = useOrdersStore((s) => s.orders);
  const isLoading = useOrdersStore((s) => s.isLoading);
  const view = useViewsStore((s) => s.orders);
  const setView = useViewsStore((s) => s.setView);
  const query = useSearchStore((s) => s.query);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    if (!query) return orders;
    const q = query.toLowerCase();
    return orders.filter((o) =>
      ['status'].some((k) =>
        String(o[k as keyof typeof o])?.toLowerCase().includes(q)
      )
    );
  }, [orders, query]);

  const title = !query
    ? `Tutti gli ordini (${filtered.length})`
    : filtered.length === 0 ? 'Nessun ordine trovato'
    : filtered.length === 1 ? '1 ordine trovato'
    : `${filtered.length} ordini trovati`;

  return (
    <>
      <AddOrderModal isOpen={showAdd} onClose={() => setShowAdd(false)} />

      <div className="flex flex-col gap-8">
        <div className="flex flex-row items-center justify-between gap-4 w-full">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{title}</h1>
          <div className="flex flex-row items-center gap-4">
            <Searchbar placeholder="Cerca ordine" className="w-80" />
            <ToggleButton
              value={view}
              onChange={(v) => setView('orders', v)}
              options={['table', 'calendar']}
              labels={['Tabella', 'Calendario']}
              icons={[TableProperties, CalendarDays]}
            />
            <button className="flex flex-row items-center whitespace-nowrap justify-center px-4 py-2 gap-2 text-sm font-thin transition-all bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-50 rounded-lg border border-zinc-500/25">
              <Download className="size-5" strokeWidth={1.5} />
              <span className="font-thin">Scarica PDF</span>
            </button>
            <button
              className="flex flex-row items-center whitespace-nowrap justify-center px-4 py-2 gap-2 text-sm font-thin transition-all bg-black hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-lg border border-zinc-500/25"
              onClick={() => setShowAdd(true)}
            >
              <ShoppingCart className="size-5" strokeWidth={1.5} />
              <span className="font-thin">Nuovo Ordine</span>
            </button>
          </div>
        </div>

        {!isLoading && orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Nessun ordine trovato"
            description="Crea il tuo primo ordine per iniziare a gestire le forniture."
            action={{ label: 'Nuovo Ordine', icon: ShoppingCart, onClick: () => setShowAdd(true) }}
          />
        ) : (
          <OrdersTable orders={filtered} />
        )}
      </div>
    </>
  );
}
