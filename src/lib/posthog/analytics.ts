import type { PostHog } from 'posthog-js';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

let client: PostHog | null = null;
let loading: Promise<PostHog | null> | null = null;

/**
 * Downloads and starts PostHog. Call it only once the visitor has accepted
 * analytics cookies: until then nothing is loaded, no ph_* cookie is set and
 * no event leaves the browser (see /cookie-policy). Loading on demand also
 * keeps posthog-js (about 60KB) out of every page's initial bundle.
 */
export function startAnalytics(): Promise<PostHog | null> {
  if (!POSTHOG_KEY || typeof window === 'undefined') return Promise.resolve(null);
  loading ??= import('posthog-js').then(({ default: posthog }) => {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: 'identified_only',
      capture_pageview: false,
      capture_pageleave: true,
      // Real salons record client names and phone numbers: replays mask every input.
      session_recording: { maskAllInputs: true },
    });
    client = posthog;
    return posthog;
  });
  return loading.then((posthog) => {
    // Consent given again after a withdrawal in the same session.
    if (posthog?.has_opted_out_capturing()) posthog.opt_in_capturing();
    return posthog;
  });
}

/** Consent withdrawn: stop capturing and drop the stored identity. */
export function stopAnalytics() {
  if (!client) return;
  client.opt_out_capturing();
  client.reset();
}

/** Sends an event when analytics is running; without consent it is dropped. */
export function capture(event: string, properties?: Record<string, unknown>) {
  client?.capture(event, properties);
}

export function identify(userId: string, properties?: Record<string, unknown>) {
  client?.identify(userId, properties);
}

export function resetIdentity() {
  client?.reset();
}
