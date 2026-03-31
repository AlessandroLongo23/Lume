'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { DoorOpen, LogIn } from 'lucide-react';
import { useTheme } from '@/lib/components/shared/ui/theme/ThemeProvider';
import { ThemeToggle } from '@/lib/components/shared/ui/theme/ThemeToggle';
import type { Session } from '@supabase/supabase-js';

interface LandingHeaderProps {
  session: Session | null;
  onAuthClick: () => void;
}

export function LandingHeader({ session, onAuthClick }: LandingHeaderProps) {
  const router = useRouter();
  const { theme } = useTheme();

  const logo = theme === 'dark'
    ? '/brand/raster/2000w/wide-white.png'
    : '/brand/raster/2000w/wide-black.png';

  const handleAccessClick = () => {
    if (session) {
      const role = (session.user?.user_metadata as { role?: string })?.role;
      router.push(role === 'operator' ? '/admin/bilancio' : '/client/prodotti');
    } else {
      onAuthClick();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-white dark:bg-zinc-900 border-b border-zinc-500/25 transition-transform duration-300">
      <div className="w-full mx-auto flex items-center sm:justify-between justify-center p-4">
        <Image src={logo} alt="logo" height={48} width={200} className="h-12 w-auto" />
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <button
            onClick={handleAccessClick}
            className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-500/25 text-zinc-700 dark:text-zinc-200 px-4 py-2 rounded-xl font-semibold text-sm cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
          >
            <span className="flex items-center justify-center gap-2 text-black dark:text-white">
              <span>{session ? 'Entra' : 'Accedi'}</span>
              {session ? <DoorOpen strokeWidth={1.5} className="w-4 h-4" /> : <LogIn strokeWidth={1.5} className="w-4 h-4" />}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
