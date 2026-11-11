import type { Meta, StoryObj } from '@docs/csf';
import { ThemeToggle } from './ThemeToggle';

const meta: Meta<typeof ThemeToggle> = {
  title: 'Azioni/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    docs: {
      description: {
        component:
          'An icon button that switches between light and dark theme through `ThemeProvider`. The sun and moon icons follow the `.dark` class on the page, so the canvas theme switch shows both states. In the canvas it is rendered without ThemeProvider, so a click does nothing here.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ThemeToggle>;

export const Playground: Story = {};

export const InTopBar: Story = {
  render: () => (
    <div className="flex items-center gap-2 surface-card rounded-xl px-3 py-2">
      <span className="text-sm text-[var(--lume-text-secondary)] mr-auto pr-6">Aspetto</span>
      <ThemeToggle />
    </div>
  ),
};
