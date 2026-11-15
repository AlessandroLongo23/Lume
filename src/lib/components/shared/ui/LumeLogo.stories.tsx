import type { Meta, StoryObj } from '@docs/csf';
import { LumeLogo } from './LumeLogo';

const meta: Meta<typeof LumeLogo> = {
  title: 'Layout/LumeLogo',
  component: LumeLogo,
  args: { size: 'md' },
  argTypes: { size: { control: 'radio', options: ['sm', 'md', 'lg'] } },
  parameters: {
    docs: {
      description: {
        component:
          'The Lume wordmark with its lightbulb mark, for page headers on auth, error and public pages. It inherits the text colour around it.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof LumeLogo>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6 text-[var(--lume-text)]">
      <LumeLogo size="sm" />
      <LumeLogo size="md" />
      <LumeLogo size="lg" />
    </div>
  ),
};
