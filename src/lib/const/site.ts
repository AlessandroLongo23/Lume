/**
 * Public-facing site location.
 *
 * Single source of truth for the host customers see in their browser when
 * they land on a salon's public booking page. Used in the settings preview
 * and any other UI that surfaces a public booking URL.
 *
 * When you buy a custom domain, change the two values below — every label
 * the customer sees follows. Cancel/booking email links built server-side
 * still honour `x-forwarded-host`, so dev/staging previews don't ship
 * production URLs.
 */

/** Display host without protocol, e.g. for inline previews. */
export const PUBLIC_SITE_HOST = 'lume-gestionale.vercel.app';

/** Full origin including protocol — for `new URL(path, ORIGIN)` etc. */
export const PUBLIC_SITE_ORIGIN = `https://${PUBLIC_SITE_HOST}`;
