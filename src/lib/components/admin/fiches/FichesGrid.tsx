'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { FicheCard } from './FicheCard';
import { FicheModal } from '@/lib/components/admin/fiches/FicheModal';
import { DeleteFicheModal } from './DeleteFicheModal';
import type { Fiche } from '@/lib/types/Fiche';

interface FichesGridProps {
  fiches: Fiche[];
}

export function FichesGrid({ fiches }: FichesGridProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedFiche, setSelectedFiche] = useState<Fiche | null>(null);
  const [editInitialView, setEditInitialView] = useState<'edit' | 'payment'>('edit');

  return (
    <div className="flex flex-col gap-4">
      {fiches.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
          <Calendar className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mb-3" />
          <h3 className="text-lg font-medium text-zinc-600 dark:text-zinc-400">Nessuna fiche trovata</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fiches.map((fiche) => (
            <FicheCard
              key={fiche.id}
              fiche={fiche}
              onEdit={(f) => { setSelectedFiche(f); setEditInitialView('edit'); setShowEdit(true); }}
              onDelete={(f) => { setSelectedFiche(f); setShowDelete(true); }}
              onCheckout={(f) => { setSelectedFiche(f); setEditInitialView('payment'); setShowEdit(true); }}
            />
          ))}
        </div>
      )}

      <FicheModal
        mode="edit"
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        fiche={selectedFiche}
        initialView={editInitialView}
      />
      <DeleteFicheModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        selectedFiche={selectedFiche}
      />
    </div>
  );
}
