'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { useCookieConsentStore } from '@/lib/stores/cookieConsent';
import {
  capture,
  identify,
  resetIdentity,
  startAnalytics,
  stopAnalytics,
} from '@/lib/posthog/analytics';

const DEMO_EMAIL_REGEX = /^demo\+.+@lume\.app$/i;
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

function isDemoEmail(email: string | undefined | null): boolean {
  return !!email && DEMO_EMAIL_REGEX.test(email);
}

function identifySession(session: Session | null) {
  const user = session?.user;
  if (!user) return;
  identify(user.id, { email: user.email, is_demo: isDemoEmail(user.email) });
}

/**
 * PostHog runs only with analytics consent (lume-cookie-consent). It is
 * loaded on demand when consent is given, and stopped if it is withdrawn.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const analyticsConsent = useCookieConsentStore((s) => s.consent?.analytics === true);

  useEffect(() => {
    if (!POSTHOG_KEY) return;
    if (!analyticsConsent) {
      stopAnalytics();
      return;
    }
    let cancelled = false;
    startAnalytics().then(async (posthog) => {
      if (cancelled || !posthog) return;
      // Events from before the load were dropped: record where we are now.
      const { data: { session } } = await supabase.auth.getSession();
      identifySession(session);
      capture('$pageview', { $pathname: window.location.pathname });
    });
    return () => {
      cancelled = true;
    };
  }, [analyticsConsent]);

  useEffect(() => {
    if (!POSTHOG_KEY) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        resetIdentity();
        return;
      }
      const user = session?.user;
      if (!user) return;
      const demo = isDemoEmail(user.email);
      // Demo accounts hold only synthetic data: analytics is switched on for them.
      if (demo) {
        const consent = useCookieConsentStore.getState();
        if (!consent.consent?.analytics) consent.accept();
      }
      identifySession(session);
      if (event === 'SIGNED_IN') {
        capture('user_logged_in', { is_demo: demo });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const pathname = usePathname();
  useEffect(() => {
    if (!POSTHOG_KEY || !pathname) return;
    capture('$pageview', { $pathname: pathname });
  }, [pathname]);

  return <>{children}</>;
}
