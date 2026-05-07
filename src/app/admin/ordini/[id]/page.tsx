'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Trash2, ShoppingCart, FileX } from 'lucide-react';
import { useOrdersStore } from '@/lib/stores/orders';
import { useSuppliersStore } from '@/lib/stores/suppliers';
import {
  DetailHero,
  DetailSection,
  DetailHeroActions,
  DetailChip,
  HeroIconTile,
} from '@/lib/components/shared/ui/detail';
import { EditOrderModal } from '@/lib/components/admin/orders/EditOrderModal';
import { DeleteOrderModal } from '@/lib/components/admin/orders/DeleteOrderModal';
import { Button } from '@/lib/components/shared/ui/Button';
import type { Order } from '@/lib/types/Order';

const STATUS_LABEL: Record<string, string> = {
  pending: 'In attesa',
  confirmed: 'Confermato',
  delivered: 'Consegnato',
  cancelled: 'Annullato',
};

const STATUS_TONE: Record<string, 'amber' | 'sky' | 'emerald' | 'zinc' | 'red'> = {
  pending: 'amber',
  confirmed: 'sky',
  delivered: 'emerald',
  cancelled: 'red',
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orders = useOrdersStore((s) => s.orders);
  const isLoading = useOrdersStore((s) => s.isLoading);
  const suppliers = useSuppliersStore((s) => s.suppliers);

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editedOrder, setEditedOrder] = useState<Partial<Order>>({});

  const orderId = params.id as string;

  useEffect(() => {
    if (!isLoading) {
      const found = orders.find((o) => o.id === orderId);
      if (found) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOrder(found);
      } else {
        setError('Ordine non trovato');
      }
    }
  }, [orders, orderId, isLoading]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="w-16 h-16 border-4 border-zinc-500/25 border-t-primary rounded-full animate-spin" />
        <p className="mt-4 text-zinc-500 dark:text-zinc-400">Caricamento...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <FileX className="size-16 text-zinc-300 dark:text-zinc-600 mb-4" strokeWidth={1.5} />
        <h2 className="text-xl font-semibold text-zinc-700 dark:text-zinc-200 mb-2">Ordine non trovato</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{error ?? "L'ordine non esiste o è stato rimosso."}</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push('/admin/ordini')}
          className="mt-6"
        >
          Torna agli ordini
        </Button>
      </div>
    );
  }

  const supplier = suppliers.find((s) => s.id === order.supplier_id);
  const statusKey = order.status?.toLowerCase() ?? 'pending';
  const statusLabel = STATUS_LABEL[statusKey] ?? order.status;
  const statusTone = STATUS_TONE[statusKey] ?? 'zinc';
  const orderDate = order.datetime ? new Date(order.datetime) : null;

  return (
    <>
      <EditOrderModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        selectedOrder={order}
        editedOrder={editedOrder}
        onEditedOrderChange={setEditedOrder}
      />
      <DeleteOrderModal isOpen={showDelete} onClose={() => setShowDelete(false)} selectedOrder={order} />

      <div className="flex flex-col">
        <DetailHero
          onBack={() => router.push('/admin/ordini')}
          avatar={<HeroIconTile icon={ShoppingCart} tone="primary" />}
          title={`Ordine #${order.id.slice(0, 8)}`}
          chips={<DetailChip tone={statusTone}>{statusLabel}</DetailChip>}
          meta={
            <>
              {supplier && <span>{supplier.name}</span>}
              {supplier && orderDate && <span aria-hidden>·</span>}
              {orderDate && <span>{format(orderDate, 'd MMM yyyy', { locale: it })}</span>}
            </>
          }
          actions={
            <DetailHeroActions
              isEditing={false}
              onEdit={() => { setEditedOrder(order); setShowEdit(true); }}
              onCancel={() => {}}
              onSave={() => {}}
              menuItems={[
                { label: 'Elimina', icon: Trash2, onClick: () => setShowDelete(true) },
              ]}
            />
          }
        />

        <div className="px-6 lg:px-10 py-8 max-w-5xl w-full mx-auto flex flex-col gap-12">
          <DetailSection index={0} label="Dettagli">
            <dl className="divide-y divide-zinc-500/10 border-y border-zinc-500/10">
              <div className="flex items-center justify-between py-3">
                <dt className="text-sm text-zinc-500 dark:text-zinc-400">Fornitore</dt>
                <dd className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {supplier?.name ?? '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-sm text-zinc-500 dark:text-zinc-400">Data e ora</dt>
                <dd className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {orderDate ? format(orderDate, "d MMM yyyy 'alle' HH:mm", { locale: it }) : '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-sm text-zinc-500 dark:text-zinc-400">Stato</dt>
                <dd>
                  <DetailChip tone={statusTone}>{statusLabel}</DetailChip>
                </dd>
              </div>
            </dl>
          </DetailSection>
        </div>
      </div>
    </>
  );
}
