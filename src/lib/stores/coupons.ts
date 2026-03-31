import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';

export interface Coupon {
  id: string;
  salon_id: string;
  code: string;
  discount: number;
  expires_at: string;
  is_active: boolean;
}

interface CouponsState {
  coupons: Coupon[];
  isLoading: boolean;
  error: string | null;
  fetchCoupons: () => Promise<void>;
  addCoupon: (coupon: Partial<Coupon>) => Promise<Coupon>;
  updateCoupon: (id: string, updated: Partial<Coupon>) => Promise<Coupon>;
  deleteCoupon: (id: string) => Promise<void>;
}

export const useCouponsStore = create<CouponsState>((set) => ({
  coupons: [],
  isLoading: true,
  error: null,

  fetchCoupons: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('coupons').select('*');
    if (error) { set({ isLoading: false, error: error.message }); return; }
    set({ coupons: data as Coupon[], isLoading: false, error: null });
  },

  addCoupon: async (coupon) => {
    const { data, error } = await supabase.from('coupons').insert([coupon]).select().single();
    if (error) throw new Error('Impossibile aggiungere il coupon.');
    return data as Coupon;
  },

  updateCoupon: async (id, updated) => {
    const { data, error } = await supabase.from('coupons').update(updated).eq('id', id).select().single();
    if (error) throw new Error('Impossibile aggiornare il coupon.');
    return data as Coupon;
  },

  deleteCoupon: async (id) => {
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) throw new Error('Impossibile eliminare il coupon.');
  },
}));
