'use client';

import { useRef, useMemo } from 'react';
import { BadgePercent, X } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useAbbonamentiStore } from '@/lib/stores/abbonamenti';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import { Button } from '@/lib/components/shared/ui/Button';
import { Portal } from '@/lib/components/shared/ui/Portal';
import { FloatingPanel } from '@/lib/components/shared/ui/FloatingPanel';
import { ListBox, ListRow, ListGroupLabel } from '@/lib/components/shared/ui/list/ListBox';
import { useAnchoredPopover } from '@/lib/hooks/useAnchoredPopover';

const PANEL_WIDTH = 224;
import type { Abbonamento } from '@/lib/types/Abbonamento';

interface AbbonamentoCellProps {
  clientId: string;
  serviceId: string;
  currentAbbonamentoId: string | null | undefined;
  /** Map of abbonamento_id → count of *other* draft rows currently assigning to it */
  otherDraftAssignments: Record<string, number>;
  onChange: (abbonamentoId: string | null) => void;
}

export function AbbonamentoCell({
  clientId,
  serviceId,
  currentAbbonamentoId,
  otherDraftAssignments,
  onChange,
}: AbbonamentoCellProps) {
  const abbonamenti = useAbbonamentiStore((s) => s.abbonamenti);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { open, toggle, hide, position, panelRef, side } = useAnchoredPopover(buttonRef, {
    panelMaxHeight: 240,
    align: 'end',
    panelWidth: PANEL_WIDTH,
  });


  const current = useMemo<Abbonamento | null>(
    () => abbonamenti.find((a) => a.id === currentAbbonamentoId) ?? null,
    [abbonamenti, currentAbbonamentoId],
  );

  const eligible = useMemo(() => {
    if (!clientId || !serviceId) return [];
    return abbonamenti.filter((a) => {
      if (a.client_id !== clientId) return false;
      if (!a.scope_service_ids.includes(serviceId)) return false;
      if (!a.isUsable && a.id !== currentAbbonamentoId) return false;
      // Count this draft's own assignment against remaining — always allow the current one.
      if (a.id === currentAbbonamentoId) return true;
      const reservedElsewhere = otherDraftAssignments[a.id] ?? 0;
      return a.remainingTreatments - reservedElsewhere > 0;
    });
  }, [abbonamenti, clientId, serviceId, currentAbbonamentoId, otherDraftAssignments]);

  if (!current && eligible.length === 0) {
    return <div className="size-6" />; // empty placeholder to keep grid alignment
  }

  const buttonBase =
    'p-1 rounded-md transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--lume-ring-focus)]';

  // Selected state — small emerald pill
  if (current) {
    const label = `${current.remainingTreatments}/${current.total_treatments}`;
    return (
      <div className="flex items-center justify-center">
        <Tooltip label={`Abbonamento attivo (${label}) — clicca per rimuovere`}>
          <button
            // ds-ignore: active-abbonamento pill, a small green chip that clears the abbonamento on click; Button has no tinted variant and is taller
            type="button"
            onClick={() => onChange(null)}
            className={`${buttonBase} flex items-center gap-1 px-1.5 text-xs text-success-strong bg-success-soft`}
          >
            <BadgePercent className="size-3" />
            <span className="tabular-nums">{label}</span>
            <X className="size-3 opacity-60" />
          </button>
        </Tooltip>
      </div>
    );
  }

  // Eligible but none selected
  return (
    <div className="flex items-center justify-center">
      <Button tooltip="Usa un abbonamento"
        ref={buttonRef}
        variant="ghost"
        size="sm"
        iconOnly
        aria-label="Usa abbonamento"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
      >
        <BadgePercent />
      </Button>
      <Portal>
        <AnimatePresence>
          {open && position && (
            <FloatingPanel
              ref={panelRef}
              side={side}
              style={{ position: 'fixed', left: position.left, top: position.top, bottom: position.bottom, width: PANEL_WIDTH }}
            >
              <ListBox role="listbox" aria-label="Abbonamenti disponibili" className="max-h-56 overflow-y-auto">
                <ListGroupLabel>Abbonamenti disponibili</ListGroupLabel>
                {eligible.map((a) => {
                  const reserved = otherDraftAssignments[a.id] ?? 0;
                  const effectiveRemaining = a.remainingTreatments - reserved;
                  return (
                    <ListRow
                      key={a.id}
                      onClick={() => { onChange(a.id); hide(); }}
                      description={a.valid_until ? `scade ${new Date(a.valid_until).toLocaleDateString('it-IT')}` : undefined}
                    >
                      <span className="tabular-nums text-success-strong">
                        {effectiveRemaining} / {a.total_treatments} rimanenti
                      </span>
                    </ListRow>
                  );
                })}
              </ListBox>
            </FloatingPanel>
          )}
        </AnimatePresence>
      </Portal>
    </div>
  );
}
