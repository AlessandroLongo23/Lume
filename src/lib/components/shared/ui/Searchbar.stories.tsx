import { useState } from 'react';
import type { Meta, StoryObj } from '@docs/csf';
import { Searchbar } from './Searchbar';
import { useSearchStore } from '@/lib/stores/search';

const meta: Meta<typeof Searchbar> = {
  title: 'Moduli/Searchbar',
  component: Searchbar,
  args: { placeholder: 'Cerca cliente…' },
  argTypes: {
    placeholder: { control: 'text' },
    value: { control: false },
    onChange: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The search box. Without `value` / `onChange` it drives the page-wide search store and focuses on ⌘K / Ctrl+K; pass both to use it as a plain controlled filter, as table toolbars do.',
      },
    },
  },
  decorators: [(Story) => <div className="w-[320px]"><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof Searchbar>;

export const Playground: Story = {
  render: function Render(args) {
    const [q, setQ] = useState('');
    return <Searchbar {...args} value={q} onChange={setQ} />;
  },
};

export const StoreMode: Story = {
  name: 'Global search (store)',
  decorators: [
    (Story) => {
      // Seed the shared store once so the canvas opens with a query in it.
      if (!useSearchStore.getState().query) useSearchStore.setState({ query: 'Giulia' });
      return <Story />;
    },
  ],
  render: function Render() {
    const query = useSearchStore((s) => s.query);
    return (
      <div className="flex flex-col gap-2">
        <Searchbar placeholder="Cerca clienti, fiche, servizi… (⌘K)" />
        <p className="text-xs text-[var(--lume-text-muted)]">Query nello store: <span className="tabular-nums">{query || '—'}</span></p>
      </div>
    );
  },
};

export const WithValue: Story = {
  render: function Render() {
    const [q, setQ] = useState('Marco Bianchi');
    return <Searchbar value={q} onChange={setQ} placeholder="Cerca cliente…" />;
  },
};

