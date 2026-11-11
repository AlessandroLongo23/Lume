import { Plus, Trash2, Download, ChevronDown, Pencil } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Azioni/Button',
  component: Button,
  args: { children: 'Salva', variant: 'secondary', size: 'md' },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'ghost-destructive', 'destructive'] },
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The one button. Indigo `primary` is for the single main action of a screen; most buttons are `secondary` or `ghost`. Solid `destructive` only performs a deletion inside its confirmation; the button that opens the confirmation is `ghost-destructive` (ghost at rest, red on hover). Icon-only ghost buttons rest muted. `md` grows to 44px on touch screens. Use `asChild` to style a link, `pressed` for a toggle.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} variant="primary">Nuova fiche</Button>
      <Button {...args} variant="secondary">Annulla</Button>
      <Button {...args} variant="ghost">Dettagli</Button>
      <Button {...args} variant="ghost-destructive" leadingIcon={Trash2}>Elimina cliente</Button>
      <Button {...args} variant="destructive">Elimina</Button>
      <Button {...args} variant="ghost-destructive" iconOnly aria-label="Elimina"><Trash2 /></Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Button {...args} size="sm">Piccolo</Button>
      <Button {...args} size="md">Medio</Button>
      <Button {...args} size="lg">Grande</Button>
    </div>
  ),
};

export const WithIcons: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Button {...args} variant="primary" leadingIcon={Plus}>Nuovo cliente</Button>
      <Button {...args} leadingIcon={Download}>Esporta</Button>
      <Button {...args} variant="ghost" trailingIcon={ChevronDown}>Ordina</Button>
      <Button {...args} variant="ghost" iconOnly aria-label="Modifica"><Pencil /></Button>
    </div>
  ),
};

export const Pressed: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Button {...args} variant="ghost" pressed>Attivi</Button>
      <Button {...args} variant="ghost" pressed={false}>Archiviati</Button>
    </div>
  ),
};

export const Loading: Story = { args: { loading: true, variant: 'primary', children: 'Salvataggio' } };

export const Disabled: Story = { args: { disabled: true } };

export const AsLink: Story = {
  render: (args) => (
    <Button {...args} asChild variant="secondary">
      <a href="#">Apri il calendario</a>
    </Button>
  ),
};
