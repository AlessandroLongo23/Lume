import type { Meta, StoryObj } from '@docs/csf';
import { StepMarker } from './StepMarker';

const meta: Meta<typeof StepMarker> = {
  title: 'Feedback/StepMarker',
  component: StepMarker,
  args: { index: 2, state: 'current' },
  argTypes: {
    index: { control: 'number' },
    state: { control: 'radio', options: ['done', 'current', 'todo'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The numbered circle of a multi-step flow, shared by the sign-up progress bar and the public booking steps. A done step shows a check, the current one is highlighted, the rest are a plain outline.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof StepMarker>;

export const Playground: Story = {};

export const States: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <StepMarker index={1} state="done" />
      <StepMarker index={2} state="current" />
      <StepMarker index={3} state="todo" />
    </div>
  ),
};

export const BookingSteps: Story = {
  render: () => (
    <ol className="flex flex-col gap-3 text-sm">
      {[
        ['Servizio', 'done'],
        ['Operatore', 'done'],
        ['Data e ora', 'current'],
        ['Conferma', 'todo'],
      ].map(([label, state], i) => (
        <li key={label} className="flex items-center gap-3">
          <StepMarker index={i + 1} state={state as 'done' | 'current' | 'todo'} />
          <span className={state === 'todo' ? 'text-[var(--lume-text-muted)]' : 'text-[var(--lume-text)]'}>{label}</span>
        </li>
      ))}
    </ol>
  ),
};
