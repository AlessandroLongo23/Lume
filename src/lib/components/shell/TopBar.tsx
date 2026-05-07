'use client';

import { Menu } from 'lucide-react';
import { LumeLogo } from '@/lib/components/shared/ui/LumeLogo';
import { useMobileMenu } from './sidebarContext';
import { Button } from '@/lib/components/shared/ui/Button';

interface TopBarProps {
  rightCluster: React.ReactNode;
  leftCluster?: React.ReactNode;
}

export function TopBar({ rightCluster, leftCluster }: TopBarProps) {
  const { setOpen } = useMobileMenu();

  return (
    <div className="h-full flex items-center justify-between gap-4 px-4 ps-6 min-w-0">
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="secondary"
          size="sm"
          iconOnly
          aria-label="Apri menu"
          onClick={() => setOpen(true)}
          className="md:hidden"
        >
          <Menu />
        </Button>
        <div className="md:hidden">
          <LumeLogo size="sm" />
        </div>
        {leftCluster && (
          <div className="hidden md:flex items-center min-w-0">{leftCluster}</div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">{rightCluster}</div>
    </div>
  );
}
