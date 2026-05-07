'use client';

import { CircleAlert, Trash2, X, type LucideIcon } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '@/lib/components/shared/ui/Button';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  footerContent?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  mainIcon?: LucideIcon;
  confirmIcon?: LucideIcon;
  classes?: string;
  contentClasses?: string;
}

export function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Conferma eliminazione',
  subtitle = 'Questa azione è irreversibile',
  children,
  footerContent,
  confirmText = 'Elimina',
  cancelText = 'Annulla',
  mainIcon: MainIcon = CircleAlert,
  confirmIcon: ConfirmIcon = Trash2,
  classes = 'max-w-md',
  contentClasses = '',
}: DeleteModalProps) {
  const hasBody = children !== undefined && children !== null && children !== false;

  return (
    <Modal isOpen={isOpen} onClose={onClose} classes={classes}>
      <div className="flex flex-col bg-muted rounded-lg shadow-xl w-full">
        <div
          className={`flex flex-row items-center justify-between p-6 ${
            hasBody ? 'border-b border-zinc-500/25' : ''
          }`}
        >
          <div className="flex flex-row items-center gap-3 truncate">
            <div className="flex shrink-0 items-center justify-center size-10 rounded-lg bg-red-500/10">
              <MainIcon className="size-5 text-red-500" />
            </div>
            <div className="flex flex-col truncate">
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
            </div>
          </div>
          <Button variant="ghost" size="md" iconOnly aria-label="Chiudi" onClick={onClose}>
            <X />
          </Button>
        </div>

        {hasBody && (
          <div className={`p-6 ${contentClasses}`}>
            <div className="text-foreground">{children}</div>
          </div>
        )}

        <div className="flex flex-row items-center justify-between p-6 border-t border-zinc-500/25">
          <div>{footerContent}</div>
          <div className="flex flex-row items-center gap-3">
            <Button variant="secondary" leadingIcon={X} onClick={onClose}>
              {cancelText}
            </Button>
            <Button variant="destructive" leadingIcon={ConfirmIcon} onClick={onConfirm}>
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
