'use client';

import { useState } from 'react';
import { useFichesStore } from '@/lib/stores/fiches';
import { Fiche } from '@/lib/types/Fiche';
import { Table } from '@/lib/components/admin/table/Table';
import { EditFicheModal } from './EditFicheModal';
import { DeleteFicheModal } from './DeleteFicheModal';

interface FichesTableProps {
  fiches: Fiche[];
}

export function FichesTable({ fiches }: FichesTableProps) {
  const isLoading = useFichesStore((s) => s.isLoading);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedFiche, setSelectedFiche] = useState<Fiche | null>(null);
  const [editedFiche, setEditedFiche] = useState<Partial<Fiche>>({});

  const handleEditClick = (e: React.MouseEvent, fiche: Fiche) => {
    e.stopPropagation();
    setSelectedFiche(fiche);
    setEditedFiche({ ...fiche });
    setShowEdit(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, fiche: Fiche) => {
    e.stopPropagation();
    setSelectedFiche(fiche);
    setShowDelete(true);
  };

  return (
    <>
      <Table
        columns={Fiche.dataColumns}
        data={fiches}
        handleEditClick={handleEditClick}
        handleDeleteClick={handleDeleteClick}
        detailPageUrl="fiches"
        isLoading={isLoading}
        labelPlural="fiches"
        labelSingular="fiche"
      />
      <EditFicheModal isOpen={showEdit} onClose={() => setShowEdit(false)} editedFiche={editedFiche} onEditedFicheChange={setEditedFiche} selectedFiche={selectedFiche} />
      <DeleteFicheModal isOpen={showDelete} onClose={() => setShowDelete(false)} selectedFiche={selectedFiche} />
    </>
  );
}
