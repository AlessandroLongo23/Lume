'use client';

import { Plus, X, Check, type LucideIcon } from 'lucide-react';
import { Modal } from './Modal';

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
          <button
            aria-label="Chiudi"
            className="text-muted-foreground hover:text-foreground transition-colors rounded-full p-2 hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className={`p-6 flex-1 min-h-0 overflow-hidden ${contentClasses}`}>{children}</div>

        <div className="flex flex-row flex-wrap items-center justify-between gap-3 p-6 border-t border-zinc-500/25 shrink-0">
          <div>{footerContent}</div>
          <div className="flex flex-row flex-wrap items-center gap-3">
            {dangerAction}
            <button
              type="button"
              className="flex flex-row items-center justify-center gap-2 px-4 py-2.5 text-sm font-thin rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-all text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              onClick={onClose}
            >
              <X className="size-4" />
              {cancelText}
            </button>
            <button
              type="button"
              disabled={confirmDisabled}
              className="flex flex-row items-center justify-center gap-2 px-4 py-2.5 text-sm font-thin rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-800"
              onClick={onSubmit}
            >
              <Check className="size-4" />
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
