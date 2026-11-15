import { useEffect } from 'react';
import type { Meta, StoryObj } from '@docs/csf';
import { Button } from '../Button';
import { messagePopup } from './messagePopup';
import { MessagePopupContainer } from './MessagePopupContainer';

function StickyToasts() {
  useEffect(() => {
    const toast = messagePopup.getState();
    toast.show('Fiche salvata', 'success', 0);
    toast.show('Salvataggio non riuscito', 'error', 0);
    toast.show('Giulia Rossi, domani alle 10:30', 'info', 0, 'Appuntamento confermato');
    return () => messagePopup.setState({ messages: [] });
  }, []);
  return <Button onClick={() => messagePopup.setState({ messages: [] })}>Chiudi tutti</Button>;
}

const meta: Meta<typeof MessagePopupContainer> = {
  title: 'Feedback/Toast',
  component: MessagePopupContainer,
  render: () => {
    const toast = messagePopup.getState();
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => toast.success('Fiche salvata')}>Successo</Button>
        <Button onClick={() => toast.error('Salvataggio non riuscito')}>Errore</Button>
        <Button onClick={() => toast.info('Giulia Rossi ha confermato l’appuntamento')}>Info</Button>
        <Button
          variant="ghost"
          onClick={() => toast.show('L’esportazione dei clienti è pronta.', 'success', 6000, 'Esportazione completata')}
        >
          Con titolo
        </Button>
      </div>
    );
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Short-lived notifications in the top-right corner, fired from anywhere with `messagePopup.getState().success(...)`, `.error(...)` or `.info(...)`. The container is mounted once in the app root; the buttons below fire real toasts.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof MessagePopupContainer>;

export const Playground: Story = {};

/** Fires one toast of each type on load; they stay until dismissed or the story unmounts. */
export const AllTypes: Story = {
  render: () => <StickyToasts />,
};
