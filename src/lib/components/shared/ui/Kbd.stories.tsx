import type { Meta, StoryObj } from '@docs/csf';
import { Kbd } from './Kbd';

const meta: Meta<typeof Kbd> = {
  title: 'Feedback/Kbd',
  component: Kbd,
  args: { children: 'K' },
  argTypes: { children: { control: 'text' } },
  parameters: {
    docs: {
      description: {
        component:
          'A keyboard key chip for shortcut hints, used in the command palette, the top-bar search trigger and the sidebar.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Kbd>;

export const Playground: Story = {};

export const Shortcut: Story = {
  render: () => (
    <span className="inline-flex items-center gap-1">
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </span>
  ),
};

export const InHint: Story = {
  render: () => (
    <p className="flex items-center gap-1.5 text-sm text-[var(--lume-text-secondary)]">
      Premi <Kbd>N</Kbd> per una nuova fiche, <Kbd>Esc</Kbd> per chiudere.
    </p>
  ),
};
