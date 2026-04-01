import { create } from 'zustand';
import type { SubscriptionPlan, SubscriptionStatus } from '@/lib/types/Subscription';

interface SubscriptionState {
  isLoading:          boolean;
  isTrialing:         boolean;
  isActive:           boolean;
  isExpired:          boolean;
  trialDaysLeft:      number;
  showTrialWarning:   boolean;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan:   SubscriptionPlan | null;
  subscriptionEndsAt: string | null;
  referralCode:       string;
  pendingCredits:     number;
  earnedCredits:      number;
  role:               string;
  firstName:          string;
  lastName:           string;
  email:              string;
  fetchSubscription:  () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  isLoading:          true,
  isTrialing:         false,
  isActive:           false,
  isExpired:          false,
  trialDaysLeft:      0,
  showTrialWarning:   false,
  subscriptionStatus: 'trialing',
  subscriptionPlan:   null,
  subscriptionEndsAt: null,
  referralCode:       '',
  pendingCredits:     0,
  earnedCredits:      0,
  role:               '',
  firstName:          '',
  lastName:           '',
  email:              '',

  fetchSubscription: async () => {
    try {
      const res = await fetch('/api/subscription');
      if (!res.ok) {
        set({ isLoading: false, isExpired: true });
        return;
      }
      const data = await res.json();
      set({
        isLoading:          false,
        isTrialing:         data.isTrialing,
        isActive:           data.isActive,
        isExpired:          data.isExpired,
        trialDaysLeft:      data.trialDaysLeft,
        showTrialWarning:   data.showTrialWarning,
        subscriptionStatus: data.subscriptionStatus,
        subscriptionPlan:   data.subscriptionPlan,
        subscriptionEndsAt: data.subscriptionEndsAt,
        referralCode:       data.referralCode,
        pendingCredits:     data.pendingCredits,
        earnedCredits:      data.earnedCredits,
        role:               data.role,
        firstName:          data.firstName ?? '',
        lastName:           data.lastName ?? '',
        email:              data.email ?? '',
      });
    } catch {
      set({ isLoading: false, isExpired: true });
    }
  },
}));
