'use client';

import { useState, type ComponentType } from 'react';

type Icon = ComponentType<{ className?: string }>;

/**
 * An icon that pops in when it changes (Eye → EyeOff, Copy → Check). The first
 * icon renders still, so a page of toggles does not all animate on load.
 *
 *   <SwapIcon icon={visible ? EyeOff : Eye} className="size-4" />
 *
 * A different icon is a different element type, so React remounts it and the
 * `.icon-pop` animation (globals.css) plays on that mount.
 */
export function SwapIcon({ icon: Icon, className }: { icon: Icon; className?: string }) {
  // "Changed since mount", tracked as state adjusted during render: reading a
  // ref during render is rejected by the React Compiler lint.
  const [prev, setPrev] = useState<Icon>(() => Icon);
  const [swapped, setSwapped] = useState(false);
  if (Icon !== prev) {
    setPrev(() => Icon);
    setSwapped(true);
  }
  return <Icon className={[className, swapped && 'icon-pop'].filter(Boolean).join(' ') || undefined} />;
}
