export const CONSENT_COOKIE = 'lume-cookie-consent';
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 365; // 12 months

export type CookieConsent = {
  necessary: true;
  analytics: boolean;
  version: typeof CONSENT_VERSION;
  timestamp: string;
};
