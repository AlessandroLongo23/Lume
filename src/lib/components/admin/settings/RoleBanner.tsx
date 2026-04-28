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

  return (
    <div className="flex items-start gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 shadow-sm">
      <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex flex-col">
        <p className="text-sm text-zinc-900 dark:text-zinc-100">
          Sei <span className="font-semibold text-primary-hover dark:text-primary/80">{label}</span>.
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
    </div>
  );
}
