'use client';

import { useRef, useState, type ComponentType, type ReactNode, type SVGProps } from 'react';
import { cn } from '@/lib/utils';

interface FileDropZoneProps {
  /** Files picked or dropped (several only with `multiple`). */
  onFiles: (files: File[]) => void;
  accept: string;
  multiple?: boolean;
  /** Text before the "choose" words, e.g. "Trascina qui o". */
  prompt: ReactNode;
  /** The words that read as the action, e.g. "scegli un file". */
  action: ReactNode;
  /** Shown while a file is dragged over the zone. */
  dragPrompt?: ReactNode;
  /** Small line under the prompt (formats, size limit). */
  hint?: ReactNode;
  icon?: ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;
  /** `lg` is the full-width zone of the import wizard. */
  size?: 'md' | 'lg';
  className?: string;
  id?: string;
  'aria-describedby'?: string;
}

/**
 * A dashed drop target that also opens the file picker on click, Enter or
 * Space. Used by the sign-up logo step and the onboarding import. The parent
 * validates what comes in; the input is cleared after each pick so the same
 * file can be chosen again.
 */
export function FileDropZone({
  onFiles,
  accept,
  multiple = false,
  prompt,
  action,
  dragPrompt,
  hint,
  icon: Icon,
  size = 'md',
  className,
  id,
  'aria-describedby': describedBy,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const take = (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  };

  return (
    <div
      id={id}
      role="button"
      tabIndex={0}
      aria-describedby={describedBy}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        take(e.dataTransfer.files);
      }}
      className={cn(
        'flex flex-col items-center justify-center gap-2 text-center text-sm text-[var(--lume-text-secondary)] cursor-pointer',
        'border border-dashed transition-colors duration-[var(--duration-fast)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lume-ring-focus)]',
        size === 'lg' ? 'rounded-2xl p-10 min-h-44' : 'rounded-xl p-5',
        dragOver
          ? 'border-[var(--lume-text-secondary)] bg-hover'
          : 'border-[var(--lume-edge-hover)] hover:border-[var(--lume-text-muted)]',
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        className="hidden"
        onChange={(e) => {
          take(e.target.files);
          e.target.value = '';
        }}
      />
      {Icon && <Icon className="size-5" aria-hidden />}
      <span>
        {dragOver && dragPrompt ? (
          dragPrompt
        ) : (
          <>
            {prompt} <span className="font-medium text-[var(--lume-text)]">{action}</span>
          </>
        )}
      </span>
      {hint && <span className="text-xs text-[var(--lume-text-muted)]">{hint}</span>}
    </div>
  );
}
