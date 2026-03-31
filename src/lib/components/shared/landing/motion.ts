import { type Variants } from 'motion/react';

export { motion } from 'motion/react';

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export const sectionVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

export const viewportConfig = { once: true, amount: 0.15 } as const;
