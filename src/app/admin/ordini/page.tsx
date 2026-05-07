'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingCart, TableProperties, CalendarDays, FileDown, ArrowDownToLine, Trash2 } from 'lucide-react';
import { useOrdersStore } from '@/lib/stores/orders';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
import { ConciergeImportModal } from '@/lib/components/shared/ui/ConciergeImportModal';
import { DeleteAllModal } from '@/lib/components/shared/ui/modals/DeleteAllModal';
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
import { Button } from '@/lib/components/shared/ui/Button';
import type { Order } from '@/lib/types/Order';

export default function OrdiniPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orders = useOrdersStore((s) => s.orders);
  const isLoading = useOrdersStore((s) => s.isLoading);
  const deleteAllOrders = useOrdersStore((s) => s.deleteAllOrders);
  const view = useViewsStore((s) => s.orders);
  const setView = useViewsStore((s) => s.setView);
  const query = useSearchStore((s) => s.query);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
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
      <DeleteAllModal
        isOpen={showDeleteAll}
        onClose={() => setShowDeleteAll(false)}
        entityLabel="ordini"
        count={orders.length}
        cascadeNotice={
          <>
            Verranno eliminate anche tutte le righe d&apos;ordine. I prodotti già a magazzino
            non verranno toccati.
          </>
        }
        onConfirm={deleteAllOrders}
      />

      <div className="flex-1 min-h-0 flex flex-col gap-8">
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
              <Button
                variant="primary"
                leadingIcon={ShoppingCart}
                onClick={() => setShowAdd(true)}
                className="whitespace-nowrap"
              >
                Nuovo Ordine
              </Button>
              <DropdownMenu items={[
                { label: 'Importa dati', icon: ArrowDownToLine, onClick: () => setShowImport(true) },
                { label: 'Scarica PDF', icon: FileDown, onClick: () => { /* TODO: export PDF */ } },
                ...(orders.length > 0
                  ? [{ label: 'Elimina tutti', icon: Trash2, onClick: () => setShowDeleteAll(true), destructive: true }]
                  : []),
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
