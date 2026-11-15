import type { Meta, StoryObj } from '@docs/csf';
import { StatTile, ProgressBar } from './StatTile';

const meta: Meta<typeof StatTile> = {
  title: 'Dati/StatTile',
  component: StatTile,
  args: { label: 'Spesa totale', value: '642,00 €', hint: 'Ultimi 12 mesi' },
  argTypes: {
    value: { control: 'text' },
    hint: { control: 'text' },
    accent: { control: 'object' },
    children: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A single figure on a raised card: small label, big mono value, optional `accent` (a toned dot with a word, top right) and `hint` under it. The accent is a `StatusDot`, with the same tones. Put a `ProgressBar` (a ratio, such as stock against its threshold) inside as children; its tone colours only the fill. The product and service detail pages use it; pages with several headline figures side by side use `StatRow` + `Stat`.',
      },
    },
  },
  render: (args) => (
    <div className="w-[320px]">
      <StatTile {...args} />
    </div>
  ),
};
export default meta;

type Story = StoryObj<typeof StatTile>;

export const Playground: Story = {};

export const WithAccent: Story = { name: 'Con accento', args: { accent: { tone: 'success', text: 'Top 20%' } } };

export const WithProgressBar: Story = {
  name: 'Con ProgressBar',
  args: { label: 'Obiettivo di ottobre', value: '12.480 €', hint: '83% di 15.000 €', accent: { tone: 'accent', text: 'In linea' } },
  render: (args) => (
    <div className="w-[320px]">
      <StatTile {...args}>
        <ProgressBar ratio={0.83} tone="accent" />
      </StatTile>
    </div>
  ),
};

export const Grid: Story = {
  name: 'Griglia',
  parameters: { layout: 'padded' },
  render: () => (
    <div className="grid grid-cols-3 gap-4 max-w-[900px]">
      <StatTile label="Prezzo" value="35,00 €" />
      <StatTile label="Margine" value="24,50 €" accent={{ tone: 'success', text: '70%' }} />
      <StatTile label="Scorta shampoo" value="3 pz" accent={{ tone: 'danger', text: 'Sotto soglia' }} hint="Soglia minima 10 pezzi">
        <ProgressBar ratio={0.3} tone="danger" />
      </StatTile>
    </div>
  ),
};

export const Bars: Story = {
  name: 'ProgressBar, tutti i toni',
  render: () => (
    <div className="w-[320px] flex flex-col gap-4">
      <ProgressBar ratio={0.15} tone="danger" />
      <ProgressBar ratio={0.5} tone="warning" />
      <ProgressBar ratio={0.83} tone="accent" />
      <ProgressBar ratio={1.4} tone="success" />
    </div>
  ),
};
