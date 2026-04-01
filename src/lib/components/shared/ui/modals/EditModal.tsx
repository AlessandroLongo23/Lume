'use client';

import { SquarePen, X, Check } from 'lucide-react';
import { Modal } from './Modal';

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
      <div className="flex flex-col bg-zinc-50 dark:bg-zinc-800 rounded-lg shadow-xl w-full">
        <div className="flex flex-row items-center justify-between p-6 border-b border-zinc-500/25">
          <div className="flex flex-row items-center gap-3 truncate">
            <div className="flex shrink-0 items-center justify-center size-10 rounded-lg bg-blue-500/10">
              <SquarePen className="size-5 text-blue-500" />
            </div>
            <div className="flex flex-col truncate">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">{subtitle}</p>
            </div>
          </div>
          <button
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className={`p-6 ${contentClasses}`}>{children}</div>

        <div className="flex flex-row items-center justify-between p-6 border-t border-zinc-500/25">
          <div>{footerContent}</div>
          <div className="flex flex-row items-center gap-3">
            <button
              type="button"
              className="flex flex-row items-center justify-center gap-2 px-4 py-2.5 text-sm font-thin rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors text-zinc-900 dark:text-zinc-100"
              onClick={onClose}
            >
              <X className="size-4" />
              {cancelText}
            </button>
            <button
              type="button"
              className="flex flex-row items-center justify-center gap-2 px-4 py-2.5 text-sm font-thin rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
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
