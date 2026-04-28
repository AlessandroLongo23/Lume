'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  Sparkles,
  CreditCard,
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
} from 'lucide-react';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { canManageSalon } from '@/lib/auth/roles';

type Item = { href: string; label: string; icon: React.ElementType };
type Group = { title: string; items: Item[]; hint?: string; gated?: boolean };

const PREFERENZE_ITEMS: Item[] = [
  { href: '/admin/impostazioni/personalizzazione', label: 'Personalizzazione', icon: Sparkles },
  { href: '/admin/impostazioni/notifiche', label: 'Notifiche', icon: Bell },
];

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

const ACCOUNT_ITEMS: Item[] = [
  { href: '/admin/impostazioni/profilo', label: 'Profilo', icon: User },
  { href: '/admin/impostazioni/account/sicurezza', label: 'Sicurezza', icon: Shield },
  { href: '/admin/impostazioni/abbonamento', label: 'Abbonamento', icon: CreditCard },
  { href: '/admin/impostazioni/account/elimina', label: 'Zona pericolosa', icon: TriangleAlert },
];

export function SettingsSidebar() {
  const pathname = usePathname();
  const role = useSubscriptionStore((s) => s.role);
  const canManage = canManageSalon(role);

  const groups: Group[] = [
    { title: 'Preferenze', items: PREFERENZE_ITEMS },
    { title: 'Salone', items: SALONE_ITEMS, hint: 'Solo titolari', gated: !canManage },
    { title: 'Account', items: ACCOUNT_ITEMS, hint: 'Tuo accesso' },
  ];

  return (
    <nav className="w-52 shrink-0 sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto">
      <ul className="flex flex-col gap-5">
        {groups
          .filter((g) => !g.gated)
          .map((group) => (
            <li key={group.title}>
              <p className="px-3 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {group.title}
                {group.hint && (
                  <span className="ml-1.5 normal-case tracking-normal text-zinc-400 dark:text-zinc-500/80 font-normal">
                    · {group.hint}
                  </span>
                )}
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
