import { useState } from 'react';
import type { Meta, StoryObj } from '@docs/csf';
import { StarRating } from './StarRating';

function StatefulRating({ initial }: { initial: number }) {
  const [value, setValue] = useState(initial);
  return <StarRating value={value} onChange={setValue} />;
}

const meta: Meta<typeof StarRating> = {
  title: 'Feedback/StarRating',
  component: StarRating,
  args: { value: 0 },
  argTypes: {
    value: { control: 'number' },
    onChange: { control: false },
  },
  render: (args) => <StatefulRating initial={args.value} />,
  parameters: {
    docs: {
      description: {
        component:
          'A five-star picker for the review a client leaves after an appointment. Hover previews the rating, a click sets it and the number beside the stars rolls to the new value.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof StarRating>;

export const Playground: Story = {};

export const Rated: Story = { args: { value: 4 } };

export const InReviewForm: Story = {
  render: () => (
    <div className="surface-card rounded-xl p-5 flex flex-col gap-3 w-[360px]">
      <p className="text-sm font-medium text-[var(--lume-text)]">Com&apos;è andato il tuo Taglio donna con Sara?</p>
      <StatefulRating initial={5} />
    </div>
  ),
};
