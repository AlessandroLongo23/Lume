import { useState } from 'react';
import type { Meta, StoryObj } from '@docs/csf';
import { Button } from './Button';
import { StatusDot } from './StatusDot';
import { SidePanel } from './SidePanel';

const meta: Meta<typeof SidePanel> = {
  title: 'Sovrapposizioni/SidePanel',
  component: SidePanel,
  args: { isOpen: true, title: 'Giulia Rossi' },
  argTypes: {
    isOpen: { control: 'boolean' },
    title: { control: 'text' },
    onClose: { control: false },
    children: { control: false },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A sheet that slides in from the right edge over a dimmed page, for details or a secondary form that should keep the page in view. It closes on Escape, on a click on the backdrop and from its close button.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof SidePanel>;

function ClientDetails() {
  return (
    <div className="flex flex-col gap-5 text-sm">
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
        <dt className="text-[var(--lume-text-muted)]">Telefono</dt>
        <dd className="tabular-nums">+39 333 123 4567</dd>
        <dt className="text-[var(--lume-text-muted)]">Email</dt>
        <dd>giulia.rossi@email.it</dd>
        <dt className="text-[var(--lume-text-muted)]">Stato</dt>
        <dd><StatusDot tone="success">Attiva</StatusDot></dd>
      </dl>
      <div className="flex flex-col gap-2">
        <h3 className="font-medium">Ultime visite</h3>
        {[
          ['12 ottobre 2026', 'Colore e piega', '75,00 €'],
          ['14 settembre 2026', 'Taglio donna', '35,00 €'],
          ['2 agosto 2026', 'Piega', '20,00 €'],
        ].map(([d, s, p]) => (
          <div key={d} className="flex justify-between gap-4 surface-card px-3 py-2">
            <span>
              <span className="block">{s}</span>
              <span className="block text-xs text-[var(--lume-text-muted)]">{d} · con Sara</span>
            </span>
            <span className="tabular-nums">{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Page({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="min-h-[600px] p-8 flex flex-col gap-3">
      <h1 className="text-xl font-medium tracking-tight text-[var(--lume-text)]">Clienti</h1>
      <div><Button onClick={onOpen}>Apri scheda cliente</Button></div>
    </div>
  );
}

export const Playground: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(args.isOpen);
    return (
      <>
        <Page onOpen={() => setOpen(true)} />
        <SidePanel {...args} isOpen={open} onClose={() => setOpen(false)}>
          <ClientDetails />
        </SidePanel>
      </>
    );
  },
};

export const WithTrigger: Story = { ...Playground, args: { isOpen: false } };


export const LongContent: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(args.isOpen);
    return (
      <>
        <Page onOpen={() => setOpen(true)} />
        <SidePanel {...args} isOpen={open} onClose={() => setOpen(false)} title="Storico attività di Giulia Rossi, ultimi dodici mesi">
          <div className="flex flex-col gap-2 text-sm">
            {Array.from({ length: 30 }, (_, i) => (
              <div key={i} className="surface-card px-3 py-2">Visita n. {30 - i} · Taglio donna · 35,00 €</div>
            ))}
          </div>
        </SidePanel>
      </>
    );
  },
};
