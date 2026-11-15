'use client';

import { ShieldCheck, UserCog, Scissors } from 'lucide-react';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { isAdmin, isOwner, isOperator } from '@/lib/auth/roles';

export function RoleBanner() {
  const role = useSubscriptionStore((s) => s.role);
  const salonName = useSubscriptionStore((s) => s.salonName);

  let Icon = UserCog;
  let label = '';
  let description = '';

  if (isAdmin(role)) {
    Icon = ShieldCheck;
    label = 'Super admin';
    description = salonName
      ? `Stai operando come titolare di ${salonName}.`
      : 'Hai accesso completo a tutte le impostazioni della piattaforma.';
  } else if (isOwner(role)) {
    Icon = UserCog;
    label = 'Titolare';
    description = 'Hai pieno controllo su salone, operatori e abbonamento.';
  } else if (isOperator(role)) {
    Icon = Scissors;
    label = 'Operatore';
    description = 'Puoi gestire i tuoi dati personali. Per modifiche al salone, contatta il titolare.';
  } else {
    return null;
  }

  // One quiet line under the page title: who you are here and what you can change.
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon className="size-4 shrink-0 mt-0.5 text-[var(--lume-text-muted)]" aria-hidden />
      <p className="min-w-0 text-[var(--lume-text-secondary)]">
        Sei <span className="font-medium text-[var(--lume-text)]">{label}</span>. {description}
      </p>
    </div>
  );
}
