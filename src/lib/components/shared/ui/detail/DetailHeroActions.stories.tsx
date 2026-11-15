import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Archive, Printer, Trash2 } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { DetailHeroActions } from './DetailHeroActions';
import type { DropdownMenuItem } from '../DropdownMenu';

const noop = () => {};

const menuItems: DropdownMenuItem[] = [
  { label: 'Stampa scheda', icon: Printer, onClick: noop },
  { label: 'Archivia', icon: Archive, onClick: noop },
  { label: 'Elimina', icon: Trash2, onClick: noop, destructive: true },
];

const meta: Meta<typeof DetailHeroActions> = {
  title: 'Layout/DetailHeroActions',
  component: DetailHeroActions,
  args: { isEditing: false, isLocked: false, saving: false, isDirty: true, menuItems, onEdit: noop, onCancel: noop, onSave: noop },
  argTypes: {
    onEdit: { control: false },
    onCancel: { control: false },
    onSave: { control: false },
    menuItems: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The action cluster of a `DetailHero`. At rest it shows "Modifica" and a "⋯" menu; while editing it swaps to "Annulla" and "Salva" (disabled until something changes). `isLocked` hides "Modifica" for archived records.',
      },
    },
  },
  render: (args) => (
    <div className="flex items-center gap-2">
      <DetailHeroActions {...args} />
    </div>
  ),
};
export default meta;

type Story = StoryObj<typeof DetailHeroActions>;

export const Playground: Story = {};

export const Interactive: Story = {
  name: 'Interattivo',
  render: (args) => {
    function Flow() {
      const [editing, setEditing] = useState(false);
      const [saving, setSaving] = useState(false);
      const save = () => {
        setSaving(true);
        setTimeout(() => {
          setSaving(false);
          setEditing(false);
        }, 1200);
      };
      return (
        <div className="flex items-center gap-2">
          <DetailHeroActions
            {...args}
            isEditing={editing}
            saving={saving}
            onEdit={() => setEditing(true)}
            onCancel={() => setEditing(false)}
            onSave={save}
          />
        </div>
      );
    }
    return <Flow />;
  },
};

export const Editing: Story = { name: 'In modifica', args: { isEditing: true } };

export const EditingUnchanged: Story = { name: 'In modifica, nessuna modifica', args: { isEditing: true, isDirty: false } };

export const Saving: Story = { name: 'Salvataggio', args: { isEditing: true, saving: true } };

export const Locked: Story = { name: 'Bloccato (archiviato)', args: { isLocked: true } };

/** Opens the "⋯" menu once on load. */
function OpenMenuOnMount({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => {
      if (done.current) return;
      done.current = true;
      ref.current?.querySelector<HTMLButtonElement>('button[aria-haspopup]')?.click();
    }, 50);
    return () => clearTimeout(t);
  }, []);
  return <div ref={ref} className="h-[260px] pt-4 pl-[200px]">{children}</div>;
}

export const MenuOpen: Story = {
  name: 'Menu aperto',
  decorators: [(Story) => <OpenMenuOnMount><Story /></OpenMenuOnMount>],
};
