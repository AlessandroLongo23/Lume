'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Scissors, Package, UserCheck } from 'lucide-react';
import { PeriodPicker } from '@/lib/components/admin/statistiche/PeriodPicker';

const NAV_ITEMS = [
  { href: '/admin/statistiche/overview',  label: 'Overview',   icon: LayoutDashboard },
  { href: '/admin/statistiche/clienti',   label: 'Clienti',    icon: Users },
  { href: '/admin/statistiche/servizi',   label: 'Servizi',    icon: Scissors },
  { href: '/admin/statistiche/prodotti',  label: 'Prodotti',   icon: Package },
  { href: '/admin/statistiche/operatori', label: 'Operatori',  icon: UserCheck },
];

export function StatisticheSidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-52 shrink-0 sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto space-y-4">
      <PeriodPicker />

      <div>
        <p className="px-3 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Sezioni
        </p>
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary-hover dark:text-primary/70'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
