import { useEffect, useRef, useState, type ReactNode } from 'react';
import { addDays, format } from 'date-fns';
import type { Meta, StoryObj } from '@docs/csf';
import { DateField } from './DateField';
import { Field } from './Field';

const today = format(new Date(), 'yyyy-MM-dd');

/** Opens the calendar once after mount. */
function OpenOnMount({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => ref.current?.querySelector<HTMLElement>('button[aria-label="Apri il calendario"]')?.click(), 80);
    return () => clearTimeout(t);
  }, []);
  return <div ref={ref}>{children}</div>;
}

const meta: Meta<typeof DateField> = {
  title: 'Moduli/DateField',
  component: DateField,
  args: { size: 'md', disabled: false, 'aria-label': 'Data' },
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md'] },
    min: { control: 'text' },
    max: { control: 'text' },
    value: { control: false },
    onChange: { control: false },
    onEnter: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A date typed in the Italian order (gg/mm/aaaa) on every browser, with a calendar to pick from. It accepts `1.6.21`, `01062021` and similar; the value is `yyyy-MM-dd`, or empty while the text is not a date yet.',
      },
    },
  },
  decorators: [(Story) => <div className="w-[300px] min-h-[400px]"><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof DateField>;

export const Playground: Story = {
  render: function Render(args) {
    const [value, setValue] = useState('1990-03-14');
    return (
      <div className="flex flex-col gap-2">
        <DateField {...args} value={value} onChange={setValue} />
        <p className="text-xs text-[var(--lume-text-muted)] tabular-nums">value: {value || '—'}</p>
      </div>
    );
  },
};

export const Empty: Story = {
  render: function Render() {
    const [value, setValue] = useState('');
    return (
      <Field label="Data di nascita" hint="Per gli auguri e i coupon di compleanno.">
        {({ id }) => <DateField id={id} value={value} onChange={setValue} />}
      </Field>
    );
  },
};

export const CalendarOpen: Story = {
  render: function Render() {
    const [value, setValue] = useState(today);
    return (
      <OpenOnMount>
        <DateField aria-label="Data appuntamento" value={value} onChange={setValue} />
      </OpenOnMount>
    );
  },
};

export const WithRange: Story = {
  render: function Render() {
    const [value, setValue] = useState(today);
    return (
      <OpenOnMount>
        <Field label="Data appuntamento" hint="Solo nei prossimi 14 giorni.">
          {({ id }) => <DateField id={id} value={value} onChange={setValue} min={today} max={format(addDays(new Date(), 14), 'yyyy-MM-dd')} />}
        </Field>
      </OpenOnMount>
    );
  },
};

export const Small: Story = {
  render: function Render() {
    const [value, setValue] = useState('2026-10-01');
    return <DateField size="sm" aria-label="Dal" value={value} onChange={setValue} />;
  },
};

export const Disabled: Story = {
  args: { disabled: true, value: '2026-09-12', onChange: () => {} },
};
