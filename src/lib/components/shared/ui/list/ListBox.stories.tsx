import { useState } from 'react';
import { Archive, Calendar, Copy, Pencil, Scissors, Trash2, UserRound } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { Kbd } from '../Kbd';
import { NumberBadge } from '../NumberBadge';
import { ListBox, ListEmpty, ListGroupLabel, ListRow, ListSeparator } from './ListBox';

const meta: Meta<typeof ListBox> = {
  title: 'Liste/ListBox',
  component: ListBox,
  args: { role: 'listbox', multiple: false },
  argTypes: {
    role: { control: 'radio', options: ['listbox', 'menu', 'list'] },
    multiple: { control: 'boolean' },
    children: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The one list of rows in Lume: menus, select options, pickers and autocomplete suggestions, built from `ListRow`, `ListGroupLabel`, `ListSeparator` and `ListEmpty`. It owns the hover glide, so rows never paint their own hover. Positioning and the floating surface belong to the caller (`FloatingPanel`); a ListBox can also sit inline.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[300px] surface-card">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ListBox>;

const SERVICES = ['Taglio donna', 'Piega', 'Colore', 'Barba', 'Trattamento ristrutturante'];

export const Playground: Story = {
  render: function Render(args) {
    const [value, setValue] = useState('Piega');
    return (
      <ListBox {...args} aria-label="Servizi">
        {SERVICES.map((s) => (
          <ListRow key={s} selected={value === s} onClick={() => setValue(s)}>
            {s}
          </ListRow>
        ))}
      </ListBox>
    );
  },
};

export const WithIconsAndTrailing: Story = {
  render: (args) => (
    <ListBox {...args} role="menu" aria-label="Azioni cliente">
      <ListRow icon={Pencil} trailing={<Kbd>E</Kbd>}>Modifica cliente</ListRow>
      <ListRow icon={Calendar} trailing={<NumberBadge value={3} variant="neutral" size="md" />}>Appuntamenti</ListRow>
      <ListRow icon={Copy}>Duplica</ListRow>
      <ListRow icon={Archive}>Archivia</ListRow>
      <ListSeparator />
      <ListRow icon={Trash2} destructive>Elimina cliente</ListRow>
    </ListBox>
  ),
};

export const WithDescriptions: Story = {
  render: function Render(args) {
    const [value, setValue] = useState('Giulia Rossi');
    const clients = [
      { name: 'Giulia Rossi', hint: '+39 333 123 4567 · ultima visita 12 ottobre' },
      { name: 'Marco Bianchi', hint: '+39 347 765 4321 · ultima visita 3 settembre' },
      { name: 'Francesca Romano', hint: 'Nessuna visita' },
    ];
    return (
      <ListBox {...args} aria-label="Clienti">
        {clients.map((c) => (
          <ListRow key={c.name} icon={UserRound} description={c.hint} selected={value === c.name} onClick={() => setValue(c.name)}>
            {c.name}
          </ListRow>
        ))}
      </ListBox>
    );
  },
};

export const Grouped: Story = {
  render: (args) => (
    <ListBox {...args} aria-label="Servizi">
      <ListGroupLabel>Donna</ListGroupLabel>
      <ListRow icon={Scissors} trailing={<span className="tabular-nums text-xs text-[var(--lume-text-muted)]">35,00 €</span>}>Taglio donna</ListRow>
      <ListRow selected trailing={<span className="tabular-nums text-xs text-[var(--lume-text-muted)]">20,00 €</span>}>Piega</ListRow>
      <ListRow trailing={<span className="tabular-nums text-xs text-[var(--lume-text-muted)]">55,00 €</span>}>Colore</ListRow>
      <ListSeparator />
      <ListGroupLabel>Uomo</ListGroupLabel>
      <ListRow icon={Scissors} trailing={<span className="tabular-nums text-xs text-[var(--lume-text-muted)]">22,00 €</span>}>Taglio uomo</ListRow>
      <ListRow trailing={<span className="tabular-nums text-xs text-[var(--lume-text-muted)]">12,00 €</span>}>Barba</ListRow>
    </ListBox>
  ),
};

/** The keyboard-active row carries `highlighted`; the glide sits on it. Hover other rows to see it travel. */
export const Highlighted: Story = {
  render: (args) => (
    <ListBox {...args} aria-label="Operatori">
      <ListRow>Sara</ListRow>
      <ListRow highlighted>Luca</ListRow>
      <ListRow>Chiara</ListRow>
      <ListRow>Davide</ListRow>
    </ListBox>
  ),
};

export const MultipleSelect: Story = {
  args: { multiple: true },
  render: function Render(args) {
    const [chosen, setChosen] = useState<string[]>(['Taglio donna', 'Colore']);
    const toggle = (s: string) => setChosen((c) => (c.includes(s) ? c.filter((x) => x !== s) : [...c, s]));
    return (
      <ListBox {...args} aria-label="Servizi della fiche">
        {SERVICES.map((s) => (
          <ListRow key={s} selected={chosen.includes(s)} onClick={() => toggle(s)}>
            {s}
          </ListRow>
        ))}
      </ListBox>
    );
  },
};

export const Empty: Story = {
  render: (args) => (
    <ListBox {...args} aria-label="Clienti">
      <ListEmpty>Nessun cliente trovato per «Rossini»</ListEmpty>
    </ListBox>
  ),
};

export const LongText: Story = {
  render: (args) => (
    <ListBox {...args} aria-label="Prodotti">
      <ListRow description="Linea professionale, formato 1000 ml per uso in salone e rivendita">
        Shampoo ristrutturante alla cheratina con olio di argan biologico
      </ListRow>
      <ListRow selected description="Formato da viaggio">Maschera idratante</ListRow>
    </ListBox>
  ),
};
