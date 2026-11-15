import { useState } from 'react';
import type { Meta, StoryObj } from '@docs/csf';
import { DateTimeField } from './DateTimeField';
import { Field } from './Field';

const meta: Meta<typeof DateTimeField> = {
  title: 'Moduli/DateTimeField',
  component: DateTimeField,
  args: { 'aria-label': 'Inizio' },
  argTypes: {
    value: { control: false },
    onChange: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A date and a time side by side, in Italian format (dd/MM/yyyy and 24h). Use it in place of the browser `datetime-local`, which shows mm/dd/yyyy on English systems. The value is `yyyy-MM-ddTHH:mm`.',
      },
    },
  },
  decorators: [(Story) => <div className="w-[360px]"><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof DateTimeField>;

export const Playground: Story = {
  render: function Render(args) {
    const [value, setValue] = useState('2026-11-04T15:30');
    return (
      <div className="flex flex-col gap-2">
        <DateTimeField {...args} value={value} onChange={setValue} />
        <p className="text-xs text-[var(--lume-text-muted)] tabular-nums">value: {value || '—'}</p>
      </div>
    );
  },
};

export const InField: Story = {
  render: function Render() {
    const [value, setValue] = useState('2026-11-04T09:00');
    return (
      <Field label="Validità del coupon dal" hint="Il coupon diventa usabile da questo momento.">
        {({ id }) => <DateTimeField id={id} aria-label="Valido dal" value={value} onChange={setValue} />}
      </Field>
    );
  },
};

export const Empty: Story = {
  render: function Render() {
    const [value, setValue] = useState('');
    return <DateTimeField aria-label="Scadenza" value={value} onChange={setValue} />;
  },
};
