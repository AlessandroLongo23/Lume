import { useState } from 'react';
import { CalendarX } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { Button } from '../Button';
import { ConfirmDialog } from './ConfirmDialog';

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Sovrapposizioni/ConfirmDialog',
  component: ConfirmDialog,
  args: {
    isOpen: true,
    title: 'Spostare l’appuntamento?',
    description: 'Giulia Rossi riceverà un SMS con il nuovo orario: giovedì 30 ottobre alle 15:00.',
    confirmLabel: 'Sposta',
    cancelLabel: 'Annulla',
    tone: 'warning',
  },
  argTypes: {
    isOpen: { control: 'boolean' },
    title: { control: 'text' },
    description: { control: 'text' },
    confirmLabel: { control: 'text' },
    cancelLabel: { control: 'text' },
    tone: { control: 'radio', options: ['warning', 'destructive', 'default'] },
    icon: { control: false },
    busy: { control: 'boolean' },
    alternative: { control: false },
    onClose: { control: false },
    onConfirm: { control: false },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A short yes/no question before an action with consequences. Enter confirms and Escape cancels. `tone` only picks the confirm button and, for warnings, a small icon beside the title; for deletes use `DeleteModal`. `alternative` adds a third way out on the left ("Scarta" when leaving unsaved edits) and `busy` spins the confirm button while it runs.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ConfirmDialog>;

export const Playground: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(args.isOpen);
    return (
      <>
        <div className="min-h-[600px] p-8">
          <Button onClick={() => setOpen(true)}>Sposta appuntamento</Button>
        </div>
        <ConfirmDialog {...args} isOpen={open} onClose={() => setOpen(false)} onConfirm={() => setOpen(false)} />
      </>
    );
  },
};

export const Destructive: Story = {
  ...Playground,
  args: {
    tone: 'destructive',
    title: 'Annullare la fiche?',
    description: 'La fiche di Marco Bianchi (Taglio uomo e Barba, 34,00 €) verrà annullata e il pagamento stornato.',
    confirmLabel: 'Annulla fiche',
    cancelLabel: 'Indietro',
  },
};

export const Default: Story = {
  ...Playground,
  args: { tone: 'default', title: 'Inviare il promemoria?', description: 'Mandiamo un SMS a 12 clienti con appuntamento domani.', confirmLabel: 'Invia' },
};

export const CustomIcon: Story = {
  ...Playground,
  args: { icon: CalendarX, title: 'Chiudere il salone il 1° novembre?', description: 'Gli appuntamenti già presi restano in calendario: avvisa i clienti.', confirmLabel: 'Chiudi il giorno' },
};

export const WithTrigger: Story = { ...Playground, args: { isOpen: false } };

/** Leaving a page with unsaved edits: "Scarta" drops them and leaves, "Annulla" stays, "Salva" saves and leaves. */
export const UnsavedChanges: Story = {
  ...Playground,
  args: {
    title: 'Modifiche non salvate',
    description: 'Hai modifiche non salvate. Cosa vuoi fare prima di lasciare la pagina?',
    confirmLabel: 'Salva',
    alternative: { label: 'Scarta', onClick: () => {} },
  },
};

export const Busy: Story = {
  ...Playground,
  args: { ...UnsavedChanges.args, confirmLabel: 'Salvataggio…', busy: true },
};
