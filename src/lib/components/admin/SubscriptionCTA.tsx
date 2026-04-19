'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useSubscriptionStore } from '@/lib/stores/subscription';

export function SubscriptionCTA() {
  const isTrialing = useSubscriptionStore((s) => s.isTrialing);

  if (!isTrialing) return null;

  return (
    <Link
      href="/admin/subscribe"
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-colors"
    >
      <Sparkles className="w-4 h-4" />
      <span className="hidden sm:inline">Attiva abbonamento</span>
    </Link>
  );
}
