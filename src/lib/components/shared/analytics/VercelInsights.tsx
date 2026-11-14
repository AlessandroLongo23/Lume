'use client';

import { Analytics } from '@vercel/analytics/next';

// Query strings and hashes can carry personal data (/welcome?name=…&salon=…,
// Supabase auth tokens in the hash), so only the path is sent to Vercel.
function stripQueryAndHash<T extends { url: string }>(event: T): T {
  return { ...event, url: event.url.split(/[?#]/)[0] };
}

// Vercel Web Analytics. It is cookieless, so it runs without the
// cookie-consent gate that PostHog needs (see /cookie-policy).
// Speed Insights is deliberately absent: it is billed per project on Pro.
export function VercelInsights() {
  return <Analytics beforeSend={stripQueryAndHash} />;
}
