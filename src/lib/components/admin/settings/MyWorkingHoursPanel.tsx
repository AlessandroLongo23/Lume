'use client';

import { useEffect, useState } from 'react';
import { Loader2, UserX } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useOperatorsStore } from '@/lib/stores/operators';
import { Operator } from '@/lib/types/Operator';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
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
        <Loader2 className="size-5 animate-spin text-[var(--lume-text-muted)]" />
      </div>
    );
  }

  const myOperator: Operator | undefined = userId
    ? operators.find((o) => o.user_id === userId)
    : undefined;

  if (!myOperator) {
    return (
      <EmptyState
        icon={UserX}
        title="Nessun profilo operatore collegato"
        description="Solo gli operatori del salone possono configurare orari di lavoro personali. Contatta il titolare se pensi sia un errore."
      />
    );
  }

  return <OperatorWorkingHoursPanel operator={myOperator} readOnly={myOperator.isArchived} />;
}
