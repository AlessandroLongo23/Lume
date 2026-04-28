'use client';

import { ArrowLeft } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

interface DetailHeroProps {
  onBack: () => void;
  avatar: React.ReactNode;
  title: React.ReactNode;
  meta?: React.ReactNode;
  chips?: React.ReactNode;
  aside?: React.ReactNode;
  actions: React.ReactNode;
}

export function DetailHero({ onBack, avatar, title, meta, chips, aside, actions }: DetailHeroProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.header
      initial={reduceMotion ? false : { opacity: 0, y: -6, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ type: 'spring', duration: 0.45, bounce: 0 }}
      className="px-6 lg:px-10 pt-6 pb-5 border-b border-zinc-500/15"
    >
      <div className="max-w-5xl mx-auto w-full flex items-center gap-4">
        <button
          onClick={onBack}
          className="size-9 flex items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          aria-label="Torna indietro"
        >
          <ArrowLeft className="size-4" />
        </button>

        <div className="shrink-0">{avatar}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
              {title}
            </h1>
            {chips}
          </div>
          {meta && (
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {meta}
            </div>
          )}
        </div>

        {aside && <div className="hidden lg:block shrink-0 mr-2">{aside}</div>}

        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      </div>
    </motion.header>
  );
}
