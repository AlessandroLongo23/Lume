import type { BrowserContext } from '@playwright/test';
import { testEnv } from './test-env';

/**
 * Sets the active salon cookie that the app reads to scope admin routes.
 * Used as a shortcut for owner/operator tests so they can hit /admin/* directly
 * without going through /select-salon when the test user has multiple salons.
 *
 * Mirrors the cookie shape written by [src/app/auth/callback/route.ts].
 */
export async function setActiveSalonCookie(
  context: BrowserContext,
  salonId: string = testEnv.testSalonId,
): Promise<void> {
  const url = new URL(testEnv.baseURL);
  await context.addCookies([{
    name:     'lume-active-salon-id',
    value:    salonId,
    domain:   url.hostname,
    path:     '/',
    httpOnly: true,
    secure:   url.protocol === 'https:',
    sameSite: 'Lax',
  }]);
}
