import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@docs/csf';
import { formatCurrency } from '@/lib/utils/format';
import { Slider } from './slider';

type SliderProps = ComponentProps<typeof Slider>;

// Controlled wrappers, as Bilancio uses the slider: the value lives in state
// and is printed beside the label.
function TaxRate(args: SliderProps) {
  const [aliquota, setAliquota] = useState(23);
  return (
    <div className="w-[360px] space-y-3">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-[var(--lume-text-secondary)]">Aliquota stimata</span>
        <span className="tabular-nums text-[var(--lume-text)]">{aliquota}%</span>
      </div>
      <Slider {...args} value={[aliquota]} onValueChange={(v) => setAliquota(Array.isArray(v) ? v[0] : v)} />
    </div>
  );
}

function PriceRange(args: SliderProps) {
  const [fascia, setFascia] = useState([20, 80]);
  return (
    <div className="w-[360px] space-y-3">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-[var(--lume-text-secondary)]">Prezzo del servizio</span>
        <span className="tabular-nums text-[var(--lume-text)]">
          {formatCurrency(fascia[0])} – {formatCurrency(fascia[1])}
        </span>
      </div>
      <Slider
        {...args}
        min={0}
        max={150}
        step={5}
        aria-label="Prezzo del servizio"
        value={fascia}
        onValueChange={(v) => setFascia(Array.isArray(v) ? [...v] : [v, v])}
      />
    </div>
  );
}

const meta: Meta<typeof Slider> = {
  title: 'Moduli/Slider (base)',
  component: Slider,
  args: { min: 0, max: 60, step: 1, disabled: false, 'aria-label': 'Aliquota stimata' },
  argTypes: {
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    disabled: { control: 'boolean' },
    value: { control: false },
    defaultValue: { control: false },
    onValueChange: { control: false },
    onValueCommitted: { control: false },
  },
  render: (args) => <TaxRate {...args} />,
  parameters: {
    docs: {
      description: {
        component:
          'The shadcn slider on Base UI, restyled with Lume tokens: a thin track filled in the text colour and a raised thumb. Bilancio uses it for the estimated tax rate (`TaxSimulatorCard`) and the buffer for unexpected costs (`BilancioObiettiviTab`). Lume has no slider of its own, so this is the one to use.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Slider>;

export const Playground: Story = {};

export const Range: Story = {
  name: 'Range (two thumbs)',
  render: (args) => <PriceRange {...args} />,
};

export const Disabled: Story = { args: { disabled: true } };

export const Vertical: Story = {
  render: (args) => (
    <div className="h-[200px]">
      <Slider {...args} orientation="vertical" defaultValue={[40]} aria-label="Margine per gli imprevisti" />
    </div>
  ),
};
