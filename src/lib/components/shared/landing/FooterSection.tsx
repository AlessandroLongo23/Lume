'use client';

import { LumeLogo } from '@/lib/components/shared/ui/LumeLogo';
import { motion, viewportConfig } from './motion';

export function FooterSection() {
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

        <div className="flex items-center gap-6">
          <a href="#" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
            Privacy
          </a>
          <a href="#" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
            Termini
          </a>
          <a
            href="mailto:info@lumeapp.it"
            className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            Contatti
          </a>
        </div>

        <p className="text-xs text-zinc-400">© 2026 Lume</p>
      </motion.div>
    </footer>
  );
}
