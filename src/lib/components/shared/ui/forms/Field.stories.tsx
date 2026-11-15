import { useState } from 'react';
import { User, Palette } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { Field } from './Field';
import { Switch } from '../Switch';

const meta: Meta<typeof Field> = {
  title: 'Moduli/Field',
  component: Field,
  args: { label: 'Nome', hint: 'Come compare in agenda e sulle ricevute.', required: false },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    error: { control: 'text' },
    required: { control: 'boolean' },
    labelIcon: { control: false },
    labelAction: { control: false },
    children: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Label, control, hint and error in one stack: the only way a form field is laid out in Lume. Every input-like component renders through it; wrap a custom control in `Field` so its label, spacing and error match the rest of the form.',
      },
    },
  },
  decorators: [(Story) => <div className="w-[360px]"><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof Field>;

export const Playground: Story = {
  render: function Render(args) {
    const [value, setValue] = useState('Giulia');
    return (
      <Field {...args}>
        {({ id, describedBy, invalid }) => (
          <input
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className="control control-md w-full"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )}
      </Field>
    );
  },
};

export const WithLabelIcon: Story = {
  args: { label: 'Cliente', labelIcon: User, hint: undefined },
  render: (args) => (
    <Field {...args}>
      {({ id }) => <input id={id} className="control control-md w-full" defaultValue="Giulia Rossi" />}
    </Field>
  ),
};

export const Required: Story = {
  args: { label: 'Cognome', required: true, hint: undefined },
  render: (args) => (
    <Field {...args}>
      {({ id }) => <input id={id} className="control control-md w-full" placeholder="Rossi" />}
    </Field>
  ),
};

export const WithError: Story = {
  args: { label: 'Email', error: 'Indirizzo email non valido', hint: undefined },
  render: (args) => (
    <Field {...args}>
      {({ id, describedBy, invalid }) => (
        <input id={id} aria-describedby={describedBy} aria-invalid={invalid || undefined} className="control control-md w-full" defaultValue="giulia.rossi@" />
      )}
    </Field>
  ),
};

export const WithLabelAction: Story = {
  args: { label: 'Miscela', labelIcon: Palette, hint: 'Attiva per annotare la formula del colore.' },
  render: function Render(args) {
    const [enabled, setEnabled] = useState(true);
    return (
      <Field {...args} labelAction={<Switch checked={enabled} onChange={() => setEnabled((v) => !v)} aria-label="Usa miscela" />}>
        {({ id, describedBy }) => (
          <input id={id} aria-describedby={describedBy} disabled={!enabled} className="control control-md w-full" defaultValue="7.1 + 8.1, ossigeno 20 vol" />
        )}
      </Field>
    );
  },
};
