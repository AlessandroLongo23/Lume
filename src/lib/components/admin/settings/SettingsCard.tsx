'use client';

import { useId } from 'react';
import { Switch } from '@/lib/components/shared/ui/Switch';

interface Props {
  title: string;
  description?: string;
  rightSlot?: React.ReactNode;
  /** The whole section is on/off: a switch beside the title, named by it. */
  toggle?: { checked: boolean; onChange: () => void; disabled?: boolean };
  children: React.ReactNode;
}

/**
 * One group of settings. Not a boxed card: groups stack on the page and a
 * hairline separates each from the one above, so a panel reads as one form.
 */
export function SettingsCard({ title, description, rightSlot, toggle, children }: Props) {
  const id = useId();
  const titleId = `${id}-title`;
  const descId = description ? `${id}-desc` : undefined;
  const right = toggle ? (
    <Switch
      checked={toggle.checked}
      onChange={toggle.onChange}
      disabled={toggle.disabled}
      aria-labelledby={titleId}
      aria-describedby={descId}
    />
  ) : rightSlot;
  return (
    <section className="border-t border-line pt-6 first:border-t-0 first:pt-0">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 id={titleId} className="text-base font-medium tracking-tight text-[var(--lume-text)]">{title}</h3>
          {description && (
            <p id={descId} className="mt-1 text-sm text-[var(--lume-text-secondary)] max-w-prose">{description}</p>
          )}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      <div>{children}</div>
    </section>
  );
}
