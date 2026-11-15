import type { StatusTone } from '@/lib/components/shared/ui/StatusDot';

/** Subscription status as <StatusDot tone> + word, shared by the platform screens. */
export const SUBSCRIPTION_STATUS: Record<string, { tone: StatusTone; label: string }> = {
  active:     { tone: 'success', label: 'Attivo' },
  trialing:   { tone: 'info',    label: 'In prova' },
  past_due:   { tone: 'warning', label: 'Scaduto' },
  unpaid:     { tone: 'danger',  label: 'Non pagato' },
  canceled:   { tone: 'neutral', label: 'Annullato' },
  incomplete: { tone: 'neutral', label: 'Incompleto' },
};

export function subscriptionStatus(status: string) {
  return SUBSCRIPTION_STATUS[status] ?? { tone: 'neutral' as const, label: status };
}
