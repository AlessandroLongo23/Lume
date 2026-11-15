import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import type { Meta, StoryObj } from '@docs/csf';
import { formatCurrency } from '@/lib/utils/format';
import { AXIS_TICK, CURSOR_FILL, GRID_STROKE, SERIES_PRIMARY, SERIES_SECONDARY, compactEuro } from './chartTheme';
import { makeRechartsTooltip } from './RechartsTooltip';

const MESI = [
  { mese: 'Lug', entrate: 9520, uscite: 4180 },
  { mese: 'Ago', entrate: 4690, uscite: 3120 },
  { mese: 'Set', entrate: 8650, uscite: 4050 },
  { mese: 'Ott', entrate: 9160, uscite: 4320 },
  { mese: 'Nov', entrate: 9230, uscite: 4410 },
  { mese: 'Dic', entrate: 13800, uscite: 5260 },
];

const singleTooltip = makeRechartsTooltip((v) => [formatCurrency(Number(v)), 'Incasso']);
const pairTooltip = makeRechartsTooltip((v, name) => [formatCurrency(Number(v)), name === 'entrate' ? 'Entrate' : 'Uscite']);

interface DemoProps {
  /** Show Entrate and Uscite side by side: the tooltip adds a colour dot per row. */
  twoSeries: boolean;
  /** The month whose tooltip is open on load (0–5). */
  index: number;
}

// The tooltip only exists inside a Recharts chart, so the story draws one
// with the tooltip pinned open on a month.
function TooltipDemo({ twoSeries, index }: DemoProps) {
  return (
    <section className="surface-card w-[640px] p-5">
      <BarChart width={600} height={280} data={MESI} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID_STROKE} />
        <XAxis dataKey="mese" axisLine={false} tickLine={false} tick={AXIS_TICK} />
        <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} tickFormatter={compactEuro} width={56} />
        <Tooltip
          key={`${twoSeries}-${index}`}
          content={twoSeries ? pairTooltip : singleTooltip}
          cursor={CURSOR_FILL}
          defaultIndex={index}
          isAnimationActive={false}
        />
        <Bar dataKey="entrate" fill={SERIES_PRIMARY} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
        {twoSeries && <Bar dataKey="uscite" fill={SERIES_SECONDARY} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />}
      </BarChart>
    </section>
  );
}

const meta: Meta<typeof TooltipDemo> = {
  title: 'Dati/RechartsTooltip',
  component: TooltipDemo,
  args: { twoSeries: false, index: 3 },
  argTypes: {
    twoSeries: { control: 'boolean' },
    index: { control: 'number' },
  },
  parameters: {
    docs: {
      description: {
        component:
          '`makeRechartsTooltip(formatter)` builds the tooltip content for every Recharts chart in Lume: a `surface-float` box with the label, then one row per series with its formatted value in mono figures. With two or more series each row gets a colour dot. Pass it as `<Tooltip content={…} />`; the canvas pins it open on one month.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof TooltipDemo>;

export const Playground: Story = {};

export const TwoSeries: Story = { args: { twoSeries: true, index: 5 } };

export const FirstMonth: Story = { args: { index: 0 } };
