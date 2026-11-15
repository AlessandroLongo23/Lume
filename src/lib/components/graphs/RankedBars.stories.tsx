import type { Meta, StoryObj } from '@docs/csf';
import { RankedBars } from './RankedBars';

const TOP_SERVIZI = [
  { name: 'Colore', incasso: 3960 },
  { name: 'Taglio donna', incasso: 3420 },
  { name: 'Piega', incasso: 2150 },
  { name: 'Meches', incasso: 1780 },
  { name: 'Taglio uomo', incasso: 1400 },
  { name: 'Trattamento ristrutturante', incasso: 890 },
  { name: 'Barba', incasso: 640 },
];

const meta: Meta<typeof RankedBars> = {
  title: 'Dati/RankedBars',
  component: RankedBars,
  args: { data: TOP_SERVIZI, emptyText: 'Nessun servizio nel periodo.' },
  argTypes: {
    data: { control: 'object' },
    emptyText: { control: 'text' },
  },
  render: (args) => (
    <section className="surface-card w-[640px]">
      <h3 className="px-5 pt-4 pb-3 text-sm font-medium text-[var(--lume-text)]">Servizi più richiesti</h3>
      <RankedBars {...args} />
    </section>
  ),
  parameters: {
    docs: {
      description: {
        component:
          'Horizontal bars for a top-N ranking by revenue ("incasso"). One series, so one colour: length and order tell the rank. Used in Statistiche for the top services and top products; the height grows with the number of rows.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof RankedBars>;

export const Playground: Story = {};

export const TopProdotti: Story = {
  name: 'Top products',
  args: {
    data: [
      { name: 'Shampoo nutriente 250 ml', incasso: 612 },
      { name: 'Maschera ristrutturante', incasso: 488.5 },
      { name: 'Olio di argan', incasso: 356 },
      { name: 'Lacca tenuta forte', incasso: 214 },
      { name: 'Cera opaca uomo', incasso: 129 },
    ],
  },
};

export const FewRows: Story = {
  args: {
    data: [
      { name: 'Taglio donna', incasso: 420 },
      { name: 'Piega', incasso: 175 },
    ],
  },
};

export const Empty: Story = { args: { data: [] } };
