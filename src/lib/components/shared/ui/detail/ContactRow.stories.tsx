import { Mail, Phone } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { ContactRow } from './ContactRow';
import { messagePopup } from '../messagePopup/messagePopup';

const copy = (v: string) => messagePopup.getState().success(`Copiato: ${v}`);

const meta: Meta<typeof ContactRow> = {
  title: 'Layout/ContactRow',
  component: ContactRow,
  args: { icon: Mail, value: 'giulia.rossi@gmail.com', emptyLabel: 'Nessuna email', onCopy: copy },
  argTypes: {
    icon: { control: false },
    onCopy: { control: false },
    value: { control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'One contact line (email, phone) in the aside of a `DetailHero`: icon, value, and a copy button that appears on hover. With no value it shows a muted placeholder such as "Nessuna email".',
      },
    },
  },
  render: (args) => (
    <div className="w-[280px]">
      <ContactRow {...args} />
    </div>
  ),
};
export default meta;

type Story = StoryObj<typeof ContactRow>;

export const Playground: Story = {};

export const PhoneNumber: Story = {
  name: 'Telefono',
  args: { icon: Phone, value: '+39 347 812 4590', emptyLabel: 'Nessun telefono' },
};

export const Empty: Story = { name: 'Vuoto', args: { value: null } };

export const LongValue: Story = {
  name: 'Valore lungo (troncato)',
  args: { value: 'francesca.dellacasa.parrucchieri@studioassociato-milano.it' },
  render: (args) => (
    <div className="w-[220px]">
      <ContactRow {...args} />
    </div>
  ),
};

export const Pair: Story = {
  name: 'Email e telefono',
  render: () => (
    <div className="flex flex-col gap-1 w-[280px]">
      <ContactRow icon={Mail} value="marco.bianchi@libero.it" emptyLabel="Nessuna email" onCopy={copy} />
      <ContactRow icon={Phone} value={null} emptyLabel="Nessun telefono" onCopy={copy} />
    </div>
  ),
};
