'use client';

import { useRef } from 'react';
import { Download, FileSpreadsheet, FileText, FileType } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { Button } from './Button';
import { Portal } from './Portal';
import { FloatingPanel } from './FloatingPanel';
import { ListBox, ListRow, ListGroupLabel } from './list/ListBox';
import { useAnchoredPopover } from '@/lib/hooks/useAnchoredPopover';
import { exportTable, type ExportColumn, type ExportFormat } from '@/lib/utils/tableExport';

interface ExportMenuProps<T> {
  rows: T[];
  columns: ExportColumn<T>[];
  /** The file basename (e.g. "clienti"). */
  baseName: string;
  /** The title in the PDF header (e.g. "Elenco clienti"). */
  pdfTitle: string;
}

const PANEL_WIDTH = 256;

const FORMAT_ITEMS: { format: ExportFormat; label: string; icon: typeof FileText; hint: string }[] = [
  { format: 'xlsx', label: 'Excel (.xlsx)', icon: FileSpreadsheet, hint: 'Foglio di calcolo, apre in Excel' },
  { format: 'csv', label: 'CSV (.csv)', icon: FileType, hint: 'Compatibile con tutti i fogli di calcolo' },
  { format: 'pdf', label: 'PDF stampabile', icon: FileText, hint: 'Anteprima di stampa per archivio cartaceo' },
];

/** The "Esporta" menu of a table: Excel, CSV or a printable PDF of `rows`. Disabled with no rows. */
export function ExportMenu<T>({ rows, columns, baseName, pdfTitle }: ExportMenuProps<T>) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { open, toggle, hide, position, panelRef, side } = useAnchoredPopover(triggerRef, {
    panelMaxHeight: 220,
    align: 'end',
    panelWidth: PANEL_WIDTH,
  });


  return (
    <>
      <Button
        ref={triggerRef}
        variant="secondary"
        size="md"
        leadingIcon={Download}
        disabled={rows.length === 0}
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Esporta
      </Button>
      <Portal>
        <AnimatePresence>
          {open && position && (
            <FloatingPanel
              ref={panelRef}
              side={side}
              layer="dropdown"
              style={{ position: 'fixed', left: position.left, top: position.top, bottom: position.bottom, width: PANEL_WIDTH }}
            >
              <ListBox role="menu" aria-label="Esporta">
                <ListGroupLabel>
                  <span className="tabular-nums">{rows.length}</span> righe
                </ListGroupLabel>
                {FORMAT_ITEMS.map((item) => (
                  <ListRow
                    key={item.format}
                    icon={item.icon}
                    description={item.hint}
                    onClick={() => {
                      exportTable(item.format, rows, columns, baseName, pdfTitle);
                      hide();
                    }}
                  >
                    {item.label}
                  </ListRow>
                ))}
              </ListBox>
            </FloatingPanel>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}
