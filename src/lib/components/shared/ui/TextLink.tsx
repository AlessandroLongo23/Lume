import Link from 'next/link';
import type { ButtonHTMLAttributes, ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const textLinkClass =
  'font-medium text-[var(--lume-text)] underline decoration-[var(--lume-edge-hover)] underline-offset-[3px] hover:decoration-[var(--lume-text)] transition-[text-decoration-color] duration-[var(--duration-fast)] rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lume-ring-focus)] cursor-pointer';

/** Underline only on hover: for links that sit in table cells and lists. */
const quietClass = 'decoration-transparent hover:decoration-[var(--lume-edge-hover)] font-normal';

/** An inline link inside running text: underlined, current text colour. */
export function TextLink({ className, quiet = false, ...props }: ComponentProps<typeof Link> & { quiet?: boolean }) {
  return <Link className={cn(textLinkClass, quiet && quietClass, className)} {...props} />;
}

/** An action that reads as a link inside text ("Personalizza", "Annulla modifica"). */
export function TextButton({ className, type, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type ?? 'button'} className={cn(textLinkClass, className)} {...props} />;
}
