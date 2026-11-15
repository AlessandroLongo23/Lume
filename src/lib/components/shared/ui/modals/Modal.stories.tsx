import { useState } from 'react';
import type { Meta, StoryObj } from '@docs/csf';
import { Button } from '../Button';
import { FormInput } from '../forms/FormInput';
import { Modal } from './Modal';
import { DialogFooter, DialogHeader } from './dialogParts';

const meta: Meta<typeof Modal> = {
  title: 'Sovrapposizioni/Modal',
  component: Modal,
  args: { isOpen: true, classes: 'max-w-md', closeOnOutsideClick: true, labelledBy: 'modal-title' },
  argTypes: {
    isOpen: { control: 'boolean' },
    classes: { control: 'text' },
    closeOnOutsideClick: { control: 'boolean' },
    labelledBy: { control: 'text' },
    describedBy: { control: 'text' },
    role: { control: 'radio', options: ['dialog', 'alertdialog'] },
    onClose: { control: false },
    onEnterComplete: { control: false },
    children: { control: false },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The dialog shell: a portal, a calm backdrop, Escape to close and a 4px rise on enter. It draws the card too (raised surface, float shadow, a 16px gutter on phones, capped at 92% of the viewport height): pass only the width in `classes` and fill it with `DialogHeader`, a body and `DialogFooter` from `dialogParts`. For common cases use `ConfirmDialog`, `AddModal` (also for edit forms, with `confirmText="Salva"`) or `DeleteModal`.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Modal>;

function Page({ onOpen, label = 'Apri finestra' }: { onOpen: () => void; label?: string }) {
  return (
    <div className="min-h-[600px] p-8 flex flex-col gap-3">
      <h1 className="text-xl font-medium tracking-tight text-[var(--lume-text)]">Servizi</h1>
      <div><Button onClick={onOpen}>{label}</Button></div>
    </div>
  );
}

function RenameCard({ onClose }: { onClose: () => void }) {
  return (
    <>
      <DialogHeader titleId="modal-title" title="Rinomina categoria" subtitle="Il nuovo nome compare in listino e nelle fiche." onClose={onClose} />
      <div className="px-6 pt-2 pb-5">
        <FormInput label="Nome" defaultValue="Colore" />
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Annulla</Button>
        <Button variant="primary" onClick={onClose}>Salva</Button>
      </DialogFooter>
    </>
  );
}

export const Playground: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(args.isOpen);
    return (
      <>
        <Page onOpen={() => setOpen(true)} />
        <Modal {...args} isOpen={open} onClose={() => setOpen(false)}>
          <RenameCard onClose={() => setOpen(false)} />
        </Modal>
      </>
    );
  },
};

export const WithTrigger: Story = { ...Playground, args: { isOpen: false } };

export const DividerAndFooterStart: Story = {
  args: { classes: 'max-w-lg' },
  render: function Render(args) {
    const [open, setOpen] = useState(args.isOpen);
    const close = () => setOpen(false);
    return (
      <>
        <Page onOpen={() => setOpen(true)} />
        <Modal {...args} isOpen={open} onClose={close}>
          <>
            <DialogHeader titleId="modal-title" title="Nuovo servizio" subtitle="Compare subito in calendario e nelle fiche." onClose={close} divider />
            <div className="p-6 grid grid-cols-2 gap-4">
              <FormInput label="Nome" defaultValue="Taglio donna" fieldClassName="col-span-2" />
              <FormInput label="Prezzo" defaultValue="35,00" suffix="€" />
              <FormInput label="Durata" defaultValue="45" suffix="min" />
            </div>
            <DialogFooter start="I campi con * sono obbligatori">
              <Button variant="ghost" onClick={close}>Annulla</Button>
              <Button variant="primary" onClick={close}>Crea servizio</Button>
            </DialogFooter>
          </>
        </Modal>
      </>
    );
  },
};

export const NoOutsideClick: Story = { ...Playground, args: { closeOnOutsideClick: false } };
