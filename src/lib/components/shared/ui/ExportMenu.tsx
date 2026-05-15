'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, FileText, FileType } from 'lucide-react';
import { Button } from './Button';
import { Portal } from './Portal';
import { exportTable, type ExportColumn, type ExportFormat } from '@/lib/utils/tableExport';

interface ExportMenuProps<T> {
  rows: T[];
  columns: ExportColumn<T>[];
  /** Used as the file basename and PDF title (e.g. "clienti"). */
  baseName: string;
  /** Optional richer title for the PDF header (defaults to baseName). */
  pdfTitle?: string;
  /** Hide the PDF option for tables where a printed snapshot makes no sense. */
  enablePdf?: boolean;
  /** Disable the trigger (e.g. while loading or when there are no rows). */
  disabled?: boolean;
}

const FORMAT_ITEMS: { format: ExportFormat; label: string; icon: typeof FileText; hint: string }[] = [
  { format: 'xlsx', label: 'Excel (.xlsx)', icon: FileSpreadsheet, hint: 'Foglio di calcolo, apre in Excel' },
  { format: 'csv', label: 'CSV (.csv)', icon: FileType, hint: 'Compatibile con tutti i fogli di calcolo' },
  { format: 'pdf', label: 'PDF stampabile', icon: FileText, hint: 'Anteprima di stampa per archivio cartaceo' },
];

export function ExportMenu<T>({
  rows,
  columns,
  baseName,
  pdfTitle,
  enablePdf = true,
  disabled = false,
}: ExportMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const update = () => {
      const r = triggerRef.current!.getBoundingClientRect();
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const items = enablePdf ? FORMAT_ITEMS : FORMAT_ITEMS.filter((i) => i.format !== 'pdf');
  const isEmpty = rows.length === 0;

  return (
    <>
      <Button
        ref={triggerRef}
        variant="secondary"
        size="md"
        leadingIcon={Download}
        disabled={disabled || isEmpty}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Esporta
      </Button>
      {open && pos && (
        <Portal>
          <div
            ref={panelRef}
            role="menu"
            className="fixed w-64 bg-white dark:bg-zinc-800 border border-zinc-500/25 rounded-lg shadow-lg z-dropdown py-1"
            style={{ top: pos.top, right: pos.right }}
          >
            <div className="px-4 py-2 text-[11px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-700/50">
              {rows.length} righe
            </div>
            {items.map((item) => (
              <button
                key={item.format}
                role="menuitem"
                className="flex flex-row items-start gap-3 w-full px-4 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors text-zinc-700 dark:text-zinc-300"
                onClick={() => {
                  exportTable(item.format, rows, columns, baseName, pdfTitle);
                  setOpen(false);
                }}
              >
                <item.icon className="size-4 mt-0.5 text-zinc-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm">{item.label}</span>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{item.hint}</span>
                </div>
              </button>
            ))}
          </div>
        </Portal>
      )}
    </>
  );
}
