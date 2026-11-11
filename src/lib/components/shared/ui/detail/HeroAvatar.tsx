'use client';

import type { LucideIcon } from 'lucide-react';

export function HeroAvatar({ initials, photoUrl }: { initials: string; photoUrl?: string | null }) {
  return (
    <div className="size-12 rounded-full bg-active flex items-center justify-center overflow-hidden">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="size-full object-cover" />
      ) : (
        <span className="text-sm font-medium text-[var(--lume-text)] tracking-wide">
          {initials || '·'}
        </span>
      )}
    </div>
  );
}

/**
 * The identity mark of a thing (a product, a service, an order) where
 * HeroAvatar marks a person: the same 48px neutral fill, the icon in the
 * secondary ink. No tint: indigo is for actions, and PageHeader has no icon
 * tile either.
 */
export function HeroIconTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="size-12 rounded-xl flex items-center justify-center bg-active text-[var(--lume-text-secondary)]">
      <Icon className="size-5" strokeWidth={1.75} aria-hidden />
    </div>
  );
}
