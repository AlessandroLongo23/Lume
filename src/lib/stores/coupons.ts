import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { Coupon, type CouponRedemption } from '@/lib/types/Coupon';

interface CouponsState {
  coupons: Coupon[];
  redemptions: CouponRedemption[];
  isLoading: boolean;
  error: string | null;
  fetchCoupons: () => Promise<void>;
  fetchRedemptions: () => Promise<void>;
  addCoupon: (coupon: Partial<Coupon>) => Promise<Coupon>;
  updateCoupon: (id: string, updated: Partial<Coupon>) => Promise<Coupon>;
  deleteCoupon: (id: string) => Promise<void>;
  /**
   * Apply a coupon against a fiche. The server inserts a redemption row,
   * and (for gift cards) decrements `remaining_value` atomically.
   */
  applyCoupon: (couponId: string, ficheId: string, amountApplied: number) => Promise<CouponRedemption>;
}

export const useCouponsStore = create<CouponsState>((set) => ({
  coupons: [],
  redemptions: [],
  isLoading: true,
  error: null,

  fetchCoupons: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('coupons').select('*');
    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }
    set({ coupons: data.map((c) => new Coupon(c)), isLoading: false, error: null });
  },

  fetchRedemptions: async () => {
    const { data, error } = await supabase.from('coupon_redemptions').select('*');
    if (error) return;
    set({ redemptions: data as CouponRedemption[] });
  },

  addCoupon: async (coupon) => {
    const response = await fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coupon }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Impossibile creare il coupon.');
    const created = new Coupon(result.coupon);
    set((s) => ({ coupons: [...s.coupons, created] }));
    return created;
  },

  updateCoupon: async (id, updated) => {
    const response = await fetch('/api/coupons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, coupon: updated }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Impossibile aggiornare il coupon.');
    const next = new Coupon(result.coupon);
    set((s) => ({ coupons: s.coupons.map((c) => (c.id === id ? next : c)) }));
    return next;
  },

  deleteCoupon: async (id) => {
    const response = await fetch('/api/coupons', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Impossibile eliminare il coupon.');
    set((s) => ({ coupons: s.coupons.filter((c) => c.id !== id) }));
  },

  applyCoupon: async (couponId, ficheId, amountApplied) => {
    const response = await fetch('/api/coupons/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coupon_id: couponId, fiche_id: ficheId, amount_applied: amountApplied }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Impossibile applicare il coupon.');
    const redemption = result.redemption as CouponRedemption;
    set((s) => ({
      redemptions: [...s.redemptions, redemption],
      coupons: s.coupons.map((c) => (c.id === couponId ? new Coupon(result.coupon) : c)),
    }));
    return redemption;
  },
}));
