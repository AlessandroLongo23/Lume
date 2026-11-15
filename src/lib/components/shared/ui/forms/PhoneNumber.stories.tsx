import { useState } from 'react';
import type { Meta, StoryObj } from '@docs/csf';
import { PhoneNumber, PhonePrefixSelect } from './PhoneNumber';
import { Field } from './Field';

const meta: Meta<typeof PhoneNumber> = {
  title: 'Moduli/PhoneNumber',
  component: PhoneNumber,
  args: { prefixCode: '+39', phoneNumber: '333 123 4567', size: 'md', disabled: false, invalid: false },
  argTypes: {
    size: { control: 'radio', options: ['md', 'lg'] },
    prefixCode: { control: false },
    phoneNumber: { control: false },
    onPrefixChange: { control: false },
    onPhoneChange: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A phone number with its country prefix: a searchable prefix picker beside the number, which is formatted as the user types. Use `PhonePrefixSelect` alone when a form stores the prefix in its own column.',
      },
    },
  },
  decorators: [(Story) => <div className="w-[360px]"><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof PhoneNumber>;

export const Playground: Story = {
  render: function Render(args) {
    const [prefix, setPrefix] = useState(args.prefixCode ?? '+39');
    const [number, setNumber] = useState(args.phoneNumber ?? '');
    return <PhoneNumber {...args} prefixCode={prefix} phoneNumber={number} onPrefixChange={setPrefix} onPhoneChange={setNumber} />;
  },
};

export const InField: Story = {
  render: function Render() {
    const [prefix, setPrefix] = useState('+39');
    const [number, setNumber] = useState('');
    return (
      <Field label="Telefono" hint="Per i promemoria degli appuntamenti.">
        {({ id, invalid }) => (
          <PhoneNumber id={id} invalid={invalid} prefixCode={prefix} phoneNumber={number} onPrefixChange={setPrefix} onPhoneChange={setNumber} />
        )}
      </Field>
    );
  },
};

export const ForeignNumber: Story = {
  render: function Render() {
    const [prefix, setPrefix] = useState('+41');
    const [number, setNumber] = useState('79 123 45 67');
    return <PhoneNumber prefixCode={prefix} phoneNumber={number} onPrefixChange={setPrefix} onPhoneChange={setNumber} />;
  },
};

export const WithError: Story = {
  render: function Render() {
    const [prefix, setPrefix] = useState('+39');
    const [number, setNumber] = useState('333 12');
    return (
      <Field label="Telefono" required error="Numero incompleto">
        {({ id, invalid }) => (
          <PhoneNumber id={id} invalid={invalid} prefixCode={prefix} phoneNumber={number} onPrefixChange={setPrefix} onPhoneChange={setNumber} />
        )}
      </Field>
    );
  },
};

export const Large: Story = {
  render: function Render() {
    const [prefix, setPrefix] = useState('+39');
    const [number, setNumber] = useState('347 765 4321');
    return <PhoneNumber size="lg" prefixCode={prefix} phoneNumber={number} onPrefixChange={setPrefix} onPhoneChange={setNumber} />;
  },
};

export const Disabled: Story = {
  args: { disabled: true, onPrefixChange: () => {}, onPhoneChange: () => {} },
};

export const PrefixOnly: Story = {
  name: 'PhonePrefixSelect',
  render: function Render() {
    const [prefix, setPrefix] = useState('+39');
    return (
      <Field label="Prefisso">
        {({ id }) => <PhonePrefixSelect id={id} value={prefix} onChange={setPrefix} />}
      </Field>
    );
  },
};
