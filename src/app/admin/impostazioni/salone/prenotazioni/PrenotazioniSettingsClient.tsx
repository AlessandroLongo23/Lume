'use client';

import { useCallback, useRef, useState } from 'react';
import { Save } from 'lucide-react';
import { PrenotazioniPanel, type PrenotazioniPanelHandle } from '@/lib/components/admin/settings/PrenotazioniPanel';
import { BookableServicesPanel, type BookableServicesPanelHandle } from '@/lib/components/admin/settings/BookableServicesPanel';
import { Button } from '@/lib/components/shared/ui/Button';
import { UnsavedChangesDialog } from '@/lib/components/shared/ui/modals/UnsavedChangesDialog';
import { useUnsavedNavGuard } from '@/lib/hooks/useUnsavedNavGuard';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';

export function PrenotazioniSettingsClient() {
  const prenotazioniRef = useRef<PrenotazioniPanelHandle>(null);
  const bookableRef = useRef<BookableServicesPanelHandle>(null);

  const [settingsDirty, setSettingsDirty] = useState(false);
  const [bookableDirty, setBookableDirty] = useState(false);
  const [settingsValid, setSettingsValid] = useState(true);
  const [saving, setSaving] = useState(false);

  const isDirty = settingsDirty || bookableDirty;
  const canSave = isDirty && settingsValid && !saving;

  const saveAll = useCallback(async () => {
    const tasks: Promise<unknown>[] = [];
    if (settingsDirty) tasks.push(prenotazioniRef.current!.save());
    if (bookableDirty) tasks.push(bookableRef.current!.save());
    await Promise.all(tasks);
  }, [settingsDirty, bookableDirty]);

  const discardAll = useCallback(() => {
    if (settingsDirty) prenotazioniRef.current?.discard();
    if (bookableDirty) bookableRef.current?.discard();
  }, [settingsDirty, bookableDirty]);

  const nav = useUnsavedNavGuard({ isDirty, onSave: saveAll, onDiscard: discardAll });

  const onClickSave = async () => {
    setSaving(true);
    try {
      await saveAll();
      messagePopup.getState().success('Impostazioni salvate');
    } catch {
      // Individual panels surface their own error toasts.
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <PrenotazioniPanel
          ref={prenotazioniRef}
          onDirtyChange={setSettingsDirty}
          onValidityChange={setSettingsValid}
        />
        <BookableServicesPanel ref={bookableRef} onDirtyChange={setBookableDirty} />

        <div className="flex items-center justify-end gap-3">
          {isDirty && (
            <Button variant="ghost" onClick={discardAll} disabled={saving}>
              Annulla modifiche
            </Button>
          )}
          <Button
            variant="primary"
            leadingIcon={Save}
            loading={saving}
            disabled={!canSave}
            onClick={onClickSave}
          >
            {saving ? 'Salvataggio…' : 'Salva'}
          </Button>
        </div>
      </div>

      <UnsavedChangesDialog
        isOpen={nav.isPrompting}
        saving={nav.isSaving}
        onCancel={nav.cancel}
        onDiscard={nav.discardAndLeave}
        onSave={nav.saveAndLeave}
      />
    </>
  );
}
