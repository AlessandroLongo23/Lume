import { CalendarClock, KeyRound, Plane, Star, TriangleAlert, Crown } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { DetailChip } from './DetailChip';
import { messagePopup } from '../messagePopup/messagePopup';

const meta: Meta<typeof DetailChip> = {
  title: 'Layout/DetailChip',
  component: DetailChip,
  args: { children: 'Cliente abituale', tone: 'neutral' },
  argTypes: {
    tone: { control: 'select', options: ['neutral', 'muted', 'warning', 'info', 'success', 'danger', 'accent'] },
    icon: { control: false },
    onClick: { control: false },
    children: { control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A small neutral chip beside the title of a `DetailHero`. The tone colours only the icon, or a small dot when there is no icon; there are no pastel fills. Pass `onClick` to make it a button that leads to the fix (for example "Aggiungi credenziali").',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof DetailChip>;

export const Playground: Story = {};

export const WithIcon: Story = { name: 'Con icona', args: { icon: Star, tone: 'warning', children: 'Top 20% per spesa' } };

export const Tones: Story = {
  name: 'Toni con icona',
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <DetailChip icon={KeyRound}>Senza account</DetailChip>
      <DetailChip tone="warning" icon={TriangleAlert}>Dati incompleti</DetailChip>
      <DetailChip tone="info" icon={Plane}>Turista</DetailChip>
      <DetailChip tone="success" icon={CalendarClock}>Prenota online</DetailChip>
      <DetailChip tone="danger" icon={TriangleAlert}>Allergia all&apos;ammoniaca</DetailChip>
      <DetailChip tone="accent" icon={Crown}>VIP</DetailChip>
    </div>
  ),
};

export const DotTones: Story = {
  name: 'Toni senza icona (punto)',
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <DetailChip>Neutro</DetailChip>
      <DetailChip tone="warning">In attesa</DetailChip>
      <DetailChip tone="info">Nuovo</DetailChip>
      <DetailChip tone="success">Attivo</DetailChip>
      <DetailChip tone="danger">Scaduto</DetailChip>
      <DetailChip tone="accent">In evidenza</DetailChip>
    </div>
  ),
};

export const Clickable: Story = {
  name: 'Cliccabile',
  args: {
    tone: 'neutral',
    icon: KeyRound,
    children: 'Senza account · Aggiungi credenziali',
    title: "Aggiungi email o telefono per creare l'accesso",
    onClick: () => messagePopup.getState().success('Apri la modifica del cliente'),
  },
};
