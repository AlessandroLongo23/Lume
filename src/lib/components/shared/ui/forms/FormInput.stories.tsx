import { useState } from 'react';
import { Mail, Search, User } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { FormInput } from './FormInput';

const meta: Meta<typeof FormInput> = {
  title: 'Moduli/FormInput',
  component: FormInput,
  args: { label: 'Nome', placeholder: 'Giulia', size: 'md', disabled: false, required: false },
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
    type: { control: 'select', options: ['text', 'email', 'password', 'tel', 'number'] },
    label: { control: 'text' },
    hint: { control: 'text' },
    error: { control: 'text' },
    prefix: { control: 'text' },
    suffix: { control: 'text' },
    icon: { control: false },
    labelIcon: { control: false },
    onChange: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Single-line text on the shared field surface, laid out by `Field`. Supports an icon, fixed `prefix` / `suffix` text inside the box, a show/hide toggle for passwords, and the three control sizes.',
      },
    },
  },
  decorators: [(Story) => <div className="w-[360px]"><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof FormInput>;

export const Playground: Story = {
  render: function Render(args) {
    const [value, setValue] = useState('');
    return <FormInput {...args} value={value} onChange={(e) => setValue(e.target.value)} />;
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <FormInput size="sm" label="Piccolo" defaultValue="Taglio donna" />
      <FormInput size="md" label="Medio" defaultValue="Taglio donna" />
      <FormInput size="lg" label="Grande" defaultValue="Taglio donna" />
    </div>
  ),
};

export const WithIcon: Story = {
  render: function Render() {
    const [email, setEmail] = useState('giulia.rossi@email.it');
    const [q, setQ] = useState('');
    return (
      <div className="flex flex-col gap-4">
        <FormInput label="Email" type="email" icon={<Mail className="size-4" />} value={email} onChange={(e) => setEmail(e.target.value)} />
        <FormInput label="Cliente" labelIcon={User} icon={<Search className="size-4" />} placeholder="Cerca per nome o telefono" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
    );
  },
};

export const PrefixAndSuffix: Story = {
  render: function Render() {
    const [slug, setSlug] = useState('salone-giulia');
    const [minutes, setMinutes] = useState('45');
    const [price, setPrice] = useState('35,00');
    return (
      <div className="flex flex-col gap-4">
        <FormInput label="Indirizzo della pagina di prenotazione" prefix="lume.it/" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <FormInput label="Durata" suffix="minuti" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        <FormInput label="Prezzo" suffix="€" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
      </div>
    );
  },
};

export const Password: Story = {
  render: function Render() {
    const [value, setValue] = useState('salone2026');
    return <FormInput label="Password" type="password" hint="Almeno 8 caratteri." value={value} onChange={(e) => setValue(e.target.value)} />;
  },
};

export const WithError: Story = {
  render: function Render() {
    const [value, setValue] = useState('333 12');
    return <FormInput label="Telefono" required error="Numero incompleto" value={value} onChange={(e) => setValue(e.target.value)} />;
  },
};

export const Disabled: Story = {
  args: { label: 'Codice cliente', defaultValue: 'CL-00142', disabled: true, hint: 'Assegnato automaticamente.' },
};
