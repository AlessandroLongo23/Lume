import type { Meta, StoryObj } from '@docs/csf';
import { DetailSection } from './DetailSection';
import { StatusDot } from '../StatusDot';

const meta: Meta<typeof DetailSection> = {
  title: 'Layout/DetailSection',
  component: DetailSection,
  args: { label: 'Note', index: 0 },
  argTypes: {
    children: { control: false },
    index: { control: 'number' },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A titled block on a detail page: a small secondary label, then the content. `index` staggers the entrance so stacked sections arrive one after another.',
      },
    },
  },
  render: (args) => (
    <div className="max-w-[640px]">
      <DetailSection {...args}>
        <p className="text-sm text-[var(--lume-text)] leading-relaxed max-w-prose">
          Preferisce appuntamenti il sabato mattina. Cute sensibile: usare lo shampoo delicato. Colore abituale 6.3 biondo
          scuro dorato, posa 35 minuti.
        </p>
      </DetailSection>
    </div>
  ),
};
export default meta;

type Story = StoryObj<typeof DetailSection>;

export const Playground: Story = {};

export const WithList: Story = {
  name: 'Con un elenco',
  args: { label: 'Coupon e gift card' },
  render: (args) => (
    <div className="max-w-[640px]">
      <DetailSection {...args}>
        <ul className="divide-y divide-line border-y border-line">
          <li className="py-3 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-[var(--lume-text)]">Gift card · 50,00 €</span>
            <StatusDot tone="success" className="text-xs">attivo</StatusDot>
          </li>
          <li className="py-3 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-[var(--lume-text)]">Coupon · 10%</span>
            <StatusDot tone="warning" className="text-xs">esaurito</StatusDot>
          </li>
        </ul>
      </DetailSection>
    </div>
  ),
};

export const Empty: Story = {
  name: 'Vuota',
  render: (args) => (
    <div className="max-w-[640px]">
      <DetailSection {...args}>
        <p className="text-sm text-[var(--lume-text-muted)]">Nessuna nota</p>
      </DetailSection>
    </div>
  ),
};

export const Stacked: Story = {
  name: 'Sezioni in colonna',
  render: () => (
    <div className="max-w-[640px] flex flex-col gap-12">
      <DetailSection index={0} label="Prenotazioni online">
        <p className="text-sm text-[var(--lume-text-secondary)]">Questo cliente può prenotare online dalla vetrina pubblica.</p>
      </DetailSection>
      <DetailSection index={1} label="Scheda tecnica">
        <p className="text-sm text-[var(--lume-text)]">Colore 6.3 + ossigeno 20 vol, posa 35 minuti (18 ottobre 2026, Sara)</p>
      </DetailSection>
      <DetailSection index={2} label="Note">
        <p className="text-sm text-[var(--lume-text-muted)]">Nessuna nota</p>
      </DetailSection>
    </div>
  ),
};
