'use client';

import { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye } from 'lucide-react';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { Button } from '@/lib/components/shared/ui/Button';

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

  return (
    <div className="h-full px-4 md:px-6 flex items-center justify-between gap-3 text-sm bg-primary-hover text-white">
      <div className="flex items-center gap-2 min-w-0">
        <Eye className="w-4 h-4 shrink-0" />
        <span className="truncate">
          Stai visualizzando <span className="font-semibold">{salonName || 'questo salone'}</span> come admin
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        loading={isExiting}
        leadingIcon={ArrowLeft}
        onClick={handleExit}
        className="shrink-0 bg-white/15 hover:bg-white/25 text-white text-xs"
      >
        {isExiting ? 'Uscita…' : 'Torna alla piattaforma'}
      </Button>
    </div>
  );
}
