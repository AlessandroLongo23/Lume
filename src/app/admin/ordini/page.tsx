'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingCart, TableProperties, CalendarDays, FileDown, ArrowDownToLine } from 'lucide-react';
import { useOrdersStore } from '@/lib/stores/orders';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
import { ConciergeImportModal } from '@/lib/components/shared/ui/ConciergeImportModal';
import { useViewsStore } from '@/lib/stores/views';
import { useSearchStore } from '@/lib/stores/search';
import { AddOrderModal } from '@/lib/components/admin/orders/AddOrderModal';
import { EditOrderModal } from '@/lib/components/admin/orders/EditOrderModal';
import { DeleteOrderModal } from '@/lib/components/admin/orders/DeleteOrderModal';
import { OrdersTable } from '@/lib/components/admin/orders/OrdersTable';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { Searchbar } from '@/lib/components/shared/ui/Searchbar';
import { DropdownMenu } from '@/lib/components/shared/ui/DropdownMenu';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import type { Order } from '@/lib/types/Order';

export default function OrdiniPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orders = useOrdersStore((s) => s.orders);
  const isLoading = useOrdersStore((s) => s.isLoading);
  const view = useViewsStore((s) => s.orders);
  const setView = useViewsStore((s) => s.setView);
  const query = useSearchStore((s) => s.query);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [commandTarget, setCommandTarget] = useState<Order | null>(null);
  const [editedOrder, setEditedOrder] = useState<Partial<Order>>({});
  const [commandMode, setCommandMode] = useState<'edit' | 'delete' | null>(null);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowAdd(true);
      router.replace('/admin/ordini');
      return;
    }
    const editId = searchParams.get('edit');
    if (editId) {
      const order = useOrdersStore.getState().orders.find((o) => o.id === editId);
      if (order) { setCommandTarget(order); setEditedOrder(order); setCommandMode('edit'); }
      router.replace('/admin/ordini');
      return;
    }
    const deleteId = searchParams.get('delete');
    if (deleteId) {
      const order = useOrdersStore.getState().orders.find((o) => o.id === deleteId);
      if (order) { setCommandTarget(order); setCommandMode('delete'); }
      router.replace('/admin/ordini');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo(() => {
    if (!query) return orders;
    const q = query.toLowerCase();
    return orders.filter((o) =>
      ['status'].some((k) =>
        String(o[k as keyof typeof o])?.toLowerCase().includes(q)
      )
    );
  }, [orders, query]);

  return (
    <>
      <AddOrderModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
      <EditOrderModal
        isOpen={commandMode === 'edit'}
        onClose={() => { setCommandMode(null); setCommandTarget(null); }}
        editedOrder={editedOrder}
        onEditedOrderChange={setEditedOrder}
        selectedOrder={commandTarget}
      />
      <DeleteOrderModal
        isOpen={commandMode === 'delete'}
        onClose={() => { setCommandMode(null); setCommandTarget(null); }}
        selectedOrder={commandTarget}
      />
      <ConciergeImportModal isOpen={showImport} onClose={() => setShowImport(false)} />

      <div className="flex flex-col gap-8">
        <PageHeader
          title="Ordini"
          subtitle="Riordina prima che gli scaffali si svuotino."
          icon={ShoppingCart}
          actions={
            <>
              <Searchbar placeholder="Cerca ordine" className="w-80" />
              <ToggleButton
                value={view}
                onChange={(v) => setView('orders', v)}
                options={['table', 'calendar']}
                labels={['Tabella', 'Calendario']}
                icons={[TableProperties, CalendarDays]}
              />
              <button
                className="flex flex-row items-center whitespace-nowrap justify-center px-4 py-2 gap-2 text-sm font-thin transition-all bg-black hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-lg border border-zinc-500/25"
                onClick={() => setShowAdd(true)}
              >
                <ShoppingCart className="size-5" strokeWidth={1.5} />
                <span className="font-thin">Nuovo Ordine</span>
              </button>
              <DropdownMenu items={[
                { label: 'Importa dati', icon: ArrowDownToLine, onClick: () => setShowImport(true) },
                { label: 'Scarica PDF', icon: FileDown, onClick: () => { /* TODO: export PDF */ } },
              ]} />
            </>
          }
        />

        {isLoading ? (
          <TableSkeleton />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Nessun ordine trovato"
            description="Crea il tuo primo ordine per iniziare a gestire le forniture."
            secondaryAction={{ label: 'Importa dati', icon: ArrowDownToLine, onClick: () => setShowImport(true) }}
            action={{ label: 'Nuovo Ordine', icon: ShoppingCart, onClick: () => setShowAdd(true) }}
          />
        ) : (
          <OrdersTable orders={filtered} />
        )}
      </div>
    </>
  );
}
