import { useState } from 'react';
import type { Meta, StoryObj } from '@docs/csf';
import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Moduli/Checkbox',
  component: Checkbox,
  args: { size: 'md', disabled: false, indeterminate: false, 'aria-label': 'Seleziona' },
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md'] },
    checked: { control: false },
    onChange: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A checkbox for multiple choice and table row selection. When on it fills with the text colour, the same neutral "selected" language as switches; `indeterminate` shows a dash for a partly selected group. For a single on/off setting use `Switch` or `SwitchRow`.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Playground: Story = {
  render: function Render(args) {
    const [checked, setChecked] = useState(true);
    return <Checkbox {...args} checked={checked} onChange={(e) => setChecked(e.target.checked)} />;
  },
};

export const States: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox aria-label="Non selezionato" defaultChecked={false} />
      <Checkbox aria-label="Selezionato" defaultChecked />
      <Checkbox aria-label="Parziale" indeterminate />
      <Checkbox aria-label="Disattivato" disabled />
      <Checkbox aria-label="Disattivato e selezionato" disabled defaultChecked />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox size="sm" aria-label="Piccolo" defaultChecked />
      <Checkbox size="md" aria-label="Medio" defaultChecked />
    </div>
  ),
};

const consents = [
  { id: 'promemoria', label: 'Promemoria degli appuntamenti via SMS' },
  { id: 'newsletter', label: 'Newsletter e promozioni' },
  { id: 'compleanno', label: 'Auguri e coupon di compleanno' },
];

export const GroupWithSelectAll: Story = {
  render: function Render() {
    const [on, setOn] = useState<string[]>(['promemoria']);
    const all = on.length === consents.length;
    const some = on.length > 0 && !all;
    return (
      <div className="flex flex-col gap-1 w-[340px]">
        <div className="flex items-center gap-1">
          <Checkbox id="consensi-tutti" checked={all} indeterminate={some} onChange={() => setOn(all ? [] : consents.map((c) => c.id))} />
          <label htmlFor="consensi-tutti" className="text-sm font-medium text-[var(--lume-text)] cursor-pointer">Tutti i consensi</label>
        </div>
        <div className="flex flex-col pl-6">
          {consents.map((c) => (
            <div key={c.id} className="flex items-center gap-1">
              <Checkbox
                id={`consenso-${c.id}`}
                checked={on.includes(c.id)}
                onChange={(e) => setOn(e.target.checked ? [...on, c.id] : on.filter((x) => x !== c.id))}
              />
              <label htmlFor={`consenso-${c.id}`} className="text-sm text-[var(--lume-text-secondary)] cursor-pointer">{c.label}</label>
            </div>
          ))}
        </div>
      </div>
    );
  },
};
