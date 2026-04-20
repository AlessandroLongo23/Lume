'use client';

import { useEffect, useState } from 'react';
import { Menu, Calendar, Clock } from 'lucide-react';
import { ThemeToggle } from '@/lib/components/shared/ui/theme/ThemeToggle';
import { LumeLogo } from '@/lib/components/shared/ui/LumeLogo';
import { PlatformUserAvatar } from './PlatformUserAvatar';

interface PlatformHeaderProps {
  firstName: string;
  lastName:  string;
  email:     string;
  onMobileMenuOpen?: () => void;
}

export function PlatformHeader({ firstName, lastName, email, onMobileMenuOpen }: PlatformHeaderProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seconds, setSeconds] = useState('');
  const [loaded, setLoaded] = useState(false);

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
    <header className="fixed flex flex-row top-0 left-0 right-0 z-50 px-4 md:px-6 py-3 md:py-4 bg-white dark:bg-card border-b border-border dark:border-border shadow-sm dark:shadow-md">
      <div className="flex flex-row flex-1 justify-start items-center gap-2">
        <span className="hidden sm:inline-flex items-center gap-2">
          <LumeLogo size="md" />
          <span className="text-2xs font-medium px-1.5 py-0.5 rounded bg-primary/15 text-primary-active dark:bg-primary/20 dark:text-primary/70 uppercase tracking-wider">
            Platform
          </span>
        </span>
        <button
          className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-border dark:border-border bg-white dark:bg-card text-zinc-900 dark:text-white"
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
        <ThemeToggle />
        <PlatformUserAvatar firstName={firstName} lastName={lastName} email={email} />
      </div>
    </header>
  );
}
