import { create } from 'zustand';
import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE,
  CONSENT_VERSION,
  type CookieConsent,
} from '@/lib/types/CookieConsent';

function readCookie(): CookieConsent | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${CONSENT_COOKIE}=`));
  if (!match) return null;
  try {
    const raw = decodeURIComponent(match.slice(CONSENT_COOKIE.length + 1));
    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    if (parsed.version !== CONSENT_VERSION) return null;
    if (parsed.necessary !== true) return null;
    if (typeof parsed.analytics !== 'boolean') return null;
    if (typeof parsed.timestamp !== 'string') return null;
    return {
      necessary: true,
      analytics: parsed.analytics,
      version: CONSENT_VERSION,
      timestamp: parsed.timestamp,
    };
  } catch {
    return null;
  }
}

function writeCookie(consent: CookieConsent) {
  if (typeof document === 'undefined') return;
  const value = encodeURIComponent(JSON.stringify(consent));
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; Secure'
      : '';
  document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${CONSENT_MAX_AGE}; SameSite=Lax${secure}`;
}

interface CookieConsentState {
  consent: CookieConsent | null;
  bannerOpen: boolean;
  customizeOpen: boolean;
  hydrated: boolean;
  hydrate: () => void;
  accept: () => void;
  reject: () => void;
  setCustom: (prefs: { analytics: boolean }) => void;
  openCustomize: () => void;
  closeCustomize: () => void;
  reopen: () => void;
}

export const useCookieConsentStore = create<CookieConsentState>((set) => ({
  consent: null,
  bannerOpen: false,
  customizeOpen: false,
  hydrated: false,

  hydrate: () => {
    const existing = readCookie();
    set({
      consent: existing,
      bannerOpen: existing === null,
      customizeOpen: false,
      hydrated: true,
    });
  },

  accept: () => {
    const consent: CookieConsent = {
      necessary: true,
      analytics: true,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    };
    writeCookie(consent);
    set({ consent, bannerOpen: false, customizeOpen: false });
  },

  reject: () => {
    const consent: CookieConsent = {
      necessary: true,
      analytics: false,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    };
    writeCookie(consent);
    set({ consent, bannerOpen: false, customizeOpen: false });
  },

  setCustom: (prefs) => {
    const consent: CookieConsent = {
      necessary: true,
      analytics: prefs.analytics,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    };
    writeCookie(consent);
    set({ consent, bannerOpen: false, customizeOpen: false });
  },

  openCustomize: () => set({ customizeOpen: true }),
  closeCustomize: () => set({ customizeOpen: false }),

  reopen: () => set({ bannerOpen: true, customizeOpen: false }),
}));
