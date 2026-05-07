'use client';

import { Plus, X, Check, type LucideIcon } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '@/lib/components/shared/ui/Button';

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
  dangerAction?: React.ReactNode;
  classes?: string;
  contentClasses?: string;
  confirmText?: string;
  cancelText?: string;
  confirmDisabled?: boolean;
}

export function AddModal({
  isOpen,
  onClose,
  onSubmit,
  title = 'Aggiungi',
  subtitle = 'Aggiungi un nuovo elemento',
  icon: Icon = Plus,
  children,
  footerContent,
  dangerAction,
  classes = '',
  contentClasses = '',
  confirmText = 'Aggiungi',
  cancelText = 'Annulla',
  confirmDisabled = false,
}: AddModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} classes={classes}>
      <div className="flex flex-col bg-muted rounded-lg shadow-xl w-full h-full max-h-[92vh]">
        <div className="flex flex-row items-center justify-between p-6 border-b border-zinc-500/25 shrink-0">
          <div className="flex flex-row items-center gap-3 truncate">
            <div className="flex shrink-0 items-center justify-center size-10 rounded-lg bg-primary/10">
              <Icon className="size-5 text-primary" />
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

        <div className={`p-6 flex-1 min-h-0 overflow-hidden ${contentClasses}`}>{children}</div>

        <div className="flex flex-row flex-wrap items-center justify-between gap-3 p-6 border-t border-zinc-500/25 shrink-0">
          <div>{footerContent}</div>
          <div className="flex flex-row flex-wrap items-center gap-3">
            {dangerAction}
            <Button variant="secondary" leadingIcon={X} onClick={onClose}>
              {cancelText}
            </Button>
            <Button
              variant="primary"
              leadingIcon={Check}
              disabled={confirmDisabled}
              onClick={onSubmit}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
