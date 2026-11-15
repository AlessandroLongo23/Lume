import { useState } from 'react';
import type { Meta, StoryObj } from '@docs/csf';
import { Button } from './Button';
import { ConciergeImportModal } from './ConciergeImportModal';

const meta: Meta<typeof ConciergeImportModal> = {
  title: 'Sovrapposizioni/ConciergeImportModal',
  component: ConciergeImportModal,
  args: { isOpen: true },
  argTypes: {
    isOpen: { control: 'boolean' },
    entity: {
      control: 'select',
      options: [undefined, 'clients', 'products', 'services', 'operators', 'fiches'],
    },
    onClose: { control: false },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The free data migration dialog. With an `entity` it sends CSV, Excel or PDF files through the automatic import pipeline and opens the review page; without one (or for other files) it emails them to the Lume team. In the canvas the upload calls do nothing.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ConciergeImportModal>;

export const Playground: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(args.isOpen);
    return (
      <>
        <div className="min-h-[600px] p-8">
          <Button onClick={() => setOpen(true)}>Importa dal vecchio gestionale</Button>
        </div>
        <ConciergeImportModal {...args} isOpen={open} onClose={() => setOpen(false)} />
      </>
    );
  },
};

export const AutoImportClients: Story = { ...Playground, args: { entity: 'clients' } };

export const WithTrigger: Story = { ...Playground, args: { isOpen: false } };
