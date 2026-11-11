import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@docs/csf';
import { formatCurrency } from '@/lib/utils/format';
import { Donut } from './Donut';

// The statistics pages put every chart in a card with a small title.
function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="surface-card w-[560px]">
      <h3 className="px-5 pt-4 pb-3 text-sm font-medium text-[var(--lume-text)]">{title}</h3>
      {children}
    </section>
  );
}

const SERVIZI_PER_CATEGORIA = [
  { name: 'Taglio', value: 4820 },
  { name: 'Colore', value: 3960 },
  { name: 'Piega', value: 2150 },
  { name: 'Trattamenti', value: 890 },
  { name: 'Barba', value: 640 },
  { name: 'Extension', value: 320 },
];

const meta: Meta<typeof Donut> = {
  title: 'Dati/Donut',
  component: Donut,
  args: {
    data: SERVIZI_PER_CATEGORIA,
    format: formatCurrency,
    emptyText: 'Nessun servizio nel periodo.',
  },
  argTypes: {
    data: { control: 'object' },
    order: { control: 'object' },
    emptyText: { control: 'text' },
    format: { control: false },
  },
  render: (args) => (
    <ChartCard title="Servizi per categoria">
      <Donut {...args} />
    </ChartCard>
  ),
  parameters: {
    docs: {
      description: {
        component:
          'A donut with its legend beside it: name, value and share for every slice, so no slice is identified by colour alone. Without `order` the three largest slices get a colour and the rest fold into "Altre"; with `order` (payment methods) each entity keeps its colour across periods. Used in Statistiche for services, products, payment methods and new vs returning clients.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Donut>;

export const Playground: Story = {};

export const FixedOrder: Story = {
  name: 'Fixed order (payment methods)',
  args: {
    data: [
      { name: 'POS', value: 8420.5 },
      { name: 'Contanti', value: 3180 },
      { name: 'Altro', value: 410 },
    ],
    order: ['Contanti', 'POS', 'Altro'],
  },
  render: (args) => (
    <ChartCard title="Metodi di pagamento">
      <Donut {...args} />
    </ChartCard>
  ),
};

export const Counts: Story = {
  name: 'Counts (new vs returning)',
  args: {
    data: [
      { name: 'Clienti abituali', value: 214 },
      { name: 'Nuovi clienti', value: 38 },
    ],
    format: (v: number) => `${v} clienti`,
  },
  render: (args) => (
    <ChartCard title="Nuovi e abituali">
      <Donut {...args} />
    </ChartCard>
  ),
};

export const SingleSlice: Story = {
  args: { data: [{ name: 'Taglio', value: 1250 }] },
};

export const Empty: Story = {
  args: { data: [] },
};
