'use client';

import type { ReactNode } from 'react';
import { useCookieConsentStore } from '@/lib/stores/cookieConsent';
import { Button } from '@/lib/components/shared/ui/Button';

interface CookieManageLinkProps {
  children: ReactNode;
  /** Classes for the bare link-styled button (footer). Ignored with `button`. */
  className?: string;
  /** Render as a secondary Button (the cookie policy page). */
  button?: boolean;
}

export function CookieManageLink({ children, className, button }: CookieManageLinkProps) {
  const reopen = useCookieConsentStore((s) => s.reopen);
  if (button) {
    return (
      <Button variant="secondary" onClick={reopen}>
        {children}
      </Button>
    );
  }
  return (
    <button
      // ds-ignore: footer nav item styled by the caller like its sibling links; TextButton adds an underline and medium weight
      type="button"
      onClick={reopen}
      className={className}
    >
      {children}
    </button>
  );
}
