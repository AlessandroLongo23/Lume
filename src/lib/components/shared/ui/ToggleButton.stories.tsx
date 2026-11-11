import { useState, type ComponentProps } from 'react';
import { CalendarDays, LayoutGrid, List, TableProperties } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { ToggleButton } from './ToggleButton';

function StatefulToggle(props: ComponentProps<typeof ToggleButton>) {
  const [value, setValue] = useState(props.value);
  return <ToggleButton {...props} value={value} onChange={setValue} />;
}

const meta: Meta<typeof ToggleButton> = {
  title: 'Azioni/ToggleButton',
  component: ToggleButton,
  args: {
    options: ['table', 'grid'],
    labels: ['Tabella', 'Griglia'],
    value: 'table',
    ariaLabel: 'Vista',
  },
  argTypes: {
    options: { control: 'object' },
    labels: { control: 'object' },
    value: { control: 'text' },
    icons: { control: false },
    onChange: { control: false },
  },
  render: (args) => <StatefulToggle {...args} />,
  parameters: {
    docs: {
      description: {
        component:
          'A segmented control for choosing one of 2 to 4 options inline, such as the table or grid view of a list. The selected segment is a neutral pill that glides between options; arrow keys move the selection.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ToggleButton>;

export const Playground: Story = {};

export const WithIcons: Story = {
  args: {
    options: ['table', 'calendar'],
    labels: ['Tabella', 'Calendario'],
    icons: [TableProperties, CalendarDays],
  },
};

export const IconOnly: Story = {
  args: {
    options: ['lista', 'griglia'],
    labels: undefined,
    icons: [List, LayoutGrid],
    value: 'lista',
  },
};

export const ThreeOptions: Story = {
  args: {
    options: ['giorno', 'settimana', 'mese'],
    labels: ['Giorno', 'Settimana', 'Mese'],
    value: 'settimana',
    ariaLabel: 'Periodo',
  },
};

