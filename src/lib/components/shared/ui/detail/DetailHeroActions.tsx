'use client';

import { Edit, Save, X } from 'lucide-react';
import { DropdownMenu, type DropdownMenuItem } from '@/lib/components/shared/ui/DropdownMenu';
import { Button } from '@/lib/components/shared/ui/Button';

interface DetailHeroActionsProps {
  isEditing: boolean;
  isLocked?: boolean; // when true, hides Edit (e.g. archived entity)
  saving?: boolean;
  isDirty?: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  menuItems: DropdownMenuItem[];
}

export function DetailHeroActions({
  isEditing,
  isLocked,
  saving = false,
  isDirty = true,
  onEdit,
  onCancel,
  onSave,
  menuItems,
}: DetailHeroActionsProps) {
  if (isEditing) {
    return (
      <>
        <Button variant="secondary" size="sm" leadingIcon={X} onClick={onCancel} disabled={saving}>
          Annulla
        </Button>
        <Button
          variant="primary"
          size="sm"
          leadingIcon={Save}
          onClick={onSave}
          disabled={saving || !isDirty}
          loading={saving}
        >
          {saving ? 'Salvando…' : 'Salva'}
        </Button>
      </>
    );
  }
  return (
    <>
      {!isLocked && (
        <Button variant="secondary" size="sm" leadingIcon={Edit} onClick={onEdit}>
          Modifica
        </Button>
      )}
      <DropdownMenu items={menuItems} />
    </>
  );
}
