import { useState } from 'react';
import type { Meta, StoryObj } from '@docs/csf';
import { NumberInput } from './NumberInput';
import { Field } from './Field';

const meta: Meta<typeof NumberInput> = {
  title: 'Moduli/NumberInput',
  component: NumberInput,
  args: { size: 'md', step: 1, decimals: 0, hideSteppers: false, disabled: false, placeholder: '0', 'aria-label': 'Quantità' },
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md'] },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    decimals: { control: 'number' },
    suffix: { control: 'text' },
    value: { control: false },
    onChange: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A number on the field surface with up/down steppers, `min` / `max` clamping and an optional suffix. Accepts a comma as decimal separator; set `decimals` for prices and `hideSteppers` where stepping makes no sense.',
      },
    },
  },
  decorators: [(Story) => <div className="w-[240px]"><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof NumberInput>;

export const Playground: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<number | null>(2);
    return <NumberInput {...args} value={value} onChange={setValue} />;
  },
};

export const Duration: Story = {
  render: function Render() {
    const [value, setValue] = useState<number | null>(45);
    return (
      <Field label="Durata">
        {({ id, describedBy }) => <NumberInput id={id} aria-describedby={describedBy} value={value} onChange={setValue} step={5} min={5} max={480} suffix="min" />}
      </Field>
    );
  },
};

export const Price: Story = {
  render: function Render() {
    const [value, setValue] = useState<number | null>(35);
    return (
      <Field label="Prezzo" hint="IVA inclusa.">
        {({ id, describedBy }) => <NumberInput id={id} aria-describedby={describedBy} value={value} onChange={setValue} decimals={2} min={0} suffix="€" hideSteppers placeholder="0,00" />}
      </Field>
    );
  },
};

export const Sizes: Story = {
  render: function Render() {
    const [a, setA] = useState<number | null>(1);
    const [b, setB] = useState<number | null>(2);
    return (
      <div className="flex flex-col gap-3">
        <NumberInput aria-label="Piccolo" size="sm" value={a} onChange={setA} />
        <NumberInput aria-label="Medio" size="md" value={b} onChange={setB} />
      </div>
    );
  },
};

export const WithError: Story = {
  render: function Render() {
    const [value, setValue] = useState<number | null>(null);
    return (
      <Field label="Sconto" error={value === null ? 'Inserisci una percentuale' : undefined}>
        {({ id, describedBy, invalid }) => <NumberInput id={id} aria-describedby={describedBy} aria-invalid={invalid} value={value} onChange={setValue} min={0} max={100} suffix="%" />}
      </Field>
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true, value: 3, onChange: () => {} },
};
