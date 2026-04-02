'use client';

import { Plus, X, Check } from 'lucide-react';
import { Modal } from './Modal';

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
  dangerAction?: React.ReactNode;
  classes?: string;
  contentClasses?: string;
  confirmText?: string;
  cancelText?: string;
}

export function AddModal({
  isOpen,
  onClose,
  onSubmit,
  title = 'Aggiungi',
  subtitle = 'Aggiungi un nuovo elemento',
  children,
  footerContent,
  dangerAction,
  classes = '',
  contentClasses = '',
  confirmText = 'Aggiungi',
  cancelText = 'Annulla',
}: AddModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} classes={classes}>
      <div className="flex flex-col bg-zinc-50 dark:bg-zinc-800 rounded-lg shadow-xl w-full h-full max-h-[90vh]">
        <div className="flex flex-row items-center justify-between p-6 border-b border-zinc-500/25 shrink-0">
          <div className="flex flex-row items-center gap-3 truncate">
            <div className="flex shrink-0 items-center justify-center size-10 rounded-lg bg-indigo-500/10">
              <Plus className="size-5 text-indigo-500" />
            </div>
            <div className="flex flex-col truncate">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">{subtitle}</p>
            </div>
          </div>
          <button
            aria-label="Chiudi"
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className={`p-6 flex-1 min-h-0 overflow-hidden ${contentClasses}`}>{children}</div>

        <div className="flex flex-row items-center justify-between p-6 border-t border-zinc-500/25 shrink-0">
          <div>{footerContent}</div>
          <div className="flex flex-row items-center gap-3">
            {dangerAction}
            <button
              type="button"
              className="flex flex-row items-center justify-center gap-2 px-4 py-2.5 text-sm font-thin rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-all text-zinc-900 dark:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
              onClick={onClose}
            >
              <X className="size-4" />
              {cancelText}
            </button>
            <button
              type="button"
              className="flex flex-row items-center justify-center gap-2 px-4 py-2.5 text-sm font-thin rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-800"
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
