'use client';

import { Search } from 'lucide-react';
import { Button } from '@/lib/components/shared/ui/Button';
import { Kbd } from '@/lib/components/shared/ui/Kbd';

interface CommandMenuTriggerProps {
  onOpen: () => void;
}

export function CommandMenuTrigger({ onOpen }: CommandMenuTriggerProps) {
  return (
    <Button
      variant="secondary"
      size="md"
      leadingIcon={Search}
      onClick={onOpen}
      aria-label="Apri comandi"
      // Reads like the Searchbar: control fill, shadow edge, muted placeholder
      // text and a kbd chip at the end. Hover darkens the edge, not the fill.
      // ds-ignore: muted text is the Searchbar placeholder look; Button mutes only icon-only ghost buttons, never a labelled secondary one
      className="hidden sm:flex min-w-56 justify-start pr-1.5 font-normal text-[var(--lume-text-muted)] bg-[var(--lume-control-bg)] hover:bg-[var(--lume-control-bg)] hover:shadow-[inset_0_0_0_1px_var(--lume-edge-hover)] active:scale-100 [&>svg]:text-[var(--lume-text-muted)]"
    >
      <span className="flex-1 text-left truncate">Cerca…</span>
      <Kbd>⌘K</Kbd>
    </Button>
  );
}
