import { Loader2 } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { Button } from './Button';
import { Callout } from './Callout';

const meta: Meta<typeof Callout> = {
  title: 'Feedback/Callout',
  component: Callout,
  args: {
    tone: 'info',
    title: 'Orari di apertura aggiornati',
    children: 'I nuovi orari valgono dal 3 novembre. Gli appuntamenti già fissati restano invariati.',
  },
  argTypes: {
    tone: { control: 'radio', options: ['info', 'success', 'warning', 'danger'] },
    title: { control: 'text' },
    children: { control: 'text' },
    icon: { control: false },
    action: { control: false },
  },
  decorators: [(Story) => <div className="w-[480px]"><Story /></div>],
  parameters: {
    docs: {
      description: {
        component:
          'An inline notice inside a page, form or dialog: a soft tinted field, the tone icon in colour and neutral text. Colour is never the only signal. App-wide banners use the same component.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Callout>;

export const Playground: Story = {};

export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Callout tone="info" title="Promemoria attivi">I clienti ricevono un SMS il giorno prima dell&apos;appuntamento.</Callout>
      <Callout tone="success" title="Fiche chiusa">Incasso registrato: 58,00 €.</Callout>
      <Callout tone="warning" title="Scorte in esaurimento">Restano 2 flaconi di Shampoo ristrutturante.</Callout>
      <Callout tone="danger" title="Pagamento non riuscito">La carta associata all&apos;abbonamento è scaduta.</Callout>
    </div>
  ),
};

export const TitleOnly: Story = { args: { tone: 'success', title: 'Modifiche salvate', children: undefined } };

export const BodyOnly: Story = {
  args: { tone: 'info', title: undefined, children: 'Sara è in ferie dal 10 al 17 novembre: il calendario non mostra i suoi turni.' },
};

export const WithAction: Story = {
  args: {
    tone: 'danger',
    title: 'Abbonamento scaduto',
    children: 'Rinnova per continuare a prendere appuntamenti online.',
    action: <Button size="sm" variant="secondary">Rinnova</Button>,
  },
};

export const InProgress: Story = {
  args: {
    tone: 'info',
    title: 'Importazione in corso',
    children: '312 clienti su 1.240 importati.',
    icon: Loader2,
    iconClassName: 'animate-spin',
  },
};
