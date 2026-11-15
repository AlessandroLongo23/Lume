import { useEffect, useRef } from 'react';
import type { Meta, StoryObj } from '@docs/csf';
import { StatusDot } from './StatusDot';
import { HoverPopover } from './HoverPopover';

const CARD = (
  <span className="flex flex-col gap-1">
    <span className="text-sm font-medium">Giulia Rossi</span>
    <span className="text-sm text-[var(--lume-text-secondary)]">Ultima visita: 12 ottobre 2026</span>
    <span className="text-sm text-[var(--lume-text-secondary)]">Servizio preferito: Colore</span>
    <span className="tabular-nums text-xs text-[var(--lume-text-muted)]">14 visite · 612,50 €</span>
  </span>
);

const TRIGGER = <span className="text-sm font-medium text-[var(--lume-text)] underline decoration-dotted underline-offset-4">Giulia Rossi</span>;

const meta: Meta<typeof HoverPopover> = {
  title: 'Sovrapposizioni/HoverPopover',
  component: HoverPopover,
  args: { trigger: TRIGGER, content: CARD },
  argTypes: {
    trigger: { control: false },
    content: { control: false },
    onTriggerClick: { control: false },
    triggerClassName: { control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A small card that opens while the pointer rests on its trigger and stays open while the pointer moves into it, for a quick preview (a client, an appointment, a stock level). It opens below the trigger, aligned to its start, and keeps itself inside the viewport. Hover the trigger to open it.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof HoverPopover>;

export const Playground: Story = {};

/** Opens on load: the story sends the trigger a pointer-over event once mounted. */
function OpenOnLoad(props: React.ComponentProps<typeof HoverPopover>) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = setTimeout(() => {
      const target = ref.current?.querySelector('span > span');
      target?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, relatedTarget: document.body }));
    }, 50);
    return () => clearTimeout(id);
  }, []);
  return (
    <div ref={ref} className="h-[260px] w-[360px] flex items-center justify-center">
      <HoverPopover {...props} />
    </div>
  );
}

export const Open: Story = { render: (args) => <OpenOnLoad {...args} /> };

export const StockPreview: Story = {
  args: {
    trigger: <StatusDot tone="warning">Scorte basse</StatusDot>,
    content: (
      <span className="flex flex-col gap-1">
        <span className="text-sm font-medium">Shampoo ristrutturante 1000 ml</span>
        <span className="text-sm text-[var(--lume-text-secondary)]">Rimangono 2 pezzi, soglia minima 5</span>
      </span>
    ),
  },
  render: (args) => <OpenOnLoad {...args} />,
};
