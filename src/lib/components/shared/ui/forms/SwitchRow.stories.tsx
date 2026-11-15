import { useState } from 'react';
import type { Meta, StoryObj } from '@docs/csf';
import { SwitchRow } from './SwitchRow';
import { StatusDot } from '../StatusDot';

const meta: Meta<typeof SwitchRow> = {
  title: 'Moduli/SwitchRow',
  component: SwitchRow,
  args: {
    label: 'Promemoria via SMS',
    description: 'Il giorno prima dell’appuntamento, alle 18:00.',
    disabled: false,
  },
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    checked: { control: false },
    onChange: { control: false },
    leading: { control: false },
    trailing: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A setting that is on or off: title and one line of explanation on the left, the switch on the right, the whole label clickable. Stack several in a `divide-y` list, each with `py-3`: the row has no vertical padding of its own.',
      },
    },
  },
  decorators: [(Story) => <div className="w-[440px]"><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof SwitchRow>;

export const Playground: Story = {
  render: function Render(args) {
    const [on, setOn] = useState(true);
    return <SwitchRow {...args} checked={on} onChange={() => setOn((v) => !v)} />;
  },
};

export const SettingsList: Story = {
  render: function Render() {
    const [s, setS] = useState({ sms: true, email: false, review: true, online: false });
    const flip = (k: keyof typeof s) => () => setS((p) => ({ ...p, [k]: !p[k] }));
    return (
      <div className="surface-card px-4 divide-y divide-line">
        <SwitchRow className="py-3" label="Promemoria via SMS" description="Il giorno prima dell’appuntamento." checked={s.sms} onChange={flip('sms')} />
        <SwitchRow className="py-3" label="Conferma via email" description="Appena l’appuntamento è fissato." checked={s.email} onChange={flip('email')} />
        <SwitchRow className="py-3" label="Richiesta di recensione" description="Due ore dopo la chiusura della fiche." checked={s.review} onChange={flip('review')} />
        <SwitchRow className="py-3" label="Prenotazioni online" description="Disponibile con il piano annuale." checked={s.online} onChange={flip('online')} disabled />
      </div>
    );
  },
};

export const WithLeadingAndTrailing: Story = {
  render: function Render() {
    const [on, setOn] = useState(true);
    return (
      <SwitchRow
        label="Martina"
        description="Visibile nel calendario e nelle prenotazioni."
        leading={<span className="block size-3 rounded-full" style={{ backgroundColor: '#8B5CF6' }} aria-hidden />}
        trailing={<span className="text-xs text-[var(--lume-text-muted)] tabular-nums">12 appuntamenti</span>}
        checked={on}
        onChange={() => setOn((v) => !v)}
      />
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true, checked: false, onChange: () => {} },
};

export const WithStatus: Story = {
  render: function Render() {
    const [on, setOn] = useState(false);
    return (
      <SwitchRow
        label="Sincronizzazione Google Calendar"
        description="Copia gli appuntamenti nel calendario personale di ogni operatore."
        trailing={<StatusDot tone={on ? 'success' : 'neutral'}>{on ? 'Attiva' : 'Spenta'}</StatusDot>}
        checked={on}
        onChange={() => setOn((v) => !v)}
      />
    );
  },
};
