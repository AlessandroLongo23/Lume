import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { Order } from '@/lib/types/Order';

interface OrdersState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  addOrder: (order: Partial<Order>) => Promise<Order>;
  updateOrder: (id: string, updated: Partial<Order>) => Promise<Order>;
  deleteOrder: (id: string) => Promise<void>;
}

export const useOrdersStore = create<OrdersState>((set) => ({
  orders: [],
  isLoading: true,
  error: null,

  fetchOrders: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('orders').select('*');
    if (error) { set({ isLoading: false, error: error.message }); return; }
    set({ orders: data.map((o) => new Order(o)), isLoading: false, error: null });
  },

  addOrder: async (order) => {
    const { data, error } = await supabase.from('orders').insert([order]).select().single();
    if (error) throw new Error('Impossibile aggiungere l\'ordine.');
    return new Order(data);
  },

  updateOrder: async (id, updated) => {
    const { data, error } = await supabase.from('orders').update(updated).eq('id', id).select().single();
    if (error) throw new Error('Impossibile aggiornare l\'ordine.');
    return new Order(data);
  },

  deleteOrder: async (id) => {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw new Error('Impossibile eliminare l\'ordine.');
  },
}));
