import type { Meta, StoryObj } from '@docs/csf';
import { NumberBadge } from './NumberBadge';

const meta: Meta<typeof NumberBadge> = {
  title: 'Feedback/NumberBadge',
  component: NumberBadge,
  args: { value: 12, variant: 'neutral', size: 'md' },
  argTypes: {
    value: { control: 'number' },
    max: { control: 'number' },
    variant: { control: 'radio', options: ['neutral', 'strong', 'accent'] },
    size: { control: 'radio', options: ['sm', 'md'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A count in a small pill, beside a filter button or a menu item. `strong` marks the count of a filter that is applied (and of the selected tab), `accent` is for counts that need attention such as unread notifications. `md` (20px) is the default; `sm` (16px) sits on an icon button or inside a dense row. `max` caps the number shown ("99+"). Tabs take a `count` on `TabButton`, which picks the variant from the selection.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof NumberBadge>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <NumberBadge value={8} variant="neutral" />
      <NumberBadge value={8} variant="strong" />
      <NumberBadge value={3} variant="accent" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <NumberBadge value={24} size="sm" />
      <NumberBadge value={24} size="md" />
    </div>
  ),
};

export const Capped: Story = { args: { value: 248, max: 99, variant: 'accent' } };
