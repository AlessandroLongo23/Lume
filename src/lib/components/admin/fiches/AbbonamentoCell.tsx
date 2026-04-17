'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { BadgePercent, X, Check } from 'lucide-react';
import { useAbbonamentiStore } from '@/lib/stores/abbonamenti';
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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

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
    'p-1 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50';

  // Selected state — small emerald pill
  if (current) {
    const label = `${current.remainingTreatments}/${current.total_treatments}`;
    return (
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={() => onChange(null)}
          title={`Abbonamento attivo (${label}) — clicca per rimuovere`}
          className={`${buttonBase} flex items-center gap-1 px-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20`}
        >
          <BadgePercent className="size-3" />
          <span className="font-mono">{label}</span>
          <X className="size-3 opacity-60" />
        </button>
      </div>
    );
  }

  // Eligible but none selected
  return (
    <div ref={ref} className="relative flex items-center justify-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Usa un abbonamento"
        className={`${buttonBase} text-zinc-400 hover:text-indigo-500 hover:bg-indigo-500/10`}
        aria-label="Usa abbonamento"
      >
        <BadgePercent className="size-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 rounded-md border border-zinc-500/25 bg-white dark:bg-zinc-800 shadow-xl z-50">
          <div className="px-2 py-1.5 text-[10px] uppercase tracking-wide text-zinc-400 border-b border-zinc-500/10">
            Abbonamenti disponibili
          </div>
          <ul className="max-h-48 overflow-y-auto divide-y divide-zinc-500/10">
            {eligible.map((a) => {
              const reserved = otherDraftAssignments[a.id] ?? 0;
              const effectiveRemaining = a.remainingTreatments - reserved;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => { onChange(a.id); setOpen(false); }}
                    className="w-full flex items-center justify-between gap-2 px-2 py-1.5 text-xs text-left hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors"
                  >
                    <span className="flex flex-col min-w-0">
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">
                        {effectiveRemaining} / {a.total_treatments} rimanenti
                      </span>
                      {a.valid_until && (
                        <span className="text-zinc-400 text-[10px]">
                          scade {new Date(a.valid_until).toLocaleDateString('it-IT')}
                        </span>
                      )}
                    </span>
                    <Check className="size-3 opacity-0 shrink-0" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
