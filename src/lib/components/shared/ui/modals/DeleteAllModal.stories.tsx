import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { Meta, StoryObj } from '@docs/csf';
import { Button } from '../Button';
import { DeleteAllModal } from './DeleteAllModal';

const meta: Meta<typeof DeleteAllModal> = {
  title: 'Sovrapposizioni/DeleteAllModal',
  component: DeleteAllModal,
  args: { isOpen: true, entityLabel: 'Clienti', count: 248, mode: 'all' },
  argTypes: {
    isOpen: { control: 'boolean' },
    entityLabel: { control: 'text' },
    count: { control: 'number' },
    mode: { control: 'radio', options: ['all', 'selected'] },
    cascadeNotice: { control: false },
    onClose: { control: false },
    onConfirm: { control: false },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The bulk delete of a whole table (`mode="all"`) or of the selected rows (`mode="selected"`). The user must type ELIMINA TUTTO or ELIMINA to enable the button; it shows a toast with the outcome.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof DeleteAllModal>;

export const Playground: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(args.isOpen);
    return (
      <>
        <div className="min-h-[600px] p-8">
          <Button variant="ghost-destructive" leadingIcon={Trash2} onClick={() => setOpen(true)}>Elimina tutti</Button>
        </div>
        <DeleteAllModal
          {...args}
          isOpen={open}
          onClose={() => setOpen(false)}
          onConfirm={() => new Promise((resolve) => setTimeout(resolve, 800))}
        />
      </>
    );
  },
};

export const Selected: Story = { ...Playground, args: { mode: 'selected', count: 12 } };

export const WithCascadeNotice: Story = {
  ...Playground,
  args: { cascadeNotice: 'Spariranno anche le loro 1.920 fiche, gli appuntamenti futuri e i coupon assegnati.' },
};

export const Products: Story = { ...Playground, args: { entityLabel: 'Prodotti', count: 87 } };
