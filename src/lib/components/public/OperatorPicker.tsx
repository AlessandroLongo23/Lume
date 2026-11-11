'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Loader2, Users, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Callout } from '@/lib/components/shared/ui/Callout';
import type { BookableOperator } from '@/lib/booking/publicTypes';
import { ListBox, ListRow } from '@/lib/components/shared/ui/list/ListBox';
import { PICKER_ROW } from './ServicePicker';

// `null` represents the "qualunque operatore" choice — server interprets it
// as "first eligible operator with a free slot".
export type OperatorChoice = BookableOperator | null;

export function OperatorPicker({
  salonId,
  serviceId,
  onSelect,
}: {
  salonId: string;
  serviceId: string;
  onSelect: (choice: OperatorChoice) => void;
}) {
  const [operators, setOperators] = useState<BookableOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset spinner + error on every service change; refetch is the whole point of this effect.
    setLoading(true);
    setError(null);
    supabase
      .rpc('get_bookable_operators', { p_salon_id: salonId, p_service_id: serviceId })
      .then(({ data, error: rpcError }) => {
        if (cancelled) return;
        if (rpcError) {
          setError('Impossibile caricare gli operatori.');
        } else {
          setOperators((data ?? []) as BookableOperator[]);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [salonId, serviceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-5 animate-spin text-[var(--lume-text-muted)]" />
      </div>
    );
  }

  if (error) {
    return <Callout tone="danger" title={error} />;
  }

  if (operators.length === 0) {
    return (
      <p className="text-sm text-[var(--lume-text-secondary)]">
        Nessun operatore disponibile per questo servizio.
      </p>
    );
  }

  return (
    <ListBox className="-mx-1 p-0 gap-1">
      <ListRow asChild>
        <button
          // ds-ignore: booking picker row, styled by ListRow asChild; ListRow's own button wraps children in a truncating span that breaks the avatar + text layout
          type="button"
          onClick={() => onSelect(null)}
          className={PICKER_ROW}
        >
          <div className="size-11 shrink-0 rounded-full bg-active flex items-center justify-center text-[var(--lume-text-secondary)]">
            <Users className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-[var(--lume-text)]">Qualunque operatore</p>
            <p className="mt-0.5 text-xs text-[var(--lume-text-secondary)]">
              Ti assegniamo l&apos;operatore con la prima disponibilità.
            </p>
          </div>
          <ChevronRight className="size-4 text-[var(--lume-text-muted)] group-hover/row:text-[var(--lume-text)] shrink-0" />
        </button>
      </ListRow>
      {operators.map((op) => (
        <ListRow key={op.id} asChild>
          <button
            // ds-ignore: booking picker row, styled by ListRow asChild; ListRow's own button wraps children in a truncating span that breaks the avatar + text layout
            type="button"
            onClick={() => onSelect(op)}
            className={PICKER_ROW}
          >
            {op.avatar_url ? (
              <div className="size-11 shrink-0 rounded-full overflow-hidden bg-[var(--lume-surface)]">
                <Image
                  src={op.avatar_url}
                  alt={`${op.first_name} ${op.last_name}`}
                  width={48}
                  height={48}
                  className="size-full object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="size-11 shrink-0 rounded-full bg-active flex items-center justify-center text-[var(--lume-text-secondary)] font-medium">
                {op.first_name.charAt(0).toUpperCase()}
                {op.last_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[var(--lume-text)] truncate">
                {op.first_name} {op.last_name}
              </p>
            </div>
            <ChevronRight className="size-4 text-[var(--lume-text-muted)] group-hover/row:text-[var(--lume-text)] shrink-0" />
          </button>
        </ListRow>
      ))}
    </ListBox>
  );
}
