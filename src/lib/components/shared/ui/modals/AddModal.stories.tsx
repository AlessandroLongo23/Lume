import { useState } from 'react';
import type { Meta, StoryObj } from '@docs/csf';
import { Button } from '../Button';
import { FormInput } from '../forms/FormInput';
import { AddModal } from './AddModal';

const meta: Meta<typeof AddModal> = {
  title: 'Sovrapposizioni/AddModal',
  component: AddModal,
  args: {
    isOpen: true,
    title: 'Nuovo cliente',
    subtitle: 'Bastano nome e telefono, il resto si aggiunge dopo.',
    confirmText: 'Aggiungi',
    cancelText: 'Annulla',
    confirmDisabled: false,
    hideConfirm: false,
    hideCancel: false,
    closeOnOutsideClick: true,
    classes: 'max-w-lg',
  },
  argTypes: {
    isOpen: { control: 'boolean' },
    title: { control: 'text' },
    subtitle: { control: 'text' },
    confirmText: { control: 'text' },
    cancelText: { control: 'text' },
    confirmDisabled: { control: 'boolean' },
    hideConfirm: { control: 'boolean' },
    hideCancel: { control: 'boolean' },
    closeOnOutsideClick: { control: 'boolean' },
    classes: { control: 'text' },
    confirmDataTour: { control: 'text' },
    footerContent: { control: false },
    dangerAction: { control: false },
    children: { control: false },
    onClose: { control: false },
    onSubmit: { control: false },
    onEnterComplete: { control: false },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The dialog for creating something (a client, a service, a product): header with divider, a form body and a footer with Annulla and a primary confirm. `footerContent` fills the left of the footer, `dangerAction` adds a button before Annulla.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof AddModal>;

function ClientForm() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormInput label="Nome" placeholder="Giulia" required />
      <FormInput label="Cognome" placeholder="Rossi" required />
      <FormInput label="Telefono" placeholder="333 123 4567" prefix="+39" fieldClassName="col-span-2" />
      <FormInput label="Email" placeholder="giulia.rossi@email.it" type="email" fieldClassName="col-span-2" />
    </div>
  );
}

export const Playground: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(args.isOpen);
    const close = () => setOpen(false);
    return (
      <>
        <div className="min-h-[640px] p-8">
          <Button variant="primary" onClick={() => setOpen(true)}>Nuovo cliente</Button>
        </div>
        <AddModal {...args} isOpen={open} onClose={close} onSubmit={close}>
          <ClientForm />
        </AddModal>
      </>
    );
  },
};

export const ConfirmDisabled: Story = { ...Playground, args: { confirmDisabled: true } };

export const WithFooterContent: Story = {
  ...Playground,
  args: { footerContent: 'I campi con * sono obbligatori' },
};

export const WithDangerAction: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(args.isOpen);
    const close = () => setOpen(false);
    return (
      <>
        <div className="min-h-[640px] p-8">
          <Button onClick={() => setOpen(true)}>Apri</Button>
        </div>
        <AddModal
          {...args}
          title="Nuovo coupon"
          subtitle="Uno sconto da usare in cassa."
          isOpen={open}
          onClose={close}
          onSubmit={close}
          dangerAction={<Button variant="ghost-destructive" onClick={close}>Scarta bozza</Button>}
        >
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Codice" defaultValue="AUTUNNO10" />
            <FormInput label="Sconto" defaultValue="10" suffix="%" />
          </div>
        </AddModal>
      </>
    );
  },
};

export const ReadOnly: Story = {
  ...Playground,
  args: { title: 'Dettagli importazione', subtitle: 'Solo lettura', hideConfirm: true, cancelText: 'Chiudi' },
};
