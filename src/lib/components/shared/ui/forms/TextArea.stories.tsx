import { useState } from 'react';
import { StickyNote } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { TextArea } from './TextArea';

const meta: Meta<typeof TextArea> = {
  title: 'Moduli/TextArea',
  component: TextArea,
  args: { label: 'Note', placeholder: 'Allergie, preferenze, cose da ricordare…', rows: 3, disabled: false },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    error: { control: 'text' },
    rows: { control: 'number' },
    labelIcon: { control: false },
    onChange: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component: 'Multi-line text on the shared field surface, laid out by `Field`. Use it for notes and descriptions; it grows vertically when the user drags its corner.',
      },
    },
  },
  decorators: [(Story) => <div className="w-[360px]"><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof TextArea>;

export const Playground: Story = {
  render: function Render(args) {
    const [value, setValue] = useState('');
    return <TextArea {...args} value={value} onChange={(e) => setValue(e.target.value)} />;
  },
};

export const WithText: Story = {
  render: function Render() {
    const [value, setValue] = useState(
      'Cute sensibile: test della pelle 48 ore prima del colore.\nPreferisce la piega mossa, niente lacca.',
    );
    return <TextArea label="Note sul cliente" labelIcon={StickyNote} hint="Visibili solo allo staff." rows={4} value={value} onChange={(e) => setValue(e.target.value)} />;
  },
};

export const WithError: Story = {
  render: function Render() {
    const [value, setValue] = useState('');
    return <TextArea label="Motivo dell'annullamento" required error="Scrivi un motivo" value={value} onChange={(e) => setValue(e.target.value)} />;
  },
};

export const Disabled: Story = {
  args: { label: 'Note', disabled: true, defaultValue: 'Fiche chiusa: le note non si modificano più.' },
};
