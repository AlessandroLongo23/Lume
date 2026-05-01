'use client';

import { useEffect, useState } from 'react';
import { Loader2, UserX } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useOperatorsStore } from '@/lib/stores/operators';
import { Operator } from '@/lib/types/Operator';
import { OperatorWorkingHoursPanel } from '@/lib/components/admin/operators/OperatorWorkingHoursPanel';

/**
 * Lets the currently-signed-in operator edit their own working hours.
 * Resolves the operator row via `operators.user_id = auth.uid()`.
 */
export function MyWorkingHoursPanel() {
  const operators = useOperatorsStore((s) => s.operators);
  const isStoreLoading = useOperatorsStore((s) => s.isLoading);
  const fetchOperators = useOperatorsStore((s) => s.fetchOperators);

  const [userId, setUserId] = useState<string | null>(null);
  const [authResolved, setAuthResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUserId(data.user?.id ?? null);
      setAuthResolved(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (operators.length === 0 && !isStoreLoading) fetchOperators();
  }, [operators.length, isStoreLoading, fetchOperators]);

  if (!authResolved || isStoreLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="size-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  const myOperator: Operator | undefined = userId
    ? operators.find((o) => o.user_id === userId)
    : undefined;

  if (!myOperator) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-12 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
        <UserX className="size-10 text-zinc-300 dark:text-zinc-600 mb-3" strokeWidth={1.5} />
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Nessun profilo operatore collegato
        </p>
        <p className="mt-1 text-xs text-zinc-500 max-w-sm">
          Solo gli operatori del salone possono configurare orari di lavoro personali.
          Contatta il titolare se pensi sia un errore.
        </p>
      </div>
    );
  }

  return <OperatorWorkingHoursPanel operator={myOperator} readOnly={myOperator.isArchived} />;
}
