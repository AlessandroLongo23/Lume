import { useState, type MouseEvent } from 'react';
import { Bell, Building2, CalendarDays, Clock, CreditCard, Palette, Shield, User, Warehouse } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { SectionNav, SectionNavGroup, SectionNavLink } from './SectionNav';

const meta: Meta<typeof SectionNav> = {
  title: 'Navigazione/SectionNav',
  component: SectionNav,
  args: { id: 'impostazioni-nav', label: 'Impostazioni' },
  argTypes: { children: { control: false } },
  parameters: {
    docs: {
      description: {
        component:
          'Secondary navigation of a section (settings, statistics): `SectionNavGroup`s of `SectionNavLink`s, where one neutral fill marks the current page and glides to the next. A column from md up, one scrolling row on phones. Pass `active` from the current pathname.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof SectionNav>;

const account = [
  { href: '/admin/impostazioni/profilo', label: 'Profilo', icon: User },
  { href: '/admin/impostazioni/account/sicurezza', label: 'Sicurezza', icon: Shield },
  { href: '/admin/impostazioni/notifiche', label: 'Notifiche', icon: Bell },
  { href: '/admin/impostazioni/personalizzazione', label: 'Personalizzazione', icon: Palette },
];
const salone = [
  { href: '/admin/impostazioni/salone/anagrafica', label: 'Anagrafica', icon: Building2 },
  { href: '/admin/impostazioni/salone/orari', label: 'Orari di apertura', icon: Clock },
  { href: '/admin/impostazioni/salone/calendario', label: 'Calendario', icon: CalendarDays },
  { href: '/admin/impostazioni/salone/magazzino', label: 'Magazzino', icon: Warehouse },
  { href: '/admin/impostazioni/salone/fatturazione', label: 'Fatturazione', icon: CreditCard },
];

/** Clicking a link switches the active page in place instead of navigating the canvas. */
function SettingsNav({ id, label, initial }: { id: string; label: string; initial: string }) {
  const [active, setActive] = useState(initial);
  const onClickCapture = (e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest('a');
    if (!a) return;
    e.preventDefault();
    setActive(a.getAttribute('href') ?? initial);
  };
  return (
    <div className="w-[240px]" onClickCapture={onClickCapture}>
      <SectionNav id={id} label={label}>
        <SectionNavGroup title="Account">
          {account.map((l) => (
            <SectionNavLink key={l.href} {...l} active={active === l.href} />
          ))}
        </SectionNavGroup>
        <SectionNavGroup title="Salone" hint="solo titolare">
          {salone.map((l) => (
            <SectionNavLink key={l.href} {...l} active={active === l.href} />
          ))}
        </SectionNavGroup>
      </SectionNav>
    </div>
  );
}

export const Playground: Story = {
  render: (args) => <SettingsNav id={args.id} label={args.label} initial="/admin/impostazioni/salone/orari" />,
};

export const SingleGroup: Story = {
  name: 'Un solo gruppo, senza titolo',
  render: (args) => (
    <div className="w-[240px]">
      <SectionNav id={args.id} label="Statistiche">
        <SectionNavGroup>
          <SectionNavLink href="/admin" label="Panoramica" icon={CalendarDays} active />
          <SectionNavLink href="/admin/bilancio" label="Bilancio" icon={CreditCard} active={false} />
          <SectionNavLink href="/admin/clienti" label="Clienti" icon={User} active={false} />
        </SectionNavGroup>
      </SectionNav>
    </div>
  ),
};

export const LongLabels: Story = {
  name: 'Etichette lunghe (troncate)',
  render: (args) => (
    <div className="w-[200px]">
      <SectionNav id={args.id} label={args.label}>
        <SectionNavGroup title="Legale">
          <SectionNavLink href="/admin" label="Registro dei trattamenti dei dati personali" icon={Shield} active />
          <SectionNavLink href="/admin/x" label="Deliberatorie e consensi informati" icon={Building2} active={false} />
        </SectionNavGroup>
      </SectionNav>
    </div>
  ),
};
