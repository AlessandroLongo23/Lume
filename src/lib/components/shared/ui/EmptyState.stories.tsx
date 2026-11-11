import { CalendarPlus, Plus, Upload, Users, Search } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { EmptyState } from './EmptyState';

const noop = () => {};

const meta: Meta<typeof EmptyState> = {
  title: 'Feedback/EmptyState',
  component: EmptyState,
  args: {
    icon: Users,
    title: 'Nessun cliente',
    description: 'Aggiungi il primo cliente o importa la rubrica dal vecchio gestionale.',
    action: { label: 'Nuovo cliente', icon: Plus, onClick: noop },
    secondaryAction: { label: 'Importa', icon: Upload, onClick: noop },
  },
  argTypes: {
    icon: { control: false },
    title: { control: 'text' },
    description: { control: 'text' },
    action: { control: false },
    secondaryAction: { control: false },
  },
  decorators: [(Story) => <div className="w-[640px]"><Story /></div>],
  parameters: {
    docs: {
      description: {
        component:
          'The placeholder for an empty list or a first use: a framed icon, one line of title and the next step as a button. Every empty state offers a "do this next".',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof EmptyState>;

export const Playground: Story = {};

export const SingleAction: Story = {
  args: {
    icon: CalendarPlus,
    title: 'Nessun appuntamento oggi',
    description: 'La giornata è libera. Fissa un appuntamento per un cliente.',
    action: { label: 'Nuovo appuntamento', icon: Plus, onClick: noop },
    secondaryAction: undefined,
  },
};

export const NoResults: Story = {
  args: {
    icon: Search,
    title: 'Nessun risultato per "Bianchi"',
    description: 'Controlla l’ortografia o cerca per numero di telefono.',
    action: undefined,
    secondaryAction: { label: 'Azzera ricerca', onClick: noop },
  },
};

export const TitleOnly: Story = {
  args: { icon: Users, title: 'Nessun operatore archiviato', description: undefined, action: undefined, secondaryAction: undefined },
};
