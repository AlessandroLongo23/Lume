'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useSubscriptionStore } from '@/lib/stores/subscription';

export function SubscriptionCTA() {
  const isTrialing = useSubscriptionStore((s) => s.isTrialing);
  const pathname = usePathname();

  // Don't duplicate the CTA on the page where the actual plans live —
  // it's redundant and adds a third indigo element to the same viewport.
  if (!isTrialing || pathname === '/admin/subscribe') return null;

  return (
    <Link
      href="/admin/subscribe"
      className="inline-flex items-center gap-2 h-9 px-3 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-colors"
    >
      <Sparkles className="w-4 h-4" />
      <span className="hidden sm:inline">Attiva abbonamento</span>
    </Link>
  );
}
