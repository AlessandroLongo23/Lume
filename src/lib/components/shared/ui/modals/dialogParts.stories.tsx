import type { Meta, StoryObj } from '@docs/csf';
import { Button } from '../Button';
import { DIALOG_SURFACE, DialogFooter, DialogHeader } from './dialogParts';

const noop = () => {};

const meta: Meta<typeof DialogHeader> = {
  title: 'Sovrapposizioni/DialogParts',
  component: DialogHeader,
  args: { title: 'Modifica appuntamento', subtitle: 'Giulia Rossi · giovedì 30 ottobre, 10:30', divider: false, closeDisabled: false },
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    divider: { control: 'boolean' },
    closeDisabled: { control: 'boolean' },
    onClose: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The shared dialog language: `DIALOG_SURFACE` (raised card, float shadow, no border; Modal applies it), `DialogHeader` (weight-500 title, optional subtitle and close button) and `DialogFooter` (actions on the right under a hairline, optional `start` slot). Every dialog in Lume is built from these.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className={`w-[440px] flex flex-col ${DIALOG_SURFACE}`}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof DialogHeader>;

export const Playground: Story = {
  render: (args) => (
    <>
      <DialogHeader {...args} onClose={noop} />
      <div className="px-6 py-4 text-sm text-[var(--lume-text-secondary)]">Contenuto della finestra.</div>
      <DialogFooter>
        <Button variant="ghost">Annulla</Button>
        <Button variant="primary">Salva</Button>
      </DialogFooter>
    </>
  ),
};

export const HeaderWithDivider: Story = { ...Playground, args: { divider: true } };

export const HeaderWithoutClose: Story = {
  render: (args) => <DialogHeader {...args} subtitle={undefined} />,
};

export const FooterWithStart: Story = {
  render: (args) => (
    <>
      <DialogHeader {...args} onClose={noop} />
      <DialogFooter start="Ultima modifica di Sara, 28 ottobre">
        <Button variant="ghost">Annulla</Button>
        <Button variant="primary">Salva</Button>
      </DialogFooter>
    </>
  ),
};

export const LongTitle: Story = {
  ...Playground,
  args: { title: 'Trattamento ristrutturante con cheratina e piega lunga', subtitle: 'Il titolo si tronca su una riga; il sottotitolo va a capo quando serve, come in questo caso.' },
};
