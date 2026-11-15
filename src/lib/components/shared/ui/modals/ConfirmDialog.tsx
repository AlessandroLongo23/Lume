'use client';

import { useEffect, useId } from 'react';
import { TriangleAlert, type LucideIcon } from 'lucide-react';
import { Button, type ButtonVariant } from '@/lib/components/shared/ui/Button';
import { Modal } from './Modal';
import { DialogFooter } from './dialogParts';

type Tone = 'warning' | 'destructive' | 'default';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
  icon?: LucideIcon;
  /** A third way out, on the left of the footer (e.g. "Scarta" when leaving
   *  a page with unsaved edits). */
  alternative?: { label: string; onClick: () => void };
  /** The confirm action is running: its button spins, the others and
   *  Escape/backdrop are disabled. */
  busy?: boolean;
}

// Tone only picks the confirm button and, for warnings, a small icon beside
// the title. Destructive is the destructive button alone: no red tile, no tint.
const toneConfig: Record<Tone, { confirmVariant: ButtonVariant; showIcon: boolean }> = {
  warning: { confirmVariant: 'primary', showIcon: true },
  destructive: { confirmVariant: 'destructive', showIcon: false },
  default: { confirmVariant: 'primary', showIcon: false },
};

/** A short yes/no question before an action with consequences, on Modal. */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Conferma',
  cancelLabel = 'Annulla',
  tone = 'warning',
  icon: Icon = TriangleAlert,
  alternative,
  busy = false,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const close = () => { if (!busy) onClose(); };

  useEffect(() => {
    if (!isOpen || busy) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      // A focused button or field handles Enter itself: "Annulla" must cancel.
      if (e.target instanceof Element && e.target.closest('button, a, input, textarea, select, [role="button"]')) return;
      e.preventDefault();
      onConfirm();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, busy, onConfirm]);

  const tones = toneConfig[tone];

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      role="alertdialog"
      labelledBy={titleId}
      describedBy={description ? descriptionId : undefined}
      classes="max-w-sm"
    >
      <div className="flex flex-col gap-1.5 px-6 pt-5 pb-5">
        <h2
          id={titleId}
          className="flex items-center gap-2 text-base font-medium tracking-tight text-[var(--lume-text)]"
        >
          {tones.showIcon && (
            <Icon className="size-4 shrink-0 text-warning-strong" aria-hidden />
          )}
          {title}
        </h2>
        {description && (
          <div id={descriptionId} className="text-sm text-[var(--lume-text-secondary)] leading-relaxed">
            {description}
          </div>
        )}
      </div>

      <DialogFooter
        start={alternative && (
          <Button variant="ghost" onClick={alternative.onClick} disabled={busy} className="-ml-3">
            {alternative.label}
          </Button>
        )}
      >
        <Button variant="ghost" onClick={close} disabled={busy}>
          {cancelLabel}
        </Button>
        <Button variant={tones.confirmVariant} onClick={onConfirm} loading={busy} autoFocus>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Modal>
  );
}
