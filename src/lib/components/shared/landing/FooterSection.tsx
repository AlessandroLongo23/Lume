'use client';

import Link from 'next/link';
import { LumeLogo } from '@/lib/components/shared/ui/LumeLogo';
import { CookieManageLink } from '@/lib/components/shared/cookieConsent/CookieManageLink';

const linkClass =
  'inline-flex items-center min-h-8 max-sm:min-h-11 text-sm text-[var(--lume-text-secondary)] hover:text-[var(--lume-text)] transition-colors';

export function FooterSection() {
  return (
    <footer className="lp-section lp-rule pb-10! pt-16!">
      <div className="lp-container flex flex-col gap-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
          <div className="flex flex-col gap-3">
            <LumeLogo size="md" />
            <p className="text-sm text-[var(--lume-text-secondary)] max-w-[30ch]">
              Il gestionale che illumina il tuo salone.
            </p>
          </div>

          <nav aria-label="Prodotto" className="flex flex-col gap-1">
            <span className="text-compact text-[var(--lume-text-muted)] mb-2">Prodotto</span>
            <a href="#funzionalita" className={linkClass}>Funzionalità</a>
            <a href="#come-funziona" className={linkClass}>Come funziona</a>
            <a href="#prezzi" className={linkClass}>Prezzi</a>
            <a href="#domande" className={linkClass}>Domande frequenti</a>
          </nav>

          <nav aria-label="Account" className="flex flex-col gap-1">
            <span className="text-compact text-[var(--lume-text-muted)] mb-2">Account</span>
            <Link href="/login" className={linkClass}>Accedi</Link>
            <Link href="/register" className={linkClass}>Prova gratis</Link>
            <a href="mailto:info@lumeapp.it" className={linkClass}>Contatti</a>
          </nav>

          <nav aria-label="Note legali" className="flex flex-col gap-1">
            <span className="text-compact text-[var(--lume-text-muted)] mb-2">Note legali</span>
            <Link href="/privacy" className={linkClass}>Privacy</Link>
            <Link href="/terms" className={linkClass}>Termini</Link>
            <Link href="/dpa" className={linkClass}>DPA</Link>
            <Link href="/sub-processors" className={linkClass}>Sub-processors</Link>
            <Link href="/cookie-policy" className={linkClass}>Cookie</Link>
            <CookieManageLink className={linkClass}>Gestisci cookie</CookieManageLink>
          </nav>
        </div>

        <div className="pt-6 border-t border-line text-compact text-[var(--lume-text-muted)]">
          © 2026 Lume
        </div>
      </div>
    </footer>
  );
}
