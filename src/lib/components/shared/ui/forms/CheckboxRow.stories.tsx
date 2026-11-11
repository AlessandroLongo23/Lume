import { useState } from 'react';
import type { Meta, StoryObj } from '@docs/csf';
import { CheckboxRow } from './CheckboxRow';
import { TextLink } from '../TextLink';

const meta: Meta<typeof CheckboxRow> = {
  title: 'Moduli/CheckboxRow',
  component: CheckboxRow,
  args: {
    label: 'Invia un promemoria al cliente',
    description: 'Un SMS il giorno prima dell’appuntamento, alle 18:00.',
    disabled: false,
  },
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    checked: { control: false },
    onChange: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A checkbox with its text: the box first, then the label and an optional description, all clickable. Without a description the label is the whole statement and may hold links (an acceptance); with one it reads as a title. For a setting that is on or off use `SwitchRow`.',
      },
    },
  },
  decorators: [(Story) => <div className="w-[440px]"><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof CheckboxRow>;

export const Playground: Story = {
  render: function Render(args) {
    const [on, setOn] = useState(true);
    return <CheckboxRow {...args} checked={on} onChange={setOn} />;
  },
};

export const Acceptance: Story = {
  render: function Render() {
    const [s, setS] = useState({ terms: false, dpa: false });
    return (
      <div className="space-y-3">
        <CheckboxRow
          label={
            <>
              Ho letto e accetto i <TextLink href="/terms">Termini di servizio</TextLink> e
              l’<TextLink href="/privacy">Informativa sulla privacy</TextLink>.
            </>
          }
          checked={s.terms}
          onChange={(v) => setS((p) => ({ ...p, terms: v }))}
        />
        <CheckboxRow
          label={
            <>
              Nomino Lume <strong>responsabile del trattamento</strong> dei dati dei miei clienti e accetto il{' '}
              <TextLink href="/dpa">Data Processing Agreement</TextLink>.
            </>
          }
          checked={s.dpa}
          onChange={(v) => setS((p) => ({ ...p, dpa: v }))}
        />
      </div>
    );
  },
};

export const WithDescription: Story = {
  render: function Render() {
    const [s, setS] = useState({ sms: true, review: false });
    return (
      <div className="space-y-3">
        <CheckboxRow
          label="Invia un promemoria al cliente"
          description="Un SMS il giorno prima dell’appuntamento."
          checked={s.sms}
          onChange={(v) => setS((p) => ({ ...p, sms: v }))}
        />
        <CheckboxRow
          label="Chiedi una recensione"
          description="Un’email due ore dopo la chiusura della fiche."
          checked={s.review}
          onChange={(v) => setS((p) => ({ ...p, review: v }))}
        />
      </div>
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true, checked: true, onChange: () => {} },
};
