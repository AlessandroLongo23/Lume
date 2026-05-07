import { create } from 'zustand';
import type {
  CancellationReason,
  Invoice,
  PaymentMethod,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@/lib/types/Subscription';

export type ReferralStatus = 'pending' | 'earned' | 'applied';

export interface Referral {
  id:           string;
  salonName:    string;
  status:       ReferralStatus;
  createdAt:    string;
  earnedAt:     string | null;
  appliedAt:    string | null;
  newPeriodEnd: string | null;
}

interface SubscriptionState {
  isLoading:          boolean;
  /** True once a successful /api/subscription call has populated the store.
   *  Callers that gate destructive UX on `isExpired` (e.g. the redirect to
   *  /admin/subscribe) should also check this — otherwise a transient API
   *  failure is misread as "subscription expired" and the user is locked out. */
  isLoaded:           boolean;
  isTrialing:         boolean;
  isActive:           boolean;
  isExpired:          boolean;
  trialDaysLeft:      number;
  trialEndsAt:        string | null;
  showTrialWarning:   boolean;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan:   SubscriptionPlan | null;
  subscriptionEndsAt: string | null;
  cancelAt:           string | null;
  paymentMethod:      PaymentMethod | null;
  nextChargeAmount:   number | null;
  referralCode:           string;
  pendingCredits:         number;
  earnedCredits:          number;
  referralExtensionUntil: string | null;
  isOnReferralCredit:     boolean;
  availablePlanChange:    'upgrade-yearly' | null;
  referrals:              Referral[];
  salonName:          string;
  logoUrl:            string | null;
  role:               string;
  firstName:          string;
  lastName:           string;
  email:              string;
  isAdmin:            boolean;

  invoices:           Invoice[];
  invoicesLoading:    boolean;
  invoicesLoaded:     boolean;

  fetchSubscription:  () => Promise<void>;
  fetchInvoices:      () => Promise<void>;
  cancel:             (reason: CancellationReason | null, comment: string | null) => Promise<{ ok: boolean; error?: string }>;
  reactivate:         () => Promise<{ ok: boolean; error?: string }>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  isLoading:          true,
  isLoaded:           false,
  isTrialing:         false,
  isActive:           false,
  isExpired:          false,
  trialDaysLeft:      0,
  trialEndsAt:        null,
  showTrialWarning:   false,
  subscriptionStatus: 'trialing',
  subscriptionPlan:   null,
  subscriptionEndsAt: null,
  cancelAt:           null,
  paymentMethod:      null,
  nextChargeAmount:   null,
  referralCode:           '',
  pendingCredits:         0,
  earnedCredits:          0,
  referralExtensionUntil: null,
  isOnReferralCredit:     false,
  availablePlanChange:    null,
  referrals:              [],
  salonName:          '',
  logoUrl:            null,
  role:               '',
  firstName:          '',
  lastName:           '',
  email:              '',
  isAdmin:            false,

  invoices:           [],
  invoicesLoading:    false,
  invoicesLoaded:     false,

  fetchSubscription: async () => {
    try {
      const res = await fetch('/api/subscription');
      if (!res.ok) {
        // Don't assume expired on failure — a transient error right after
        // signup/onboarding would otherwise lock the owner out behind the
        // /admin/subscribe redirect. Leave subscription flags untouched and
        // let the next fetch (or page refresh) populate real values.
        set({ isLoading: false });
        return;
      }
      const data = await res.json();
      set({
        isLoading:          false,
        isLoaded:           true,
        isTrialing:         data.isTrialing,
        isActive:           data.isActive,
        isExpired:          data.isExpired,
        trialDaysLeft:      data.trialDaysLeft,
        trialEndsAt:        data.trialEndsAt ?? null,
        showTrialWarning:   data.showTrialWarning,
        subscriptionStatus: data.subscriptionStatus,
        subscriptionPlan:   data.subscriptionPlan,
        subscriptionEndsAt: data.subscriptionEndsAt,
        cancelAt:           data.cancelAt ?? null,
        paymentMethod:      data.paymentMethod ?? null,
        nextChargeAmount:   data.nextChargeAmount ?? null,
        referralCode:           data.referralCode,
        pendingCredits:         data.pendingCredits,
        earnedCredits:          data.earnedCredits,
        referralExtensionUntil: data.referralExtensionUntil ?? null,
        isOnReferralCredit:     data.isOnReferralCredit ?? false,
        availablePlanChange:    data.availablePlanChange ?? null,
        referrals:              data.referrals ?? [],
        salonName:          data.salonName ?? '',
        logoUrl:            data.logoUrl ?? null,
        role:               data.role,
        firstName:          data.firstName ?? '',
        lastName:           data.lastName ?? '',
        email:              data.email ?? '',
        isAdmin:            data.isAdmin ?? false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchInvoices: async () => {
    if (get().invoicesLoading) return;
    set({ invoicesLoading: true });
    try {
      const res = await fetch('/api/stripe/invoices');
      if (!res.ok) {
        set({ invoicesLoading: false });
        return;
      }
      const data = await res.json();
      set({
        invoices:        data.invoices ?? [],
        invoicesLoading: false,
        invoicesLoaded:  true,
      });
    } catch {
      set({ invoicesLoading: false });
    }
  },

  cancel: async (reason, comment) => {
    const res = await fetch('/api/stripe/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, comment }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: err?.error ?? 'Errore durante l\'annullamento.' };
    }
    await get().fetchSubscription();
    return { ok: true };
  },

  reactivate: async () => {
    const res = await fetch('/api/stripe/reactivate', { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: err?.error ?? 'Errore durante la riattivazione.' };
    }
    await get().fetchSubscription();
    return { ok: true };
  },
}));
