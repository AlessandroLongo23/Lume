export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete';

export type SubscriptionPlan = 'monthly' | 'yearly';

export interface SubscriptionInfo {
  isTrialing:        boolean;
  isActive:          boolean;
  isExpired:         boolean;
  trialDaysLeft:     number;
  showTrialWarning:  boolean;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan:  SubscriptionPlan | null;
  subscriptionEndsAt: string | null;
  referralCode:      string;
  pendingCredits:    number;
  earnedCredits:     number;
  role:              string;
}

export interface ReferralCredit {
  id:                string;
  referrer_salon_id: string;
  referred_salon_id: string;
  status:            'pending' | 'earned' | 'applied';
  earned_at:         string | null;
  applied_at:        string | null;
  created_at:        string;
}
