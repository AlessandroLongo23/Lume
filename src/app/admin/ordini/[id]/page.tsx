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
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import type { Order } from '@/lib/types/Order';
import type { StatusTone } from '@/lib/components/shared/ui/StatusDot';

const STATUS_LABEL: Record<string, string> = {
  pending: 'In attesa',
  confirmed: 'Confermato',
  delivered: 'Consegnato',
  cancelled: 'Annullato',
};

const STATUS_TONE: Record<string, StatusTone> = {
  pending: 'warning',
  confirmed: 'info',
  delivered: 'success',
  cancelled: 'danger',
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
        <div className="size-8 border-2 border-active border-t-[var(--lume-text-secondary)] rounded-full animate-spin motion-reduce:animate-none" />
        <p className="mt-4 text-[var(--lume-text-secondary)]">Caricamento...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <EmptyState
          icon={FileX}
          title="Ordine non trovato"
          description="L'ordine non esiste o è stato rimosso."
          secondaryAction={{ label: 'Torna agli ordini', onClick: () => router.push('/admin/ordini') }}
        />
      </div>
    );
  }

  const supplier = suppliers.find((s) => s.id === order.supplier_id);
  const statusKey = order.status?.toLowerCase() ?? 'pending';
  const statusLabel = STATUS_LABEL[statusKey] ?? order.status;
  const statusTone = STATUS_TONE[statusKey] ?? 'neutral';
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
          avatar={<HeroIconTile icon={ShoppingCart} />}
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
                { label: 'Elimina', icon: Trash2, onClick: () => setShowDelete(true), destructive: true },
              ]}
            />
          }
        />

        <div className="px-6 lg:px-10 py-8 max-w-5xl w-full mx-auto flex flex-col gap-12">
          <DetailSection index={0} label="Dettagli">
            <dl className="divide-y divide-line shadow-[inset_0_1px_0_var(--lume-line),inset_0_-1px_0_var(--lume-line)]">
              <div className="flex items-center justify-between py-3">
                <dt className="text-sm text-[var(--lume-text-secondary)]">Fornitore</dt>
                <dd className="text-sm font-medium text-[var(--lume-text)]">
                  {supplier?.name ?? '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-sm text-[var(--lume-text-secondary)]">Data e ora</dt>
                <dd className="text-sm font-medium text-[var(--lume-text)]">
                  {orderDate ? format(orderDate, "d MMM yyyy 'alle' HH:mm", { locale: it }) : '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-sm text-[var(--lume-text-secondary)]">Stato</dt>
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
