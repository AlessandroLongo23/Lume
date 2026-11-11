import { useState } from 'react';
import { Reorder } from 'motion/react';
import type { Meta, StoryObj } from '@docs/csf';
import { ReorderListRow } from './ReorderListRow';
import { ListBox, ListGroupLabel } from '@/lib/components/shared/ui/list/ListBox';
import { SeriesDot } from '@/lib/components/shared/ui/StatRow';

const noop = () => {};

const meta: Meta<typeof ReorderListRow> = {
  title: 'Dati/ReorderListRow',
  component: ReorderListRow,
  args: { value: 'sara', selected: true, onActivate: noop, children: 'Sara' },
  argTypes: {
    onActivate: { control: false },
    children: { control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A list row that is also a drag item: drag by the grip to reorder, click or press Enter/Space to toggle the check. Shared by the table column picker and the calendar operator filter; put it inside a `ListBox` and a `Reorder.Group`.',
      },
    },
  },
  render: (args) => (
    <div className="surface-card w-[288px] py-1">
      <ListBox role="listbox" multiple aria-label="Operatori">
        <Reorder.Group as="div" axis="y" values={[args.value]} onReorder={noop} className="flex flex-col gap-px">
          <ReorderListRow {...args}>
            <span className="flex-1 truncate">{args.children}</span>
          </ReorderListRow>
        </Reorder.Group>
      </ListBox>
    </div>
  ),
};
export default meta;

type Story = StoryObj<typeof ReorderListRow>;

export const Playground: Story = {};

export const Unselected: Story = { name: 'Non selezionata', args: { selected: false } };

const operators = [
  { id: 'sara', name: 'Sara', color: 'var(--lume-accent)' },
  { id: 'luca', name: 'Luca', color: 'var(--lume-success-fg)' },
  { id: 'giada', name: 'Giada', color: 'var(--lume-warning-fg)' },
  { id: 'omar', name: 'Omar', color: 'var(--lume-info-fg)' },
  { id: 'elena', name: 'Elena', color: 'var(--lume-danger-fg)' },
];

export const OperatorFilter: Story = {
  name: 'Filtro operatori (trascina e seleziona)',
  render: () => {
    function OperatorList() {
      const [order, setOrder] = useState(operators.map((o) => o.id));
      const [visible, setVisible] = useState<string[]>(['sara', 'luca', 'omar']);
      const byId = new Map(operators.map((o) => [o.id, o]));
      const toggle = (id: string) => setVisible((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
      return (
        <div className="surface-card w-[288px] py-1">
          <ListGroupLabel className="px-4 pt-3">Operatori in calendario</ListGroupLabel>
          <ListBox role="listbox" multiple aria-label="Operatori in calendario">
            <Reorder.Group as="div" axis="y" values={order} onReorder={setOrder} className="flex flex-col gap-px">
              {order.map((id) => {
                const op = byId.get(id);
                if (!op) return null;
                return (
                  <ReorderListRow key={id} value={id} selected={visible.includes(id)} onActivate={() => toggle(id)}>
                    <SeriesDot color={op.color} />
                    <span className="flex-1 truncate">{op.name}</span>
                  </ReorderListRow>
                );
              })}
            </Reorder.Group>
          </ListBox>
        </div>
      );
    }
    return <OperatorList />;
  },
};
