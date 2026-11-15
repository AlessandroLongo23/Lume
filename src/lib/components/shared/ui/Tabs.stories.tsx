import { useState } from 'react';
import { CalendarDays, Receipt, Scissors, Users } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { TabBar, TabButton } from './Tabs';

const meta: Meta<typeof TabBar> = {
  title: 'Navigazione/Tabs',
  component: TabBar,
  args: { label: 'Sezioni del cliente' },
  argTypes: {
    children: { control: false },
    className: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Page-level tabs: `TabBar` holds a row of `TabButton`s. The selected tab sits on a neutral pill that glides to the next one, and hover previews with a fainter fill. `count` on a `TabButton` adds a `NumberBadge` after the label, stronger on the selected tab. Use it to switch sections of one page; for navigation between pages use `SectionNav`.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof TabBar>;

function Bar({ label, tabs, initial = 0 }: { label: string; tabs: string[]; initial?: number }) {
  const [active, setActive] = useState(initial);
  return (
    <TabBar label={label}>
      {tabs.map((t, i) => (
        <TabButton key={t} active={active === i} onClick={() => setActive(i)}>
          {t}
        </TabButton>
      ))}
    </TabBar>
  );
}

export const Playground: Story = {
  render: (args) => <Bar label={args.label} tabs={['Panoramica', 'Storico fiche', 'Scheda tecnica', 'Note']} />,
};

export const WithIcons: Story = {
  render: (args) => {
    const tabs = [
      { label: 'Clienti', icon: Users },
      { label: 'Servizi', icon: Scissors },
      { label: 'Appuntamenti', icon: CalendarDays },
      { label: 'Fiches', icon: Receipt },
    ];
    function IconBar() {
      const [active, setActive] = useState('Servizi');
      return (
        <TabBar label={args.label}>
          {tabs.map(({ label, icon: Icon }) => (
            <TabButton key={label} active={active === label} onClick={() => setActive(label)}>
              <Icon aria-hidden />
              {label}
            </TabButton>
          ))}
        </TabBar>
      );
    }
    return <IconBar />;
  },
};

export const WithCounts: Story = {
  render: (args) => {
    function CountBar() {
      const [active, setActive] = useState('attivi');
      return (
        <TabBar label={args.label}>
          <TabButton active={active === 'attivi'} count={1248} onClick={() => setActive('attivi')}>
            Attivi
          </TabButton>
          <TabButton active={active === 'archiviati'} count={37} onClick={() => setActive('archiviati')}>
            Archiviati
          </TabButton>
          <TabButton active={active === 'turisti'} count={12} onClick={() => setActive('turisti')}>
            Turisti
          </TabButton>
        </TabBar>
      );
    }
    return <CountBar />;
  },
};

export const Overflow: Story = {
  name: 'Overflow (scroll orizzontale)',
  render: (args) => (
    <div className="w-[320px]">
      <Bar
        label={args.label}
        initial={2}
        tabs={['Anagrafica', 'Orari', 'Chiusure', 'Calendario', 'Magazzino', 'Fatturazione', 'Notifiche email']}
      />
    </div>
  ),
};
