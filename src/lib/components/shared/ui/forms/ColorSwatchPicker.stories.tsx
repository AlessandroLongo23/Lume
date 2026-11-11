import { useState } from 'react';
import type { Meta, StoryObj } from '@docs/csf';
import { ColorSwatchPicker } from './ColorSwatchPicker';

const meta: Meta<typeof ColorSwatchPicker> = {
  title: 'Moduli/ColorSwatchPicker',
  component: ColorSwatchPicker,
  args: { allowAuto: false, columns: 4, ariaLabel: 'Colore' },
  argTypes: {
    columns: { control: 'number' },
    hint: { control: 'text' },
    value: { control: false },
    onChange: { control: false },
    colors: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Pick an identity colour for a client or a category from a fixed palette. The chosen swatch shows a check; `allowAuto` adds a way back to the automatic colour.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ColorSwatchPicker>;

export const Playground: Story = {
  render: function Render(args) {
    const [color, setColor] = useState<string | null>('#6366F1');
    return <ColorSwatchPicker {...args} value={color} onChange={setColor} />;
  },
};

export const WithAuto: Story = {
  render: function Render() {
    const [color, setColor] = useState<string | null>('#EC4899');
    return <ColorSwatchPicker value={color} onChange={setColor} allowAuto hint="Senza un colore scelto, Lume ne assegna uno dal nome." />;
  },
};

export const NoneChosen: Story = {
  render: function Render() {
    const [color, setColor] = useState<string | null>(null);
    return <ColorSwatchPicker value={color} onChange={setColor} allowAuto />;
  },
};

export const SixColumns: Story = {
  render: function Render() {
    const [color, setColor] = useState<string | null>('#22C55E');
    return <ColorSwatchPicker value={color} onChange={setColor} columns={6} ariaLabel="Colore della categoria" />;
  },
};
