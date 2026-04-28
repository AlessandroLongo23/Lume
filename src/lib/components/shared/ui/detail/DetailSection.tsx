'use client';

import { motion, useReducedMotion } from 'motion/react';

interface DetailSectionProps {
  label: string;
  index?: number;
  id?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}

export function DetailSection({ label, index = 0, id, trailing, children }: DetailSectionProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      id={id}
      className="scroll-mt-6"
      initial={reduceMotion ? false : { opacity: 0, y: 8, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ type: 'spring', duration: 0.5, bounce: 0, delay: 0.08 + index * 0.06 }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400">
          {label}
        </h2>
        {trailing}
      </div>
      {children}
    </motion.section>
  );
}
