'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Portal } from '@/lib/components/shared/ui/Portal';
import { Button } from '@/lib/components/shared/ui/Button';
import { useCookieConsentStore } from '@/lib/stores/cookieConsent';

export function CookieConsentBanner() {
  const hydrated = useCookieConsentStore((s) => s.hydrated);
  const bannerOpen = useCookieConsentStore((s) => s.bannerOpen);
  const customizeOpen = useCookieConsentStore((s) => s.customizeOpen);
  const hydrate = useCookieConsentStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) return null;

  return (
    <Portal>
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-toast md:left-1/2 md:right-auto md:bottom-6 md:w-[min(40rem,calc(100vw-3rem))] md:-translate-x-1/2">
        <AnimatePresence>
          {bannerOpen && (
            <motion.div
              key="cookie-banner"
              role="dialog"
              aria-modal="false"
              aria-labelledby="cookie-consent-title"
              className="pointer-events-auto rounded-lg border border-border bg-popover text-popover-foreground shadow-[0_8px_16px_-4px_var(--shadow-color),0_20px_40px_-8px_var(--shadow-color)] p-5 md:p-6"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              {customizeOpen ? <CustomizeView /> : <DefaultView />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Portal>
  );
}

function DefaultView() {
  const accept = useCookieConsentStore((s) => s.accept);
  const reject = useCookieConsentStore((s) => s.reject);
  const openCustomize = useCookieConsentStore((s) => s.openCustomize);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={2.25} />
        <div className="flex-1">
          <h2 id="cookie-consent-title" className="text-sm font-semibold text-foreground">
            Cookie e privacy
          </h2>
          <p className="mt-1 text-sm leading-snug text-muted-foreground">
            Usiamo cookie tecnici per farti accedere a Lume e, con il tuo consenso, cookie di analisi
            per capire come migliorare il prodotto. Puoi cambiare scelta in qualsiasi momento dal
            footer.
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <Link
              href="/privacy"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="/cookie-policy"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Cookie policy
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={openCustomize} className="order-3 sm:order-1">
          Personalizza
        </Button>
        <Button variant="secondary" onClick={reject} className="order-2">
          Rifiuta
        </Button>
        <Button variant="primary" onClick={accept} className="order-1 sm:order-3">
          Accetta
        </Button>
      </div>
    </div>
  );
}

function CustomizeView() {
  const consent = useCookieConsentStore((s) => s.consent);
  const setCustom = useCookieConsentStore((s) => s.setCustom);
  const closeCustomize = useCookieConsentStore((s) => s.closeCustomize);

  // Local state mirrored on the store seed; default analytics OFF (no pre-checked
  // boxes, per Garante 2021 guidance) unless the user previously opted in.
  const initialAnalytics = consent?.analytics ?? false;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        setCustom({ analytics: data.get('analytics') === 'on' });
      }}
      className="flex flex-col gap-5"
    >
      <div className="flex items-start gap-3">
        <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={2.25} />
        <div className="flex-1">
          <h2 id="cookie-consent-title" className="text-sm font-semibold text-foreground">
            Personalizza i cookie
          </h2>
          <p className="mt-1 text-sm leading-snug text-muted-foreground">
            Scegli quali categorie di cookie attivare.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <ToggleRow
          name="necessary"
          label="Necessari"
          description="Indispensabili per autenticazione, sessione e impersonificazione admin. Sempre attivi."
          defaultChecked
          disabled
        />
        <ToggleRow
          name="analytics"
          label="Analisi"
          description="Ci aiutano a capire l'uso del prodotto in modo aggregato. Attualmente non attivi, attiveremo strumenti di analisi solo dopo il tuo consenso."
          defaultChecked={initialAnalytics}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={closeCustomize} className="order-2 sm:order-1">
          Annulla
        </Button>
        <Button variant="primary" type="submit" className="order-1 sm:order-2">
          Salva preferenze
        </Button>
      </div>
    </form>
  );
}

interface ToggleRowProps {
  name: string;
  label: string;
  description: string;
  defaultChecked?: boolean;
  disabled?: boolean;
}

function ToggleRow({ name, label, description, defaultChecked, disabled }: ToggleRowProps) {
  return (
    <label
      className={`flex items-start gap-3 rounded-md border border-border bg-muted p-3 ${
        disabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
      }`}
    >
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-ring focus:ring-offset-0"
      />
      <div className="flex-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{description}</p>
      </div>
    </label>
  );
}
