'use client';

import { useId, useState, type ReactNode } from 'react';
import { Trash2, type LucideIcon } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '@/lib/components/shared/ui/Button';
import { Callout } from '@/lib/components/shared/ui/Callout';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { DialogFooter, DialogHeader } from './dialogParts';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  subtitle?: string;
  /** Free content between the header and the footer. */
  children?: ReactNode;
  /** What will be lost, shown as a danger Callout. */
  warning?: ReactNode;
  /** A safer alternative, shown as a warning Callout (e.g. "usa Archivia"). */
  tip?: ReactNode;
  /** Typing this phrase enables the delete button (irreversible deletes). */
  confirmPhrase?: string;
  /** The safer alternative as a button on the left of the footer. */
  alternative?: { label: string; icon?: LucideIcon; onClick: () => void };
  confirmText?: string;
  /** Disables the buttons while the delete runs. */
  busy?: boolean;
}

/**
 * Every delete confirmation in Lume. Simple deletes pass title/subtitle;
 * irreversible ones add `warning`, `confirmPhrase` (type-to-confirm) and an
 * `alternative` such as Archivia, so the dialog is laid out the same way
 * for clients, services, products, operators and coupons.
 */
export function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Conferma eliminazione',
  subtitle = 'Questa azione è irreversibile',
  children,
  warning,
  tip,
  confirmPhrase,
  alternative,
  confirmText = 'Elimina',
  busy = false,
}: DeleteModalProps) {
  const titleId = useId();
  const [typed, setTyped] = useState('');
  // Start empty every time the dialog opens, so no caller needs to remount it.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setTyped('');
  }
  const confirmed = !confirmPhrase || typed.trim().toLowerCase() === confirmPhrase.trim().toLowerCase();
  const hasBody = Boolean(children || warning || tip || confirmPhrase);

  // While the delete runs, the dialog stays open: it reports the outcome.
  const close = () => { if (busy) return; setTyped(''); onClose(); };
  const confirm = () => { if (confirmed && !busy) onConfirm(); };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      classes={hasBody ? 'max-w-lg' : 'max-w-md'}
      closeOnOutsideClick={!confirmPhrase}
      labelledBy={titleId}
    >
      <DialogHeader titleId={titleId} title={title} subtitle={subtitle} onClose={close} closeDisabled={busy} divider={!!confirmPhrase} className={hasBody ? (confirmPhrase ? '' : 'pb-0') : 'pb-5'} />

      {hasBody && (
        <div className="px-6 pt-4 pb-5 flex flex-col gap-4 text-sm text-[var(--lume-text)] min-h-0 overflow-y-auto">
          {warning && <Callout tone="danger">{warning}</Callout>}
          {tip && <Callout tone="warning">{tip}</Callout>}
          {children}
          {confirmPhrase && (
            <FormInput
              label={<>Digita <strong className="font-medium text-[var(--lume-text)]">{confirmPhrase}</strong> per confermare</>}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') confirm(); }}
              placeholder={confirmPhrase}
              autoComplete="off"
            />
          )}
        </div>
      )}

      <DialogFooter
        start={alternative ? (
          <Button variant="secondary" leadingIcon={alternative.icon} disabled={busy} onClick={() => { setTyped(''); alternative.onClick(); }}>
            {alternative.label}
          </Button>
        ) : undefined}
      >
        <Button variant="ghost" disabled={busy} onClick={close}>Annulla</Button>
        <Button variant="destructive" leadingIcon={Trash2} disabled={!confirmed} loading={busy} onClick={confirm}>
          {confirmText}
        </Button>
      </DialogFooter>
    </Modal>
  );
}
