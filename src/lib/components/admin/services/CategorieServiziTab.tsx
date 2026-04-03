'use client';

import { useState, useEffect } from 'react';
import { Tag, FileText, Scissors } from 'lucide-react';
import { Table } from '@/lib/components/admin/table/Table';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { AddServiceCategoryModal } from './AddServiceCategoryModal';
import { DeleteCategoryModal } from './DeleteCategoryModal';
import type { ServiceCategory } from '@/lib/types/ServiceCategory';
import type { DataColumn } from '@/lib/types/dataColumn';

// ─── Color + name cell ────────────────────────────────────────────────────────

function ColorNameCell({ color, name }: { color: string; name: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span>{name}</span>
    </div>
  );
}

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMNS: DataColumn[] = [
  {
    label: 'Nome',
    key: 'name',
    sortable: true,
    icon: Tag,
    component: {
      is: ColorNameCell as React.ComponentType<{ color: string; name: string }>,
      getProps: (cat: ServiceCategory) => ({ color: cat.color, name: cat.name }),
    },
  },
  {
    label: 'Descrizione',
    key: 'description',
    sortable: false,
    icon: FileText,
    display: (cat: ServiceCategory) => cat.description || '—',
  },
  {
    label: 'Servizi',
    key: 'service_count',
    sortable: true,
    icon: Scissors,
    display: (cat: ServiceCategory) => String(cat.service_count ?? 0),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface CategorieServiziTabProps {
  addTrigger?: number;
}

export function CategorieServiziTab({ addTrigger }: CategorieServiziTabProps) {
  const categories = useServiceCategoriesStore((s) => s.service_categories);
  const isLoading = useServiceCategoriesStore((s) => s.isLoading);

  const [showAdd, setShowAdd] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState<ServiceCategory | null>(null);

  useEffect(() => {
    if (!addTrigger) return;
    setSelected(null);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowAdd(true);
  }, [addTrigger]);

  const handleEditClick = (e: React.MouseEvent, item: ServiceCategory) => {
    e.stopPropagation();
    setSelected(item);
    setShowAdd(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, item: ServiceCategory) => {
    e.stopPropagation();
    setSelected(item);
    setShowDelete(true);
  };

  return (
    <>
      <AddServiceCategoryModal
        isOpen={showAdd}
        onClose={() => { setShowAdd(false); setSelected(null); }}
        selectedCategory={selected}
      />
      <DeleteCategoryModal
        isOpen={showDelete}
        onClose={() => { setShowDelete(false); setSelected(null); }}
        category={selected}
      />

      <div className="flex flex-col gap-4">
        <Table
          columns={COLUMNS}
          data={categories}
          isLoading={isLoading}
          handleEditClick={handleEditClick}
          handleDeleteClick={handleDeleteClick}
          labelPlural="categorie"
          labelSingular="categoria"
        />
      </div>
    </>
  );
}
