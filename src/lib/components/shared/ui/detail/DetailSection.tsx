'use client';

import { motion, useReducedMotion } from 'motion/react';
import { DURATION, EASE_OUT } from '@/lib/const/motion';

interface DetailSectionProps {
  label: string;
  index?: number;
  id?: string;
  children: React.ReactNode;
  dataTour?: string;
}

export function DetailSection({ label, index = 0, id, children, dataTour }: DetailSectionProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      id={id}
      data-tour={dataTour}
      className="scroll-mt-6"
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.base, ease: EASE_OUT, delay: 0.04 + index * 0.04 }}
    >
      <h2 className="mb-3 text-xs font-medium text-[var(--lume-text-secondary)]">
        {label}
      </h2>
      {children}
    </motion.section>
  );
}
