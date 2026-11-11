import { useState } from 'react';
import { Monitor, Moon, Sun, CalendarDays, CalendarRange, List } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { OptionGroup, type Option } from './OptionGroup';

type Theme = 'light' | 'dark' | 'system';
const themes: Option<Theme>[] = [
  { value: 'light', label: 'Chiaro', icon: Sun },
  { value: 'dark', label: 'Scuro', icon: Moon },
  { value: 'system', label: 'Come il sistema', icon: Monitor },
];

type View = 'day' | 'week' | 'list';
const views: Option<View>[] = [
  { value: 'day', label: 'Giorno', icon: CalendarDays, hint: 'Una colonna per operatore' },
  { value: 'week', label: 'Settimana', icon: CalendarRange, hint: 'Sette giorni, un operatore alla volta' },
  { value: 'list', label: 'Elenco', icon: List, hint: 'Gli appuntamenti in ordine di orario' },
];

const meta: Meta<typeof OptionGroup<Theme>> = {
  title: 'Moduli/OptionGroup',
  component: OptionGroup,
  args: { ariaLabel: 'Tema' },
  argTypes: {
    value: { control: false },
    options: { control: false },
    onChange: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A row of two to four mutually exclusive choices with an icon, for settings pages. The chosen one gets a neutral fill; an optional `hint` per option appears as a tooltip. For a compact segmented switch use `ToggleButton`.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof OptionGroup<Theme>>;

export const Playground: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<Theme>('system');
    return <OptionGroup {...args} options={themes} value={value} onChange={setValue} />;
  },
};

export const WithHints: Story = {
  render: function Render() {
    const [value, setValue] = useState<View>('day');
    return <OptionGroup ariaLabel="Vista predefinita del calendario" options={views} value={value} onChange={setValue} />;
  },
};

export const Wrapping: Story = {
  render: function Render() {
    const [value, setValue] = useState<View>('week');
    return (
      <div className="w-[260px]">
        <OptionGroup ariaLabel="Vista predefinita del calendario" options={views} value={value} onChange={setValue} />
      </div>
    );
  },
};
