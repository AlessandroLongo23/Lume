'use client';

import { ArrowLeft } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Button } from '@/lib/components/shared/ui/Button';
import { DURATION, EASE_OUT } from '@/lib/const/motion';

interface DetailHeroProps {
  onBack: () => void;
  avatar: React.ReactNode;
  title: React.ReactNode;
  meta?: React.ReactNode;
  chips?: React.ReactNode;
  aside?: React.ReactNode;
  actions: React.ReactNode;
  dataTour?: string;
}

export function DetailHero({ onBack, avatar, title, meta, chips, aside, actions, dataTour }: DetailHeroProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.header
      data-tour={dataTour}
      initial={reduceMotion ? false : { opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.base, ease: EASE_OUT }}
      className="px-6 lg:px-10 pt-6 pb-5 border-b border-line"
    >
      <div className="max-w-5xl mx-auto w-full flex items-center gap-4">
        <Button
          variant="ghost"
          size="md"
          iconOnly
          aria-label="Torna indietro"
          onClick={onBack}
        >
          <ArrowLeft />
        </Button>

        <div className="shrink-0">{avatar}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-medium tracking-tight leading-tight text-[var(--lume-text)] truncate">
              {title}
            </h1>
            {chips}
          </div>
          {meta && (
            <div className="flex items-center gap-1.5 mt-1 text-sm text-[var(--lume-text-secondary)]">
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
