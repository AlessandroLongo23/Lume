'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  classes?: string;
  closeOnOutsideClick?: boolean;
  backgroundBlur?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const blurClasses: Record<string, string> = {
  none: '',
  xs: 'backdrop-blur-xs',
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
};

export function Modal({
  isOpen,
  onClose,
  children,
  classes = '',
  closeOnOutsideClick = true,
  backgroundBlur = 'none',
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnOutsideClick && e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div
      className={`fixed inset-0 bg-black/25 ${blurClasses[backgroundBlur]} z-50 animate-in fade-in duration-100`}
      onClick={handleBackdropClick}
    >
      <div
        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full duration-200 ${classes}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
