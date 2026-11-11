import { useEffect, useRef, type ComponentProps } from 'react';
import { Bell, Pencil, Printer, Trash2 } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { Button } from './Button';
import { Tooltip } from './Tooltip';

function FocusedTooltip(props: Omit<ComponentProps<typeof Tooltip>, 'children'>) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const id = setTimeout(() => ref.current?.focus({ focusVisible: true } as FocusOptions), 50);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className="p-12">
      <Tooltip {...props}>
        <Button ref={ref} variant="secondary" iconOnly aria-label={props.label}><Printer /></Button>
      </Tooltip>
    </div>
  );
}

const meta: Meta<typeof Tooltip> = {
  title: 'Feedback/Tooltip',
  component: Tooltip,
  args: { label: 'Modifica fiche', side: 'top' },
  argTypes: {
    label: { control: 'text' },
    shortcut: { control: 'text' },
    side: { control: 'radio', options: ['top', 'right', 'bottom', 'left'] },
    children: { control: false },
  },
  render: (args) => (
    <Tooltip {...args}>
      <Button variant="ghost" iconOnly aria-label={args.label}><Pencil /></Button>
    </Tooltip>
  ),
  parameters: {
    docs: {
      description: {
        component:
          'A short label on hover or keyboard focus, mostly for icon-only buttons, with an optional shortcut chip. Use it in place of a `title` attribute. With no `label` it renders the child unchanged.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Playground: Story = {};

/** Opened on load by focusing the trigger, so the popup is visible without hovering. */
export const Open: Story = {
  args: { label: 'Stampa ricevuta', shortcut: 'P' },
  render: (args) => <FocusedTooltip {...args} />,
};

export const WithShortcut: Story = { args: { label: 'Notifiche', shortcut: '⌘ J' } };

export const Sides: Story = {
  render: () => (
    <div className="flex items-center gap-3 p-12">
      {([['top', 'Sopra'], ['right', 'Destra'], ['bottom', 'Sotto'], ['left', 'Sinistra']] as const).map(([side, label]) => (
        <Tooltip key={side} label={`Tooltip ${label.toLowerCase()}`} side={side}>
          <Button variant="secondary">{label}</Button>
        </Tooltip>
      ))}
    </div>
  ),
};

export const Toolbar: Story = {
  render: () => (
    <div className="flex items-center gap-1">
      <Tooltip label="Modifica"><Button variant="ghost" iconOnly aria-label="Modifica"><Pencil /></Button></Tooltip>
      <Tooltip label="Promemoria"><Button variant="ghost" iconOnly aria-label="Promemoria"><Bell /></Button></Tooltip>
      <Tooltip label="Elimina"><Button variant="ghost-destructive" iconOnly aria-label="Elimina"><Trash2 /></Button></Tooltip>
    </div>
  ),
};
