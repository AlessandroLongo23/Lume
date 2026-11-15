import { useState, type FormEvent } from 'react';
import { Mail, UserRound } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { Button } from '../Button';
import { ComuneAutocomplete, type ComuneSelection } from '../ComuneAutocomplete';
import { ColorSwatchPicker } from './ColorSwatchPicker';
import { DateField } from './DateField';
import { Field } from './Field';
import { FormInput } from './FormInput';
import { PhoneNumber } from './PhoneNumber';
import { Select } from './Select';
import { SwitchRow } from './SwitchRow';
import { TextArea } from './TextArea';

const operators = [
  { id: 'o1', name: 'Sara' },
  { id: 'o2', name: 'Luca' },
  { id: 'o3', name: 'Martina' },
];

type Errors = Partial<Record<'firstName' | 'lastName' | 'phone', string>>;

function NuovoClienteForm({ showErrors = false }: { showErrors?: boolean }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [prefix, setPrefix] = useState('+39');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [comune, setComune] = useState<ComuneSelection | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [reminders, setReminders] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [submitted, setSubmitted] = useState(showErrors);
  const [saved, setSaved] = useState(false);

  const errors: Errors = {};
  if (!firstName.trim()) errors.firstName = 'Inserisci il nome';
  if (!lastName.trim()) errors.lastName = 'Inserisci il cognome';
  if (phone && phone.replace(/\D/g, '').length < 9) errors.phone = 'Numero incompleto';
  const shown = submitted ? errors : {};

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setSaved(Object.keys(errors).length === 0);
  };

  return (
    <form onSubmit={submit} noValidate className="surface-card w-full max-w-[640px] p-6 flex flex-col gap-6">
      <header>
        <h2 className="text-lg font-semibold text-[var(--lume-text)]">Nuovo cliente</h2>
        <p className="text-sm text-[var(--lume-text-secondary)]">Bastano nome e cognome: il resto si può aggiungere dopo.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormInput label="Nome" required placeholder="Giulia" value={firstName} onChange={(e) => setFirstName(e.target.value)} error={shown.firstName} />
        <FormInput label="Cognome" required placeholder="Rossi" value={lastName} onChange={(e) => setLastName(e.target.value)} error={shown.lastName} />
        <Field label="Telefono" error={shown.phone} hint="Per i promemoria degli appuntamenti.">
          {({ id, invalid }) => <PhoneNumber id={id} invalid={invalid} prefixCode={prefix} phoneNumber={phone} onPrefixChange={setPrefix} onPhoneChange={setPhone} />}
        </Field>
        <FormInput label="Email" type="email" icon={<Mail className="size-4" />} placeholder="giulia.rossi@email.it" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Data di nascita">
          {({ id }) => <DateField id={id} value={birthday} onChange={setBirthday} />}
        </Field>
        <Field label="Operatore preferito" labelIcon={UserRound}>
          {({ id }) => (
            <Select id={id} value={operator} onChange={setOperator} options={operators} labelKey="name" valueKey="id" searchable={false} isNullable placeholder="Nessuna preferenza" />
          )}
        </Field>
        <div className="sm:col-span-2">
          <ComuneAutocomplete label="Comune di residenza" value={comune} onChange={setComune} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6">
        <Field label="Colore in agenda">
          {() => <ColorSwatchPicker value={color} onChange={setColor} allowAuto columns={6} ariaLabel="Colore in agenda" />}
        </Field>
        <TextArea label="Note" placeholder="Allergie, preferenze, formula del colore…" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="divide-y divide-line border-y border-line">
        <SwitchRow className="py-3" label="Promemoria via SMS" description="Il giorno prima di ogni appuntamento." checked={reminders} onChange={() => setReminders((v) => !v)} />
        <SwitchRow className="py-3" label="Comunicazioni promozionali" description="Serve il consenso scritto del cliente." checked={marketing} onChange={() => setMarketing((v) => !v)} />
      </div>

      <footer className="flex items-center justify-end gap-2">
        {saved && <p className="mr-auto text-sm text-[var(--lume-text-secondary)]">Cliente salvato: {firstName} {lastName}</p>}
        <Button type="button" variant="ghost" onClick={() => { setSubmitted(false); setSaved(false); }}>Annulla</Button>
        <Button type="submit" variant="primary">Salva cliente</Button>
      </footer>
    </form>
  );
}

const meta: Meta = {
  title: 'Moduli/Esempio di modulo',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A realistic "Nuovo cliente" form composed from the Moduli components, to check that labels, heights and spacing line up when they sit side by side. Press "Salva cliente" with empty names to see the error states.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const NuovoCliente: Story = {
  name: 'Nuovo cliente',
  render: () => <NuovoClienteForm />,
};

export const WithErrors: Story = {
  name: 'Con errori',
  render: () => <NuovoClienteForm showErrors />,
};
