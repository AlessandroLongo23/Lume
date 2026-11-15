import type { Meta, StoryObj } from '@docs/csf';
import { StatRow, Stat, SeriesDot, Trend } from './StatRow';

const meta: Meta<typeof StatRow> = {
  title: 'Dati/StatRow',
  component: StatRow,
  args: { className: 'sm:grid-cols-4' },
  argTypes: { children: { control: false }, className: { control: 'text' } },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Headline figures as a row of big light numbers, each with a small label under it, divided by hairlines. `StatRow` is two columns by default; widen it with `className` (e.g. `sm:grid-cols-4`). `Stat` takes a `marker` (`SeriesDot` to tie a figure to a chart series) and secondary lines such as a `Trend`.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof StatRow>;

export const Playground: Story = {
  render: (args) => (
    <StatRow {...args}>
      <Stat label="Incasso" value="12.480,00 €" />
      <Stat label="Fiches" value="214" />
      <Stat label="Scontrino medio" value="58,32 €" />
      <Stat label="Nuovi clienti" value="23" />
    </StatRow>
  ),
};

export const WithTrend: Story = {
  name: 'Con andamento',
  render: (args) => (
    <StatRow {...args}>
      <Stat label="Incasso" value="12.480,00 €">
        <span>IVA inclusa 15.225,60 €</span>
        <Trend value={8.4} suffix="vs ottobre 2025" />
      </Stat>
      <Stat label="Fiches" value="214">
        <Trend value={-3.2} suffix="vs ottobre 2025" />
      </Stat>
      <Stat label="Scontrino medio" value="58,32 €">
        <Trend value={12} suffix="vs ottobre 2025" />
      </Stat>
      <Stat label="Disdette" value="9">
        <Trend value={28.5} higherIsWorse suffix="vs ottobre 2025" />
      </Stat>
    </StatRow>
  ),
};

export const WithSeriesDots: Story = {
  name: 'Con punti serie',
  args: { className: 'sm:grid-cols-3' },
  render: (args) => (
    <StatRow {...args}>
      <Stat label="Servizi" value="9.860,00 €" marker={<SeriesDot color="var(--lume-accent)" />} />
      <Stat label="Prodotti" value="2.140,00 €" marker={<SeriesDot color="var(--lume-success-fg)" />} />
      <Stat label="Gift card" value="480,00 €" marker={<SeriesDot color="var(--lume-warning-fg)" />} />
    </StatRow>
  ),
};

export const Negative: Story = {
  name: 'Valore negativo',
  args: { className: '' },
  render: (args) => (
    <StatRow {...args}>
      <Stat label="Entrate" value="12.480,00 €" />
      <Stat label="Saldo" value="−1.320,00 €" negative>
        <Trend value={-14.6} />
      </Stat>
    </StatRow>
  ),
};

export const Trends: Story = {
  name: 'Trend, da soli',
  render: () => (
    <div className="flex flex-col gap-2 text-xs text-[var(--lume-text-muted)]">
      <Trend value={8.4} suffix="vs mese scorso" />
      <Trend value={-3.2} suffix="vs mese scorso" />
      <Trend value={28.5} higherIsWorse suffix="disdette" />
      <Trend value={-10} higherIsWorse suffix="disdette" />
    </div>
  ),
};
