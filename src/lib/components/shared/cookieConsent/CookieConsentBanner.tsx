'use client';

import { useEffect } from 'react';
import { TextButton, TextLink } from '@/lib/components/shared/ui/TextLink';
import { Cookie } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { DURATION, EASE_OUT } from '@/lib/const/motion';
import { Portal } from '@/lib/components/shared/ui/Portal';
import { Button } from '@/lib/components/shared/ui/Button';
import { useCookieConsentStore } from '@/lib/stores/cookieConsent';
import { Checkbox } from '@/lib/components/shared/ui/forms/Checkbox';

export function CookieConsentBanner() {
  const hydrated = useCookieConsentStore((s) => s.hydrated);
  const bannerOpen = useCookieConsentStore((s) => s.bannerOpen);
  const customizeOpen = useCookieConsentStore((s) => s.customizeOpen);
  const hydrate = useCookieConsentStore((s) => s.hydrate);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) return null;

  return (
    <Portal>
      {/* Phones: a full-width sheet on the bottom edge. From sm up: a small card in the bottom-left corner. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-toast sm:inset-x-auto sm:left-4 sm:bottom-4 sm:w-96">
        <AnimatePresence>
          {bannerOpen && (
            <motion.div
              key="cookie-banner"
              role="dialog"
              aria-modal="false"
              aria-labelledby="cookie-consent-title"
              className="surface-float pointer-events-auto rounded-b-none sm:rounded-b-[var(--radius-lg)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              transition={{ duration: DURATION.base, ease: EASE_OUT }}
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
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <Cookie className="mt-0.5 size-4 shrink-0 text-[var(--lume-text-secondary)]" strokeWidth={1.75} aria-hidden />
        <div className="flex-1">
          <h2 id="cookie-consent-title" className="text-sm font-medium text-[var(--lume-text)]">
            Cookie e privacy
          </h2>
          <p className="mt-1 text-sm leading-snug text-[var(--lume-text-secondary)]">
            Usiamo cookie tecnici per farti accedere a Lume e, con il tuo consenso, cookie di analisi
            per capire come migliorare il prodotto. Puoi cambiare scelta in qualsiasi momento dal
            footer.
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--lume-text-secondary)]">
            <TextLink href="/privacy" className="inline-flex items-center pointer-coarse:min-h-11 font-normal text-inherit">
              Privacy
            </TextLink>
            <TextLink href="/cookie-policy" className="inline-flex items-center pointer-coarse:min-h-11 font-normal text-inherit">
              Cookie policy
            </TextLink>
            {/* Phones only: Personalizza moves here so the banner stays short
                enough not to cover the page's own primary action. */}
            <TextButton onClick={openCustomize} className="inline-flex items-center pointer-coarse:min-h-11 font-normal text-inherit sm:hidden">
              Personalizza
            </TextButton>
          </div>
        </div>
      </div>

      {/* Rifiuta and Accetta sit side by side at equal size on every width. */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
        <Button variant="ghost" onClick={openCustomize} className="hidden sm:inline-flex sm:mr-auto sm:-ml-3">
          Personalizza
        </Button>
        <Button variant="secondary" onClick={reject}>
          Rifiuta
        </Button>
        <Button variant="primary" onClick={accept}>
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
      className="flex flex-col gap-4"
    >
      <div className="flex items-start gap-3">
        <Cookie className="mt-0.5 size-4 shrink-0 text-[var(--lume-text-secondary)]" strokeWidth={1.75} aria-hidden />
        <div className="flex-1">
          <h2 id="cookie-consent-title" className="text-sm font-medium text-[var(--lume-text)]">
            Personalizza i cookie
          </h2>
          <p className="mt-1 text-sm leading-snug text-[var(--lume-text-secondary)]">
            Scegli quali categorie di cookie attivare.
          </p>
        </div>
      </div>

      <div className="surface-card flex flex-col rounded-lg divide-y divide-line">
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
        <Button variant="ghost" onClick={closeCustomize} className="order-2 sm:order-1">
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
      // ds-ignore: consent row in an uncontrolled form (name + defaultChecked); the whole padded row toggles, 8px gap, the always-on row stays at 80%, none of which CheckboxRow does
      className={`flex items-start gap-2 p-3 ${
        disabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
      }`}
    >
      <Checkbox
        size="sm"
        name={name}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="mt-0.5"
      />
      <div className="flex-1">
        <div className="text-sm font-medium text-[var(--lume-text)]">{label}</div>
        <p className="mt-0.5 text-xs leading-snug text-[var(--lume-text-secondary)]">{description}</p>
      </div>
    </label>
  );
}
