'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { supabase } from '@/lib/supabase/client';
import { useCookieConsentStore } from '@/lib/stores/cookieConsent';

const DEMO_EMAIL_REGEX = /^demo\+.+@lume\.app$/i;
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

let initialized = false;

function isDemoEmail(email: string | undefined | null): boolean {
  return !!email && DEMO_EMAIL_REGEX.test(email);
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_KEY || initialized) return;
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: 'identified_only',
      capture_pageview: false,
      capture_pageleave: true,
      // Unmasked replay: demo salon contains only synthetic data — no real PII.
      session_recording: { maskAllInputs: false },
    });
    initialized = true;
  }, []);

  useEffect(() => {
    if (!POSTHOG_KEY) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        posthog.reset();
        return;
      }
      const user = session?.user;
      if (!user) return;
      const demo = isDemoEmail(user.email);
      if (demo) {
        const consent = useCookieConsentStore.getState();
        if (!consent.consent?.analytics) consent.accept();
      }
      posthog.identify(user.id, { email: user.email, is_demo: demo });
      if (event === 'SIGNED_IN') {
        posthog.capture('user_logged_in', { is_demo: demo });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const pathname = usePathname();
  useEffect(() => {
    if (!POSTHOG_KEY || !pathname) return;
    posthog.capture('$pageview', { $pathname: pathname });
  }, [pathname]);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
