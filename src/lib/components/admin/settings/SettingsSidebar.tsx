'use client';

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
  FileText,
  ClipboardList,
  Globe,
  CalendarOff,
} from 'lucide-react';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { canManageSalon, isSalonStaff } from '@/lib/auth/roles';
import { SectionNav, SectionNavGroup, SectionNavLink } from '@/lib/components/shared/ui/nav/SectionNav';

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
  { href: '/admin/impostazioni/salone/prenotazioni', label: 'Prenotazioni online', icon: Globe },
  { href: '/admin/impostazioni/salone/chiusure', label: 'Chiusure', icon: CalendarOff },
  { href: '/admin/impostazioni/salone/magazzino', label: 'Magazzino', icon: Warehouse },
  { href: '/admin/impostazioni/salone/default-form', label: 'Default form', icon: Sliders },
  { href: '/admin/impostazioni/salone/notifiche-email', label: 'Notifiche email', icon: Mail },
  { href: '/admin/impostazioni/salone/fatturazione', label: 'Fatturazione', icon: Receipt },
];

const LEGALE_ITEMS: Item[] = [
  { href: '/admin/impostazioni/legale/deliberatorie', label: 'Deliberatorie', icon: FileText },
  { href: '/admin/impostazioni/legale/registro-trattamenti', label: 'Registro trattamenti', icon: ClipboardList },
];

const ACCOUNT_ITEMS_BASE: Item[] = [
  { href: '/admin/impostazioni/profilo', label: 'Profilo', icon: User },
  { href: '/admin/impostazioni/account/sicurezza', label: 'Sicurezza', icon: Shield },
  { href: '/admin/impostazioni/abbonamento', label: 'Abbonamento', icon: CreditCard },
  { href: '/admin/impostazioni/account/elimina', label: 'Zona pericolosa', icon: TriangleAlert },
];

const WORKING_HOURS_ITEM: Item = {
  href: '/admin/impostazioni/orari-lavoro',
  label: 'Orari di lavoro',
  icon: Clock,
};

export function SettingsSidebar() {
  const pathname = usePathname();
  const role = useSubscriptionStore((s) => s.role);
  const canManage = canManageSalon(role);

  // Anyone who is also bookable as an operator (owner / admin / operator) sees
  // "Orari di lavoro" in their account section. The panel itself decides whether
  // it renders editable (owner / admin) or read-only (operator).
  const accountItems: Item[] = isSalonStaff(role)
    ? [ACCOUNT_ITEMS_BASE[0], WORKING_HOURS_ITEM, ...ACCOUNT_ITEMS_BASE.slice(1)]
    : ACCOUNT_ITEMS_BASE;

  const groups: Group[] = [
    { title: 'Preferenze', items: PREFERENZE_ITEMS },
    { title: 'Salone', items: SALONE_ITEMS, hint: 'Solo titolari', gated: !canManage },
    { title: 'Legale', items: LEGALE_ITEMS, hint: 'Modulistica clienti', gated: !canManage },
    { title: 'Account', items: accountItems, hint: 'Tuo accesso' },
  ];

  return (
    <div className="w-full min-w-0 md:w-52 md:shrink-0 md:sticky md:top-16 md:max-h-[calc(100vh-5rem)] md:overflow-y-auto">
      <SectionNav id="settings-nav" label="Sezioni delle impostazioni">
        {groups
          .filter((g) => !g.gated)
          .map((group) => (
            <SectionNavGroup key={group.title} title={group.title} hint={group.hint}>
              {group.items.map(({ href, label, icon }) => (
                <SectionNavLink
                  key={href}
                  href={href}
                  label={label}
                  icon={icon}
                  active={pathname === href || pathname.startsWith(href + '/')}
                />
              ))}
            </SectionNavGroup>
          ))}
      </SectionNav>
    </div>
  );
}
