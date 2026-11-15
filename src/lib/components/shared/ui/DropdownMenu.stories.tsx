import { useEffect, useRef } from 'react';
import { Archive, CalendarPlus, Copy, Mail, Pencil, Trash2 } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { DropdownMenu, type DropdownMenuItem } from './DropdownMenu';

const noop = () => {};

const ITEMS: DropdownMenuItem[] = [
  { label: 'Modifica cliente', icon: Pencil, onClick: noop },
  { label: 'Nuovo appuntamento', icon: CalendarPlus, onClick: noop },
  { label: 'Invia promemoria', icon: Mail, onClick: noop, badge: 2 },
  { label: 'Duplica', icon: Copy, onClick: noop },
  { label: 'Archivia', icon: Archive, onClick: noop },
  { label: 'Elimina cliente', icon: Trash2, onClick: noop, destructive: true },
];

const meta: Meta<typeof DropdownMenu> = {
  title: 'Sovrapposizioni/DropdownMenu',
  component: DropdownMenu,
  args: { items: ITEMS },
  argTypes: {
    items: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The "⋯" actions menu: an icon button that opens a `FloatingPanel` holding a `ListBox` with role menu. A destructive action is always set apart by a separator, added for you.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof DropdownMenu>;

export const Playground: Story = {};

/** Opens on load (the story clicks the trigger once mounted). */
export const Open: Story = {
  render: function Render(args) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
      const id = setTimeout(() => ref.current?.querySelector('button')?.click(), 50);
      return () => clearTimeout(id);
    }, []);
    return (
      <div ref={ref} className="h-[360px] flex items-start pt-4">
        <DropdownMenu {...args} />
      </div>
    );
  },
};

export const Short: Story = {
  args: {
    items: [
      { label: 'Modifica', icon: Pencil, onClick: noop },
      { label: 'Elimina', icon: Trash2, onClick: noop, destructive: true },
    ],
  },
  render: Open.render,
};
