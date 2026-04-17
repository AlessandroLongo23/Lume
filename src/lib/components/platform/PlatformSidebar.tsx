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
                  ? 'text-[#4F46E5] bg-[#EEF2FF] dark:text-[#818CF8] dark:bg-[#1E1B4B]/30'
                  : 'text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] dark:text-[#A1A1AA] dark:hover:text-white dark:hover:bg-[#27272A]'
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
          className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] dark:text-[#A1A1AA] dark:hover:text-white dark:hover:bg-[#27272A]"
        >
          <LogOut className="w-5 h-5 shrink-0" strokeWidth={1.5} />
          <span>Esci</span>
        </button>
      </div>
    </div>
  );
}
