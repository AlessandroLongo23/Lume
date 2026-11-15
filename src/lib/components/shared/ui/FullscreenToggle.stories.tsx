import type { Meta, StoryObj } from '@docs/csf';
import { FullscreenToggle } from './FullscreenToggle';

const meta: Meta<typeof FullscreenToggle> = {
  title: 'Azioni/FullscreenToggle',
  component: FullscreenToggle,
  parameters: {
    docs: {
      description: {
        component:
          'An icon button that puts the whole page in fullscreen and back, used in the calendar toolbar. The icon swaps between expand and collapse as the browser enters or leaves fullscreen.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof FullscreenToggle>;

export const Playground: Story = {};

export const InToolbar: Story = {
  render: () => (
    <div className="flex items-center gap-2 surface-card rounded-xl px-3 py-2">
      <span className="text-sm font-medium text-[var(--lume-text)] mr-auto pr-6">Giovedì 30 ottobre</span>
      <FullscreenToggle />
    </div>
  ),
};
