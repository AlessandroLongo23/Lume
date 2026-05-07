'use client';

import { useState } from 'react';
import { Clock3 } from 'lucide-react';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { Button } from '@/lib/components/shared/ui/Button';

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
    <div className="rounded-xl border border-warning-line bg-warning-soft px-4 py-3 flex items-center gap-3">
      <Clock3 className="size-5 text-warning-strong shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-warning-strong">
          <strong className="font-medium">L&apos;abbonamento si chiuderà il {formatDate(cancelAt)}.</strong>
          {' '}Puoi riattivarlo prima senza perdere nulla.
        </p>
        {error && <p className="mt-1 text-xs text-danger-strong">{error}</p>}
      </div>
      <Button variant="secondary" size="sm" onClick={handleReactivate} loading={loading} className="shrink-0">
        Riattiva
      </Button>
    </div>
  );
}
