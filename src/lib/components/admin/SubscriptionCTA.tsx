'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { Button } from '@/lib/components/shared/ui/Button';

export function SubscriptionCTA() {
  const isTrialing = useSubscriptionStore((s) => s.isTrialing);
  const pathname = usePathname();

  // Don't duplicate the CTA on the page where the actual plans live —
  // it's redundant and adds a third indigo element to the same viewport.
  if (!isTrialing || pathname === '/admin/subscribe') return null;

  // Secondary button with a brass icon (DESIGN.md: brass carries upgrade
  // prompts), so the page's own primary action keeps the indigo.
  return (
    <Button asChild variant="secondary">
      <Link href="/admin/subscribe" aria-label="Attiva abbonamento">
        <Sparkles className="text-[var(--lume-brass-fg)]" aria-hidden />
        <span className="hidden sm:inline">Attiva abbonamento</span>
      </Link>
    </Button>
  );
}
