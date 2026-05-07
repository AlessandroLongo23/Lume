'use client';

import { SquarePen, X, Check } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '@/lib/components/shared/ui/Button';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
  classes?: string;
  contentClasses?: string;
  confirmText?: string;
  cancelText?: string;
}

export function EditModal({
  isOpen,
  onClose,
  onSubmit,
  title = 'Modifica',
  subtitle = 'Modifica i dettagli',
  children,
  footerContent,
  classes = '',
  contentClasses = '',
  confirmText = 'Salva',
  cancelText = 'Annulla',
}: EditModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} classes={classes}>
      <div className="flex flex-col bg-muted rounded-lg shadow-xl w-full">
        <div className="flex flex-row items-center justify-between p-6 border-b border-zinc-500/25">
          <div className="flex flex-row items-center gap-3 truncate">
            <div className="flex shrink-0 items-center justify-center size-10 rounded-lg bg-blue-500/10">
              <SquarePen className="size-5 text-blue-500" />
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

        <div className={`p-6 ${contentClasses}`}>{children}</div>

        <div className="flex flex-row items-center justify-between p-6 border-t border-zinc-500/25">
          <div>{footerContent}</div>
          <div className="flex flex-row items-center gap-3">
            <Button variant="secondary" leadingIcon={X} onClick={onClose}>
              {cancelText}
            </Button>
            <Button variant="primary" leadingIcon={Check} onClick={onSubmit}>
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
