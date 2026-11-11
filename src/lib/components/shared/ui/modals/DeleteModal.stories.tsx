import { useState } from 'react';
import { Archive, Trash2 } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { Button } from '../Button';
import { DeleteModal } from './DeleteModal';

const meta: Meta<typeof DeleteModal> = {
  title: 'Sovrapposizioni/DeleteModal',
  component: DeleteModal,
  args: {
    isOpen: true,
    title: 'Eliminare il servizio «Piega»?',
    subtitle: 'Questa azione è irreversibile',
    confirmText: 'Elimina',
    busy: false,
  },
  argTypes: {
    isOpen: { control: 'boolean' },
    title: { control: 'text' },
    subtitle: { control: 'text' },
    confirmPhrase: { control: 'text' },
    confirmText: { control: 'text' },
    busy: { control: 'boolean' },
    warning: { control: false },
    tip: { control: false },
    alternative: { control: false },
    children: { control: false },
    onClose: { control: false },
    onConfirm: { control: false },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Every delete confirmation in Lume. Simple deletes pass a title and subtitle; irreversible ones add a `warning` of what is lost, a `tip`, a `confirmPhrase` to type and an `alternative` such as Archivia, so the dialog reads the same for clients, services, products, operators and coupons.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof DeleteModal>;

export const Playground: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(args.isOpen);
    const close = () => setOpen(false);
    return (
      <>
        <div className="min-h-[600px] p-8">
          <Button variant="ghost-destructive" leadingIcon={Trash2} onClick={() => setOpen(true)}>Elimina</Button>
        </div>
        <DeleteModal
          {...args}
          isOpen={open}
          onClose={close}
          onConfirm={close}
          alternative={args.alternative ? { ...args.alternative, onClick: close } : undefined}
        />
      </>
    );
  },
};

export const WithTrigger: Story = { ...Playground, args: { isOpen: false } };

export const WarningAndTip: Story = {
  ...Playground,
  args: {
    title: 'Eliminare Giulia Rossi?',
    warning: 'Verranno eliminate anche 14 fiche, 3 appuntamenti futuri e lo storico dei pagamenti (612,50 €).',
    tip: 'Se non vuoi più vederla in elenco, archiviala: i dati restano nei report.',
  },
};

export const TypeToConfirm: Story = {
  ...Playground,
  args: {
    title: 'Eliminare Giulia Rossi?',
    warning: 'Verranno eliminate anche 14 fiche, 3 appuntamenti futuri e lo storico dei pagamenti.',
    confirmPhrase: 'Giulia Rossi',
    confirmText: 'Elimina cliente',
  },
};

export const WithArchiveAlternative: Story = {
  ...Playground,
  args: {
    title: 'Eliminare l’operatore Luca?',
    warning: 'Luca ha 38 fiche registrate: eliminandolo spariscono anche dai report di bilancio.',
    tip: 'Archivia Luca per toglierlo dal calendario e tenere lo storico.',
    confirmPhrase: 'Luca',
    alternative: { label: 'Archivia', icon: Archive, onClick: () => {} },
  },
};

export const Busy: Story = { ...Playground, args: { busy: true, confirmText: 'Eliminazione' } };
