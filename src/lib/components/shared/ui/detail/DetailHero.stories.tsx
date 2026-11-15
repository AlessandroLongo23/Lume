import { Archive, KeyRound, Mail, Package, Phone, Plane, Trash2 } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { DetailHero } from './DetailHero';
import { DetailHeroActions } from './DetailHeroActions';
import { HeroAvatar, HeroIconTile } from './HeroAvatar';
import { DetailChip } from './DetailChip';
import { ContactRow } from './ContactRow';
import { StatusDot } from '../StatusDot';
import { messagePopup } from '../messagePopup/messagePopup';

const noop = () => {};
const copy = () => messagePopup.getState().success('Copiato negli appunti');

const actions = (
  <DetailHeroActions
    isEditing={false}
    onEdit={noop}
    onCancel={noop}
    onSave={noop}
    menuItems={[
      { label: 'Archivia', icon: Archive, onClick: noop },
      { label: 'Elimina', icon: Trash2, onClick: noop, destructive: true },
    ]}
  />
);

const meta: Meta<typeof DetailHero> = {
  title: 'Layout/DetailHero',
  component: DetailHero,
  args: {
    title: 'Giulia Rossi',
    onBack: noop,
    avatar: <HeroAvatar initials="GR" />,
    meta: (
      <>
        <span>Donna</span>
        <span aria-hidden>·</span>
        <span>nata il 14 maggio 1991</span>
      </>
    ),
    chips: (
      <DetailChip icon={KeyRound} onClick={noop}>
        Senza account · Aggiungi credenziali
      </DetailChip>
    ),
    aside: (
      <div className="flex flex-col gap-1 max-w-70">
        <ContactRow icon={Mail} value="giulia.rossi@gmail.com" emptyLabel="Nessuna email" onCopy={copy} />
        <ContactRow icon={Phone} value="+39 347 812 4590" emptyLabel="Nessun telefono" onCopy={copy} />
      </div>
    ),
    actions,
  },
  argTypes: {
    title: { control: 'text' },
    onBack: { control: false },
    avatar: { control: false },
    meta: { control: false },
    chips: { control: false },
    aside: { control: false },
    actions: { control: false },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The header of a detail page (client, operator, product): back button, avatar or icon tile, title with chips, a meta line, an optional `aside` (contacts, shown from lg up) and the actions. Fill the slots with `HeroAvatar`, `DetailChip`, `ContactRow` and `DetailHeroActions`.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof DetailHero>;

export const Playground: Story = {};

export const Minimal: Story = {
  name: 'Solo titolo',
  args: { title: 'Marco Bianchi', avatar: <HeroAvatar initials="MB" />, meta: undefined, chips: undefined, aside: undefined },
};

export const Archived: Story = {
  name: 'Archiviato',
  args: {
    title: 'Paolo Esposito',
    avatar: <HeroAvatar initials="PE" />,
    chips: (
      <>
        <StatusDot tone="warning" className="text-xs">Archiviato</StatusDot>
        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--lume-text)]">
          <Plane className="size-3.5 text-[var(--lume-text-muted)]" aria-hidden />
          Turista
        </span>
      </>
    ),
    actions: (
      <DetailHeroActions
        isEditing={false}
        isLocked
        onEdit={noop}
        onCancel={noop}
        onSave={noop}
        menuItems={[{ label: 'Ripristina', icon: Archive, onClick: noop }]}
      />
    ),
  },
};

export const Editing: Story = {
  name: 'In modifica',
  args: {
    aside: undefined,
    actions: <DetailHeroActions isEditing isDirty onEdit={noop} onCancel={noop} onSave={noop} menuItems={[]} />,
  },
};

export const Product: Story = {
  name: 'Prodotto (HeroIconTile)',
  args: {
    title: 'Shampoo idratante 250 ml',
    avatar: <HeroIconTile icon={Package} />,
    meta: (
      <>
        <span>Rivendita</span>
        <span aria-hidden>·</span>
        <span className="tabular-nums">18,50 €</span>
      </>
    ),
    chips: <StatusDot tone="warning" className="text-xs">Scorta bassa · 3 pezzi</StatusDot>,
    aside: undefined,
  },
};

export const LongTitle: Story = {
  name: 'Nome lungo',
  args: { title: 'Maria Antonietta Dell’Acqua Santangelo Bianchi', avatar: <HeroAvatar initials="MD" /> },
};
