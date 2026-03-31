'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Calendar, Check } from 'lucide-react';
import { useOrdersStore } from '@/lib/stores/orders';
import { EditOrderModal } from '@/lib/components/admin/orders/EditOrderModal';
import { DeleteOrderModal } from '@/lib/components/admin/orders/DeleteOrderModal';
import type { Order } from '@/lib/types/Order';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orders = useOrdersStore((s) => s.orders);
  const isLoading = useOrdersStore((s) => s.isLoading);

  const [order, setOrder] = useState<Order | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editedOrder, setEditedOrder] = useState<Partial<Order>>({});

  const orderId = params.id as string;

  useEffect(() => {
    if (!isLoading) {
      const found = orders.find((o) => o.id === orderId);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (found) setOrder(found);
    }
  }, [orders, orderId, isLoading]);

  if (isLoading) {
    return <div className="flex justify-center p-12"><div className="w-12 h-12 border-4 border-zinc-500/25 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <h2 className="text-xl font-bold">Ordine non trovato</h2>
        <button className="mt-4 px-4 py-2 bg-zinc-200 rounded-md" onClick={() => router.push('/admin/ordini')}>Torna indietro</button>
      </div>
    );
  }

  return (
    <>
      <EditOrderModal isOpen={showEdit} onClose={() => setShowEdit(false)} selectedOrder={order} editedOrder={editedOrder} onEditedOrderChange={setEditedOrder} />
      <DeleteOrderModal isOpen={showDelete} onClose={() => setShowDelete(false)} selectedOrder={order} />

      <div className="flex flex-col gap-4 max-w-2xl">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/ordini')} className="p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors">
            <ArrowLeft className="size-5 text-zinc-600 dark:text-zinc-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Ordine #{order.id.slice(0, 8)}</h1>
            <p className="text-sm text-zinc-500">Dettagli ordine</p>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={() => { setEditedOrder(order); setShowEdit(true); }} className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 rounded-md">
              <Edit className="size-5 text-zinc-600 dark:text-zinc-300" />
            </button>
            <button onClick={() => setShowDelete(true)} className="p-2 bg-zinc-100 hover:bg-red-100 dark:bg-zinc-800 rounded-md">
              <Trash2 className="size-5 text-zinc-600 dark:text-zinc-300" />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-500/25 p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="size-4 text-zinc-500" />
            <span className="text-sm text-zinc-500">Data</span>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{new Date(order.datetime).toLocaleString('it-IT')}</span>
          </div>
          <div className="flex items-center gap-3">
            <Check className="size-4 text-zinc-500" />
            <span className="text-sm text-zinc-500">Stato</span>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{order.status}</span>
          </div>
        </div>
      </div>
    </>
  );
}
