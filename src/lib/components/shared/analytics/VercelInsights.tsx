'use client';

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

// Query strings and hashes can carry personal data (/welcome?name=…&salon=…,
// Supabase auth tokens in the hash), so only the path is sent to Vercel.
function stripQueryAndHash<T extends { url: string }>(event: T): T {
  return { ...event, url: event.url.split(/[?#]/)[0] };
}

// Vercel Web Analytics + Speed Insights. Both are cookieless, so they run
// without the cookie-consent gate that PostHog needs (see /cookie-policy).
export function VercelInsights() {
  return (
    <>
      <Analytics beforeSend={stripQueryAndHash} />
      <SpeedInsights beforeSend={stripQueryAndHash} />
    </>
  );
}
