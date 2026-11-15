import { Download, Plus } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { PageHeader } from './PageHeader';
import { Button } from './Button';
import { StatusDot } from './StatusDot';
import { NumberBadge } from './NumberBadge';

const meta: Meta<typeof PageHeader> = {
  title: 'Layout/PageHeader',
  component: PageHeader,
  args: { title: 'Clienti', subtitle: '1.248 clienti attivi, 37 archiviati', wrap: false },
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    actions: { control: false },
    meta: { control: false },
    back: { control: 'object' },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The title of every admin page: a large light heading with one quiet line under it, page actions on the right (under the title on phones). Detail pages add a `back` link to the parent page and a `meta` slot beside the title for a status or a count.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof PageHeader>;

export const Playground: Story = {};

export const WithActions: Story = {
  args: {
    actions: (
      <>
        <Button variant="secondary" leadingIcon={Download}>Esporta</Button>
        <Button variant="primary" leadingIcon={Plus}>Nuovo cliente</Button>
      </>
    ),
  },
};

export const WithBack: Story = {
  name: 'Con link indietro e stato',
  args: {
    title: 'Giulia Rossi',
    subtitle: 'Cliente dal 12 marzo 2023 · ultima visita 18 ottobre 2026',
    back: { href: '/admin/clienti', label: 'Clienti' },
    meta: <StatusDot tone="success" className="text-xs">Attiva</StatusDot>,
    actions: <Button variant="secondary">Modifica</Button>,
  },
};

export const WithCount: Story = {
  name: 'Con conteggio',
  args: {
    title: 'Fiches',
    subtitle: 'Giovedì 30 ottobre 2026',
    meta: <NumberBadge value={14} size="md" />,
  },
};

const longTitle = 'Trattamento ristrutturante alla cheratina con piega e taglio punte per capelli lunghi';

export const LongTitleTruncated: Story = {
  name: 'Titolo lungo (troncato)',
  args: { title: longTitle, subtitle: 'Servizio · 90 minuti · 85,00 €', actions: <Button variant="secondary">Modifica</Button> },
  render: (args) => (
    <div className="max-w-[720px]">
      <PageHeader {...args} />
    </div>
  ),
};

export const LongTitleWrapped: Story = {
  name: 'Titolo lungo (a capo)',
  args: {
    title: longTitle,
    subtitle: 'Servizio · 90 minuti · 85,00 €',
    wrap: true,
    back: { href: '/admin/servizi', label: 'Servizi' },
    actions: <Button variant="secondary">Modifica</Button>,
  },
  render: (args) => (
    <div className="max-w-[720px]">
      <PageHeader {...args} />
    </div>
  ),
};
