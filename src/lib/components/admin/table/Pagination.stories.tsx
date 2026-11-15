import { useState } from 'react';
import type { Meta, StoryObj } from '@docs/csf';
import { Pagination } from './Pagination';

const meta: Meta<typeof Pagination> = {
  title: 'Navigazione/Pagination',
  component: Pagination,
  args: { currentPage: 1, totalItems: 137, itemsPerPage: 25, labelPlural: 'clienti' },
  argTypes: {
    onPageChange: { control: false },
    currentPage: { control: 'number' },
    totalItems: { control: 'number' },
    itemsPerPage: { control: 'number' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Footer of a paged table: the range shown ("1–25 di 137 clienti") on the left, first/previous/next/last buttons on the right. The buttons hide when everything fits on one page, and an out-of-range page is pulled back into range.',
      },
    },
  },
  render: (args) => {
    function Paged() {
      const [page, setPage] = useState(args.currentPage);
      return (
        <div className="w-[640px]">
          <Pagination {...args} currentPage={page} onPageChange={setPage} />
        </div>
      );
    }
    return <Paged key={`${args.currentPage}-${args.totalItems}-${args.itemsPerPage}`} />;
  },
};
export default meta;

type Story = StoryObj<typeof Pagination>;

export const Playground: Story = {};

export const MiddlePage: Story = { args: { currentPage: 3 } };

export const LastPage: Story = { args: { currentPage: 6 } };

export const SinglePage: Story = { name: 'Una sola pagina', args: { totalItems: 12 } };

export const Empty: Story = { name: 'Nessun risultato', args: { totalItems: 0 } };

export const ManyPages: Story = {
  args: { totalItems: 4820, itemsPerPage: 50, currentPage: 42, labelPlural: 'fiches' },
};
