'use client';

import { CircleAlert, Trash2, X, type LucideIcon } from 'lucide-react';
import { Modal } from './Modal';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel?: () => void;
  title?: string;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  mainIcon?: LucideIcon;
  mainColor?: string;
  confirmIcon?: LucideIcon;
  classes?: string;
}

export function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  title = 'Conferma eliminazione',
  children,
  confirmText = 'Elimina',
  cancelText = 'Annulla',
  mainIcon: MainIcon = CircleAlert,
  mainColor = 'red',
  confirmIcon: ConfirmIcon = Trash2,
  classes = '',
}: DeleteModalProps) {
  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} classes={classes}>
      <div className="flex flex-col justify-center bg-zinc-50 dark:bg-zinc-800 rounded-lg shadow-xl max-w-md w-full gap-8 p-8 mx-auto">
        <div className="flex flex-col gap-4">
          <div className="flex flex-row items-center justify-center">
            <div className="relative">
              <div className={`absolute inset-0 bg-${mainColor}-500/5 rounded-full p-1 animate-ping`} />
              <div className={`flex flex-row items-center justify-center bg-${mainColor}-500/10 rounded-full p-2`}>
                <MainIcon strokeWidth={1.5} className={`size-8 text-${mainColor}-500`} />
              </div>
            </div>
          </div>
          <h2 className="text-xl font-bold text-center text-zinc-900 dark:text-zinc-100">{title}</h2>
          <div className="flex flex-col gap-4 text-center w-full justify-end text-zinc-900 dark:text-zinc-100">
            {children}
          </div>
        </div>

        <div className="flex flex-row items-center justify-center gap-4 w-full">
          <button
            className="flex flex-row flex-grow items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors text-zinc-900 dark:text-zinc-100"
            onClick={handleCancel}
          >
            <X className="size-4" />
            {cancelText}
          </button>
          <button
            className={`flex flex-row flex-grow items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg bg-${mainColor}-500 text-white hover:bg-${mainColor}-600 transition-colors`}
            onClick={onConfirm}
          >
            <ConfirmIcon className="size-4" />
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
