import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Meta, StoryObj } from '@docs/csf';
import { ColumnPicker } from './ColumnPicker';
import { usePreferencesStore } from '@/lib/stores/preferences';

interface ClientRow {
  name: string;
  phone: string;
  email: string;
  lastVisit: string;
  spent: number;
  gender: string;
  tourist: boolean;
}

const columns: ColumnDef<ClientRow>[] = [
  { id: 'select', header: '', meta: { lockedInPicker: true } },
  { accessorKey: 'name', header: 'Nome', meta: { requiredVisible: true } },
  { accessorKey: 'phone', header: 'Telefono' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'lastVisit', header: 'Ultima visita' },
  { accessorKey: 'spent', header: 'Spesa totale' },
  { accessorKey: 'gender', header: 'Sesso' },
  { accessorKey: 'tourist', header: 'Turista' },
  { id: 'actions', header: '', meta: { lockedInPicker: true } },
];

/**
 * Seeds the preferences store once and keeps writes local: the real
 * updatePreferences PATCHes /api/preferences, which the canvas cannot reach.
 */
function SeededPrefs({ hidden, children }: { hidden: string[]; children: ReactNode }) {
  useState(() => {
    usePreferencesStore.setState({
      preferences: { tableColumns: { 'docs-clienti': { order: [], hidden } } },
      updatePreferences: async (patch) => {
        usePreferencesStore.setState((s) => ({
          preferences: { ...s.preferences, ...patch, tableColumns: { ...s.preferences.tableColumns, ...patch.tableColumns } },
        }));
      },
    });
    return true;
  });
  return <>{children}</>;
}

function OpenOnMount({ children }: { children: ReactNode }) {
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
  return <div ref={ref} className="h-[440px] pt-4 pl-[200px]">{children}</div>;
}

const meta: Meta<typeof ColumnPicker<ClientRow>> = {
  title: 'Dati/ColumnPicker',
  component: ColumnPicker<ClientRow>,
  args: { tableId: 'docs-clienti', columns },
  argTypes: {
    columns: { control: false },
    className: { control: 'text' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The "Colonne" button of a table toolbar: a checklist to show or hide columns and a grip to reorder them, saved per user in the preferences store under `tableId`. Columns marked `requiredVisible` stay on ("sempre"); `lockedInPicker` columns (selection, actions) are left out of the list.',
      },
    },
  },
  render: (args) => (
    <SeededPrefs hidden={[]}>
      <ColumnPicker {...args} />
    </SeededPrefs>
  ),
};
export default meta;

type Story = StoryObj<typeof ColumnPicker<ClientRow>>;

export const Playground: Story = {};

export const Open: Story = {
  name: 'Aperto',
  parameters: { layout: 'padded' },
  decorators: [(Story) => <OpenOnMount><Story /></OpenOnMount>],
};

export const SomeHidden: Story = {
  name: 'Colonne nascoste',
  parameters: { layout: 'padded' },
  render: (args) => (
    <SeededPrefs hidden={['email', 'gender']}>
      <ColumnPicker {...args} />
    </SeededPrefs>
  ),
  decorators: [(Story) => <OpenOnMount><Story /></OpenOnMount>],
};
