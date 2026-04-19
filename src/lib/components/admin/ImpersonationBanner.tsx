'use client';

import { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye } from 'lucide-react';
import { useSubscriptionStore } from '@/lib/stores/subscription';

function readImpersonatingCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith('lume-impersonating=1'));
}

const subscribeImpersonation = () => () => {};

export function ImpersonationBanner() {
  const router = useRouter();
  const isSuperAdmin = useSubscriptionStore((s) => s.isSuperAdmin);
  const salonName = useSubscriptionStore((s) => s.salonName);
  const isImpersonating = useSyncExternalStore(
    subscribeImpersonation,
    readImpersonatingCookie,
    () => false,
  );
  const [isExiting, setIsExiting] = useState(false);

  if (!isSuperAdmin || !isImpersonating) return null;

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
    <div className="sticky top-16 z-30 -mt-20 md:-mt-24 -mx-4 md:-mx-6 mb-4 px-4 md:px-6 py-2 bg-primary-hover text-white">
      <div className="flex flex-row items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Eye className="w-4 h-4 shrink-0" />
          <span className="truncate">
            Stai visualizzando <span className="font-semibold">{salonName || 'questo salone'}</span> come super-admin
          </span>
        </div>
        <button
          type="button"
          onClick={handleExit}
          disabled={isExiting}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-colors disabled:opacity-60"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {isExiting ? 'Uscita…' : 'Torna alla piattaforma'}
        </button>
      </div>
    </div>
  );
}
