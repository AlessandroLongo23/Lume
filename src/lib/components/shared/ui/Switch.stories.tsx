import { useState } from 'react';
import type { Meta, StoryObj } from '@docs/csf';
import { Switch } from './Switch';

const meta: Meta<typeof Switch> = {
  title: 'Moduli/Switch',
  component: Switch,
  args: { disabled: false, 'aria-label': 'Attiva' },
  argTypes: {
    checked: { control: false },
    onChange: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A bare on/off control. When on, the track fills with the text colour (neutral, like a checked `Checkbox`); indigo stays for actions and focus. For a setting with a title and description use `SwitchRow`.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Switch>;

export const Playground: Story = {
  render: function Render(args) {
    const [on, setOn] = useState(true);
    return <Switch {...args} checked={on} onChange={() => setOn((v) => !v)} />;
  },
};

export const States: Story = {
  render: function Render() {
    const [a, setA] = useState(false);
    const [b, setB] = useState(true);
    return (
      <div className="flex items-center gap-4">
        <Switch aria-label="Spento" checked={a} onChange={() => setA((v) => !v)} />
        <Switch aria-label="Acceso" checked={b} onChange={() => setB((v) => !v)} />
        <Switch aria-label="Spento, disattivato" checked={false} onChange={() => {}} disabled />
        <Switch aria-label="Acceso, disattivato" checked onChange={() => {}} disabled />
      </div>
    );
  },
};

export const WithLabel: Story = {
  render: function Render() {
    const [on, setOn] = useState(true);
    return (
      <div className="flex items-center gap-3">
        <Switch id="mostra-prezzi" checked={on} onChange={() => setOn((v) => !v)} aria-labelledby="mostra-prezzi-label" />
        <label id="mostra-prezzi-label" htmlFor="mostra-prezzi" className="text-sm text-[var(--lume-text)]">Mostra i prezzi nella pagina di prenotazione</label>
      </div>
    );
  },
};
