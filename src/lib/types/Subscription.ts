export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete';

export type SubscriptionPlan = 'monthly' | 'yearly';

export interface SubscriptionInfo {
  isTrialing:             boolean;
  isActive:               boolean;
  isExpired:              boolean;
  trialDaysLeft:          number;
  showTrialWarning:       boolean;
  subscriptionStatus:     SubscriptionStatus;
  subscriptionPlan:       SubscriptionPlan | null;
  subscriptionEndsAt:     string | null;
  referralCode:           string;
  pendingCredits:         number;
  earnedCredits:          number;
  referralExtensionUntil: string | null;
  isOnReferralCredit:     boolean;
  availablePlanChange:    'upgrade-yearly' | null;
  role:                   string;
}

export interface ReferralCredit {
  id:                  string;
  referrer_salon_id:   string;
  referred_salon_id:   string;
  status:              'pending' | 'earned' | 'applied';
  earned_at:           string | null;
  applied_at:          string | null;
  previous_period_end: string | null;
  new_period_end:      string | null;
  created_at:          string;
}

export interface PaymentMethod {
  brand: string;
  last4: string;
}

export type InvoiceStatus = 'paid' | 'open' | 'void' | 'uncollectible' | 'draft';

export interface Invoice {
  id:               string;
  number:           string | null;
  createdAt:        string;
  amount:           number;
  currency:         string;
  status:           InvoiceStatus;
  refundedAmount:   number;
  hostedInvoiceUrl: string | null;
  invoicePdfUrl:    string | null;
}

export type CancellationReason =
  | 'too_expensive'
  | 'missing_features'
  | 'closing_salon'
  | 'switched_tool'
  | 'other';
