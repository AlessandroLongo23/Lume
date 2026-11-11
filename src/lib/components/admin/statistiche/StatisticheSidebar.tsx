'use client';

import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Scissors, Package, UserCheck } from 'lucide-react';
import { PeriodPicker } from '@/lib/components/admin/statistiche/PeriodPicker';
import { SectionNav, SectionNavGroup, SectionNavLink } from '@/lib/components/shared/ui/nav/SectionNav';

const NAV_ITEMS = [
  { href: '/admin/statistiche/overview',  label: 'Panoramica', icon: LayoutDashboard },
  { href: '/admin/statistiche/clienti',   label: 'Clienti',    icon: Users },
  { href: '/admin/statistiche/servizi',   label: 'Servizi',    icon: Scissors },
  { href: '/admin/statistiche/prodotti',  label: 'Prodotti',   icon: Package },
  { href: '/admin/statistiche/operatori', label: 'Operatori',  icon: UserCheck },
];

export function StatisticheSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-full min-w-0 md:w-52 md:shrink-0 md:sticky md:top-16 md:max-h-[calc(100vh-5rem)] md:overflow-y-auto flex flex-col gap-6">
      <PeriodPicker />
      <SectionNav id="statistiche-nav" label="Sezioni delle statistiche">
        <SectionNavGroup title="Sezioni">
          {NAV_ITEMS.map(({ href, label, icon }) => (
            <SectionNavLink
              key={href}
              href={href}
              label={label}
              icon={icon}
              active={pathname === href || pathname.startsWith(href + '/')}
            />
          ))}
        </SectionNavGroup>
      </SectionNav>
    </div>
  );
}
