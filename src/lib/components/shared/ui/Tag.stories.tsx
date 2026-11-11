import type { Meta, StoryObj } from '@docs/csf';
import { FlaskConical } from 'lucide-react';
import { Tag } from './Tag';

const meta: Meta<typeof Tag> = {
  title: 'Feedback/Tag',
  component: Tag,
  args: { children: 'Nuovo' },
  argTypes: { children: { control: 'text' } },
  parameters: {
    docs: {
      description: {
        component:
          'A small neutral label beside a name, such as "Test", "Tuo" or "Nuovo", with an optional leading icon (sized for you). It is not a status (use StatusDot) and not a count (use NumberBadge); the larger chip beside a detail-page title is `DetailChip`.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Tag>;

export const Playground: Story = {};

export const BesideName: Story = {
  render: () => (
    <ul className="flex flex-col gap-2 text-sm text-[var(--lume-text)]">
      <li className="flex items-center gap-2">Giulia Rossi <Tag>Nuovo</Tag></li>
      <li className="flex items-center gap-2">Sara <Tag>Tuo</Tag></li>
      <li className="flex items-center gap-2">Salone demo <Tag><FlaskConical aria-hidden />Test</Tag></li>
    </ul>
  ),
};

export const LongText: Story = { args: { children: 'Cliente dal 2019' } };
