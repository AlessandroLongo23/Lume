'use client';

import { Edit, Save, X } from 'lucide-react';
import { DropdownMenu, type DropdownMenuItem } from '@/lib/components/shared/ui/DropdownMenu';

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
        <button
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center gap-1.5 h-9 px-3 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50 active:scale-[0.97]"
        >
          <X className="size-4" />
          Annulla
        </button>
        <button
          onClick={onSave}
          disabled={saving || !isDirty}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 text-sm font-medium text-white bg-primary hover:bg-primary-hover active:bg-primary-active rounded-lg transition-colors disabled:opacity-50 active:scale-[0.97]"
        >
          <Save className="size-4" />
          {saving ? 'Salvando…' : 'Salva'}
        </button>
      </>
    );
  }
  return (
    <>
      {!isLocked && (
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors active:scale-[0.97]"
        >
          <Edit className="size-4" />
          Modifica
        </button>
      )}
      <DropdownMenu items={menuItems} />
    </>
  );
}
