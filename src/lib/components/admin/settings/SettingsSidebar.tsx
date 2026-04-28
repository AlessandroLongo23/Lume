'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  Palette,
  CreditCard,
  Eye,
  LayoutList,
  Building2,
  ImagePlus,
  Clock,
  Receipt,
  Sliders,
  Warehouse,
  Calendar,
  Bell,
  Mail,
  Shield,
  TriangleAlert,
  Scissors,
} from 'lucide-react';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { canManageSalon, isSalonStaff, isAdmin } from '@/lib/auth/roles';

type Item = { href: string; label: string; icon: React.ElementType };
type Group = { title: string; items: Item[]; gated?: boolean };

const SALONE_ITEMS: Item[] = [
  { href: '/admin/impostazioni/salone/anagrafica', label: 'Anagrafica', icon: Building2 },
  { href: '/admin/impostazioni/salone/branding', label: 'Branding', icon: ImagePlus },
  { href: '/admin/impostazioni/salone/orari', label: 'Orari', icon: Clock },
  { href: '/admin/impostazioni/salone/calendario', label: 'Calendario', icon: Calendar },
  { href: '/admin/impostazioni/salone/magazzino', label: 'Magazzino', icon: Warehouse },
  { href: '/admin/impostazioni/salone/default-form', label: 'Default form', icon: Sliders },
  { href: '/admin/impostazioni/salone/notifiche-email', label: 'Notifiche email', icon: Mail },
  { href: '/admin/impostazioni/salone/fatturazione', label: 'Fatturazione', icon: Receipt },
];

export function SettingsSidebar() {
  const pathname = usePathname();
  const role = useSubscriptionStore((s) => s.role);
  const canManage = canManageSalon(role);
  // Show "Mio profilo operatore" to salon staff only — super-admins have no operator row.
  const showOperatorProfile = isSalonStaff(role) && !isAdmin(role);

  const personaliItems: Item[] = [
    { href: '/admin/impostazioni/profilo', label: 'Profilo', icon: User },
    { href: '/admin/impostazioni/aspetto', label: 'Aspetto', icon: Palette },
    { href: '/admin/impostazioni/viste', label: 'Default vista', icon: Eye },
    { href: '/admin/impostazioni/schede', label: 'Ordine schede', icon: LayoutList },
    { href: '/admin/impostazioni/notifiche', label: 'Notifiche', icon: Bell },
    ...(showOperatorProfile
      ? [{ href: '/admin/impostazioni/mio-profilo-operatore', label: 'Mio profilo operatore', icon: Scissors }]
      : []),
  ];

  const accountItems: Item[] = [
    { href: '/admin/impostazioni/account/sicurezza', label: 'Sicurezza', icon: Shield },
    { href: '/admin/impostazioni/abbonamento', label: 'Abbonamento', icon: CreditCard },
    { href: '/admin/impostazioni/account/elimina', label: 'Zona pericolosa', icon: TriangleAlert },
  ];

  const groups: Group[] = [
    { title: 'Personali', items: personaliItems },
    { title: 'Salone', items: SALONE_ITEMS, gated: !canManage },
    { title: 'Account', items: accountItems },
  ];

  return (
    <nav className="w-52 shrink-0">
      <ul className="flex flex-col gap-5">
        {groups
          .filter((g) => !g.gated)
          .map((group) => (
            <li key={group.title}>
              <p className="px-3 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {group.title}
              </p>
              <ul className="flex flex-col gap-0.5">
                {group.items.map(({ href, label, icon: Icon }) => {
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
            </li>
          ))}
      </ul>
    </nav>
  );
}
