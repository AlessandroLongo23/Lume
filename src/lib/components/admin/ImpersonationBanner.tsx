'use client';

import { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye } from 'lucide-react';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { Button } from '@/lib/components/shared/ui/Button';
import { Callout } from '@/lib/components/shared/ui/Callout';

function readImpersonatingCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith('lume-impersonating=1'));
}

const subscribeImpersonation = () => () => {};

export function useIsImpersonating(): boolean {
  const isAdmin = useSubscriptionStore((s) => s.isAdmin);
  const isImpersonating = useSyncExternalStore(
    subscribeImpersonation,
    readImpersonatingCookie,
    () => false,
  );
  return isAdmin && isImpersonating;
}

export function ImpersonationBanner() {
  const router = useRouter();
  const salonName = useSubscriptionStore((s) => s.salonName);
  const active = useIsImpersonating();
  const [isExiting, setIsExiting] = useState(false);

  if (!active) return null;

  async function handleExit() {
    setIsExiting(true);
    try {
      const res = await fetch('/api/platform/exit-impersonation', { method: 'POST' });
      const { redirect } = await res.json();
      router.push(redirect ?? '/platform/salons');
    } catch {
      setIsExiting(false);
    }
  }

  // A full-width strip across the top of the shell (AppShell gives it its height).
  return (
    <Callout
      tone="info"
      icon={Eye}
      className="h-full rounded-none items-center py-0 px-4 md:px-6 [&>svg]:mt-0"
      action={
        <Button
          variant="secondary"
          size="sm"
          loading={isExiting}
          leadingIcon={ArrowLeft}
          onClick={handleExit}
        >
          {isExiting ? 'Uscita…' : 'Torna alla piattaforma'}
        </Button>
      }
    >
      <p className="truncate text-[var(--lume-text)]">
        Stai visualizzando <span className="font-medium">{salonName || 'questo salone'}</span> come amministratore
      </p>
    </Callout>
  );
}
