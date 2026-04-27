'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
}

export function StarRating({ value, onChange }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const [justClicked, setJustClicked] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();

  const displayedRating = hoverRating || value;

  return (
    <div
      className="flex flex-row items-center"
      onMouseLeave={() => setHoverRating(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= displayedRating;
        return (
          <motion.button
            key={n}
            type="button"
            aria-label={`${n} stelle`}
            onMouseEnter={() => setHoverRating(n)}
            onClick={() => {
              onChange(n);
              if (!reduceMotion) setJustClicked(n);
            }}
            whileHover={reduceMotion ? undefined : { scale: 1.15 }}
            whileTap={reduceMotion ? undefined : { scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className="px-2 py-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <motion.span
              className="block"
              animate={
                justClicked === n && !reduceMotion
                  ? { scale: [1, 1.35, 1], rotate: [0, -8, 6, 0] }
                  : { scale: 1, rotate: 0 }
              }
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              onAnimationComplete={() => {
                if (justClicked === n) setJustClicked(null);
              }}
            >
              <Star
                className={`size-9 transition-colors duration-200 ${
                  filled ? 'fill-amber-400 text-amber-400' : 'text-zinc-300 dark:text-zinc-600'
                }`}
                strokeWidth={1.5}
              />
            </motion.span>
          </motion.button>
        );
      })}
      <AnimatePresence mode="popLayout">
        {value > 0 && (
          <motion.span
            key={value}
            initial={reduceMotion ? false : { opacity: 0, x: -6, filter: 'blur(2px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 6, filter: 'blur(2px)' }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0 }}
            className="ml-2 text-sm text-zinc-500 dark:text-zinc-400 tabular-nums"
          >
            {value}/5
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
