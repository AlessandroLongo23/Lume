'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, LineChart, MessageSquare, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const LINKS = [
  { href: '/platform/salons',   label: 'Saloni',   icon: Building2 },
  { href: '/platform/metrics',  label: 'Metriche', icon: LineChart },
  { href: '/platform/feedback', label: 'Feedback', icon: MessageSquare },
];

export function PlatformSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <div className="flex flex-col flex-1">
      <nav className="flex flex-col gap-0.5">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 transition-all duration-200 ease-in-out px-3 py-2 text-sm rounded-md ${
                isActive
                  ? 'text-primary bg-primary/10 dark:text-primary dark:bg-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted dark:text-muted-foreground dark:hover:text-white dark:hover:bg-muted'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted dark:text-muted-foreground dark:hover:text-white dark:hover:bg-muted"
        >
          <LogOut className="w-5 h-5 shrink-0" strokeWidth={1.5} />
          <span>Esci</span>
        </button>
      </div>
    </div>
  );
}
