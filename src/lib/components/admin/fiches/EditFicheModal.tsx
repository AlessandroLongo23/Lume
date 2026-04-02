'use client';

// Re-export the shared EditFicheModal from the calendar module,
// adapting the prop names used by the fiche detail page.
import { EditFicheModal as CalendarEditFicheModal } from '@/lib/components/admin/calendar/EditFicheModal';
import type { Fiche } from '@/lib/types/Fiche';

interface EditFicheModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFiche: Fiche | null;
  editedFiche: Partial<Fiche>;
  onEditedFicheChange: (fiche: Partial<Fiche>) => void;
}

export function EditFicheModal({ isOpen, onClose, selectedFiche }: EditFicheModalProps) {
  return <CalendarEditFicheModal isOpen={isOpen} onClose={onClose} fiche={selectedFiche} />;
}
