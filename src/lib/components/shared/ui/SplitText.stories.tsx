import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@docs/csf';
import { Button } from './Button';
import { SplitText } from './SplitText';

// Remount on demand: the reveal plays once per mount.
function Replay(props: ComponentProps<typeof SplitText>) {
  const [run, setRun] = useState(0);
  return (
    <div className="flex flex-col items-center gap-6">
      <SplitText key={run} {...props} />
      <Button size="sm" variant="ghost" onClick={() => setRun((n) => n + 1)}>Ripeti</Button>
    </div>
  );
}

const meta: Meta<typeof SplitText> = {
  title: 'Layout/SplitText',
  component: SplitText,
  args: {
    children: 'Benvenuta in Lume, Giulia',
    className: 'text-2xl font-light tracking-tight text-[var(--lume-text)]',
  },
  argTypes: {
    children: { control: 'text' },
  },
  render: (args) => <Replay {...args} />,
  parameters: {
    docs: {
      description: {
        component:
          'A centred line that reveals letter by letter when it enters the viewport (GSAP SplitText): letters rise 14px and fade in, 22ms apart. Used for the welcome and onboarding greetings; keep it for one line per screen. To play a new line, remount it with a new `key`.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof SplitText>;

export const Playground: Story = {};

export const WithAccent: Story = {
  render: (args) => (
    <Replay className={args.className}>
      Ciao <span className="text-[var(--lume-accent)]">Sara</span>, iniziamo
    </Replay>
  ),
};
