'use client';

import { useEffect, useState } from 'react';
import { Menu, Calendar, Clock } from 'lucide-react';
import { useOperatorsStore } from '@/lib/stores/operators';
import { LogoutButton } from '@/lib/components/shared/ui/buttons/LogoutButton';
import { ThemeToggle } from '@/lib/components/shared/ui/theme/ThemeToggle';
import { LumeLogo } from '@/lib/components/shared/ui/LumeLogo';
import { SubscriptionCTA } from '@/lib/components/admin/SubscriptionCTA';
import type { User } from '@supabase/supabase-js';

interface AdminHeaderProps {
  user: User | null;
  onMobileMenuOpen?: () => void;
}

export function AdminHeader({ user, onMobileMenuOpen }: AdminHeaderProps) {
  const operators = useOperatorsStore((s) => s.operators);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seconds, setSeconds] = useState('');
  const [loaded, setLoaded] = useState(false);

  const operator = operators.find((o) => o.id === user?.id);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(
        `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
      );
      setSeconds(d.getSeconds().toString().padStart(2, '0'));
      setDate(d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }));
      setLoaded(true);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed flex flex-row top-0 left-0 right-0 z-50 px-4 md:px-6 py-3 md:py-4 bg-white dark:bg-[#18181B] border-b border-[#E4E4E7] dark:border-[#27272A] shadow-sm dark:shadow-md">
      <div className="flex flex-row flex-1 justify-start items-center">
        <span className="hidden sm:inline-flex"><LumeLogo size="md" /></span>
        <button
          className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-[#E4E4E7] dark:border-[#27272A] bg-white dark:bg-[#18181B] text-zinc-900 dark:text-white"
          onClick={onMobileMenuOpen}
          aria-label="Apri menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div
        className={`flex-1 flex flex-row justify-center items-center gap-4
          transition-all duration-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <div className="flex flex-row items-center gap-2">
          <Calendar className="w-5 h-5 text-zinc-900 dark:text-white" />
          <h1 className="text-lg md:text-xl font-medium text-zinc-900 dark:text-white">{date}</h1>
        </div>
        <div className="hidden sm:flex flex-row items-center gap-2">
          <Clock className="w-5 h-5 text-zinc-900 dark:text-white" />
          <div className="flex flex-row items-baseline">
            <h1 className="text-lg md:text-xl font-medium text-zinc-900 dark:text-white">{time}</h1>
            <h1 className="text-sm md:text-base font-medium text-zinc-500 dark:text-zinc-400">:{seconds}</h1>
          </div>
        </div>
      </div>

      <div className="flex flex-1 justify-end items-center gap-4 md:gap-5">
        {operator && (
          <div className="hidden md:block">
            <p className="text-sm font-thin text-zinc-900 dark:text-white">
              {operator.firstName} {operator.lastName}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Operatore</p>
          </div>
        )}
        <SubscriptionCTA />
        <ThemeToggle />
        <LogoutButton />
      </div>
    </header>
  );
}
