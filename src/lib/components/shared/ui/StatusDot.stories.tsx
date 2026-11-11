import type { Meta, StoryObj } from '@docs/csf';
import { StatusDot } from './StatusDot';

const meta: Meta<typeof StatusDot> = {
  title: 'Feedback/StatusDot',
  component: StatusDot,
  args: { tone: 'success', children: 'Pagato' },
  argTypes: {
    tone: { control: 'select', options: ['success', 'warning', 'danger', 'info', 'neutral', 'muted', 'accent'] },
    children: { control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A state shown as a small coloured dot beside a neutral word: paid, pending, low stock, archived. Use it in tables and lists in place of tinted pills.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof StatusDot>;

export const Playground: Story = {};

export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-2 text-sm">
      <StatusDot tone="success">Pagato</StatusDot>
      <StatusDot tone="warning">In attesa</StatusDot>
      <StatusDot tone="danger">Esaurito</StatusDot>
      <StatusDot tone="info">Confermato</StatusDot>
      <StatusDot tone="neutral">Bozza</StatusDot>
      <StatusDot tone="muted">Archiviato</StatusDot>
      <StatusDot tone="accent">In corso</StatusDot>
    </div>
  ),
};

export const InTableCell: Story = {
  render: () => (
    <div className="surface-card rounded-xl w-[360px] text-sm divide-y divide-line">
      {[
        ['Ordine #1042', 'success', 'Consegnato'],
        ['Ordine #1043', 'warning', 'In arrivo'],
        ['Ordine #1044', 'danger', 'Annullato'],
      ].map(([name, tone, label]) => (
        <div key={name} className="flex items-center justify-between px-4 py-2.5 text-[var(--lume-text)]">
          <span>{name}</span>
          <StatusDot tone={tone as 'success' | 'warning' | 'danger'}>{label}</StatusDot>
        </div>
      ))}
    </div>
  ),
};
