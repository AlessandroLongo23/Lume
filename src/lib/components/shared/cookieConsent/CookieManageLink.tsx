'use client';

import type { ReactNode } from 'react';
import { useCookieConsentStore } from '@/lib/stores/cookieConsent';
import { Button, type ButtonVariant } from '@/lib/components/shared/ui/Button';

interface CookieManageLinkProps {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
}

export function CookieManageLink({ children, className, variant }: CookieManageLinkProps) {
  const reopen = useCookieConsentStore((s) => s.reopen);
  if (variant) {
    return (
      <Button type="button" variant={variant} onClick={reopen}>
        {children}
      </Button>
    );
  }
  return (
    <button type="button" onClick={reopen} className={className}>
      {children}
    </button>
  );
}
