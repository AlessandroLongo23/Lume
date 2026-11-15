import { useState } from 'react';
import { addMonths, format, getDay, startOfMonth, subMonths } from 'date-fns';
import { it } from 'date-fns/locale';
import type { Meta, StoryObj } from '@docs/csf';
import { CalendarPanel } from './CalendarPanel';
import { Button } from '../Button';

const meta: Meta<typeof CalendarPanel> = {
  title: 'Moduli/CalendarPanel',
  component: CalendarPanel,
  args: { size: 'md', monthOnly: false },
  argTypes: {
    size: { control: 'radio', options: ['md', 'lg'] },
    selected: { control: false },
    initialMonth: { control: false },
    minMonth: { control: false },
    maxMonth: { control: false },
    onPickDay: { control: false },
    onPickMonth: { control: false },
    isDisabled: { control: false },
    footer: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The one month calendar in Lume: a day grid whose title steps out to months and then years. Render it inline or inside a floating panel; `DateField` and the agenda date picker are built on it.',
      },
    },
  },
  decorators: [(Story, { args }) => <div className={`surface-card p-3 ${args.size === 'lg' ? 'w-[340px]' : 'w-72'}`}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof CalendarPanel>;

function Picked({ date }: { date: Date | null }) {
  return <p className="mt-2 text-xs text-[var(--lume-text-muted)]">{date ? format(date, 'EEEE d MMMM yyyy', { locale: it }) : 'Nessun giorno scelto'}</p>;
}

export const Playground: Story = {
  render: function Render(args) {
    const [day, setDay] = useState<Date | null>(new Date());
    return (
      <>
        <CalendarPanel {...args} selected={day} onPickDay={setDay} onPickMonth={setDay} />
        <Picked date={day} />
      </>
    );
  },
};

export const WithFooter: Story = {
  render: function Render() {
    const [day, setDay] = useState<Date | null>(null);
    return (
      <CalendarPanel
        selected={day}
        onPickDay={setDay}
        footer={<Button variant="ghost" size="sm" className="w-full" onClick={() => setDay(new Date())}>Oggi</Button>}
      />
    );
  },
};

export const MonthOnly: Story = {
  render: function Render() {
    const [month, setMonth] = useState<Date | null>(startOfMonth(new Date()));
    return (
      <>
        <CalendarPanel monthOnly selected={month} onPickDay={() => {}} onPickMonth={setMonth} />
        <p className="mt-2 text-xs text-[var(--lume-text-muted)]">{month ? format(month, 'MMMM yyyy', { locale: it }) : '—'}</p>
      </>
    );
  },
};

export const ClosedDays: Story = {
  name: 'Disabled days',
  render: function Render() {
    const [day, setDay] = useState<Date | null>(null);
    // Closed on Sunday and Monday, like most salons.
    return (
      <>
        <CalendarPanel selected={day} onPickDay={setDay} isDisabled={(d) => getDay(d) === 0 || getDay(d) === 1} />
        <Picked date={day} />
      </>
    );
  },
};

export const MinMaxMonth: Story = {
  name: 'Min and max month',
  render: function Render() {
    const [day, setDay] = useState<Date | null>(new Date());
    return (
      <>
        <CalendarPanel selected={day} onPickDay={setDay} minMonth={subMonths(new Date(), 1)} maxMonth={addMonths(new Date(), 2)} />
        <p className="mt-2 text-xs text-[var(--lume-text-muted)]">Prenotabile dal mese scorso a fra due mesi.</p>
      </>
    );
  },
};

export const Large: Story = {
  args: { size: 'lg' },
  render: function Render(args) {
    const [day, setDay] = useState<Date | null>(new Date());
    return <CalendarPanel {...args} selected={day} onPickDay={setDay} />;
  },
};
