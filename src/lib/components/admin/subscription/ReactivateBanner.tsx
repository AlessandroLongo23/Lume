'use client';

import { useState } from 'react';
import { Clock3 } from 'lucide-react';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { Button } from '@/lib/components/shared/ui/Button';
import { Callout } from '@/lib/components/shared/ui/Callout';

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

export function ReactivateBanner() {
  const cancelAt   = useSubscriptionStore((s) => s.cancelAt);
  const reactivate = useSubscriptionStore((s) => s.reactivate);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!cancelAt) return null;

  const handleReactivate = async () => {
    setLoading(true);
    setError(null);
    const result = await reactivate();
    if (!result.ok) {
      setError(result.error ?? 'Errore durante la riattivazione.');
      setLoading(false);
    }
  };

  return (
    <Callout
      tone="warning"
      icon={Clock3}
      title={<>L&apos;abbonamento si chiuderà il {formatDate(cancelAt)}.</>}
      action={
        <Button variant="secondary" size="sm" onClick={handleReactivate} loading={loading}>
          Riattiva
        </Button>
      }
    >
      Puoi riattivarlo prima senza perdere nulla.
      {error && <p className="mt-1 text-xs text-danger-strong">{error}</p>}
    </Callout>
  );
}
