'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { LumeLogo } from '@/lib/components/shared/ui/LumeLogo';

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
      {/* Back to home — top-left */}
      <motion.div
        className="absolute top-6 left-6"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Torna alla home
        </Link>
      </motion.div>

      <div className="w-full max-w-md">
        {/* Wordmark */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          <LumeLogo size="lg" />
        </motion.div>

        {/* Card */}
        <motion.div
          className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15, ease }}
        >
          {children}
        </motion.div>

        {/* Footer attribution */}
        <motion.p
          className="text-center text-xs text-zinc-400 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          © {new Date().getFullYear()} Lume — Tutti i diritti riservati
        </motion.p>
      </div>
    </div>
  );
}
