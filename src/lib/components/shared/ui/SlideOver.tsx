'use client';

import { useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onSubmit?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function SlideOver({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  onSubmit,
  confirmText = 'Salva',
  cancelText = 'Annulla',
}: SlideOverProps) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-xl bg-zinc-50 dark:bg-zinc-800 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-700 shrink-0">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
            {subtitle && <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
          </div>
          <button
            type="button"
            aria-label="Chiudi"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {children}
        </div>

        {/* Footer */}
        {onSubmit && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-700 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 transition-colors"
            >
              <X className="size-4" />
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
            >
              <Check className="size-4" />
              {confirmText}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
