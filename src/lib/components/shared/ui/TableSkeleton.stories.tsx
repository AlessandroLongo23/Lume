import type { Meta, StoryObj } from '@docs/csf';
import { TableSkeleton } from './TableSkeleton';

const meta: Meta<typeof TableSkeleton> = {
  title: 'Feedback/TableSkeleton',
  component: TableSkeleton,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The loading placeholder for a list page: a toolbar and a table of pulsing bars with uneven widths, shown while the first fetch runs.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof TableSkeleton>;

export const Playground: Story = {};

export const Narrow: Story = {
  render: () => (
    <div className="w-[420px]">
      <TableSkeleton />
    </div>
  ),
};
