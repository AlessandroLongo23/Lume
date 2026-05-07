'use client';

import Link from 'next/link';
import { LumeLogo } from '@/lib/components/shared/ui/LumeLogo';
import { CookieManageLink } from '@/lib/components/shared/cookieConsent/CookieManageLink';
import { motion, viewportConfig } from './motion';

export function FooterSection() {
  const linkClass =
    'text-xs text-zinc-400 hover:text-zinc-600 transition-colors';

  return (
    <footer className="bg-white border-t border-border py-12 px-4">
      <motion.div
        className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={viewportConfig}
        transition={{ duration: 0.6 }}
      >
        <div>
          <LumeLogo size="sm" />
          <p className="text-xs text-zinc-400 mt-1">Il gestionale che illumina il tuo salone.</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link href="/privacy" className={linkClass}>
            Privacy
          </Link>
          <Link href="/cookie-policy" className={linkClass}>
            Cookie
          </Link>
          <CookieManageLink className={linkClass}>Gestisci cookie</CookieManageLink>
          <a href="mailto:info@lumeapp.it" className={linkClass}>
            Contatti
          </a>
        </div>

        <p className="text-xs text-zinc-400">© 2026 Lume</p>
      </motion.div>
    </footer>
  );
}
