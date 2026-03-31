'use client';

import { useState } from 'react';
import { Hash, CalendarDays, Check } from 'lucide-react';
import { useOrdersStore } from '@/lib/stores/orders';
import { Table } from '@/lib/components/admin/table/Table';
import { EditOrderModal } from './EditOrderModal';
import { DeleteOrderModal } from './DeleteOrderModal';
import type { Order } from '@/lib/types/Order';
import type { DataColumn } from '@/lib/types/dataColumn';

const columns: DataColumn[] = [
  { label: 'ID', key: 'id', sortable: true, icon: Hash, display: (o: Order) => o.id },
  {
    label: 'Data', key: 'datetime', sortable: true, icon: CalendarDays,
    display: (o: Order) => new Date(o.datetime).toLocaleString('it-IT'),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { label: 'Stato', key: 'status', sortable: true, icon: Check, display: (o: Order) => (o as any).status ?? '' },
];

interface OrdersTableProps {
  orders: Order[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const isLoading = useOrdersStore((s) => s.isLoading);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editedOrder, setEditedOrder] = useState<Partial<Order>>({});

  const handleEditClick = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    setSelectedOrder(order);
    setEditedOrder({ ...order });
    setShowEdit(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    setSelectedOrder(order);
    setShowDelete(true);
  };

  return (
    <>
      <Table
        columns={columns}
        data={orders}
        handleEditClick={handleEditClick}
        handleDeleteClick={handleDeleteClick}
        detailPageUrl="ordini"
        isLoading={isLoading}
        labelPlural="ordini"
        labelSingular="ordine"
      />
      <EditOrderModal isOpen={showEdit} onClose={() => setShowEdit(false)} editedOrder={editedOrder} onEditedOrderChange={setEditedOrder} selectedOrder={selectedOrder} />
      <DeleteOrderModal isOpen={showDelete} onClose={() => setShowDelete(false)} selectedOrder={selectedOrder} />
    </>
  );
}
