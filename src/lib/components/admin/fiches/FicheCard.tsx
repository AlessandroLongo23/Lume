'use client';

import { useMemo } from 'react';
import { Pencil, Trash2, CheckCircle2, Clock, Sparkles, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { FicheStatus } from '@/lib/types/ficheStatus';
import { useServicesStore } from '@/lib/stores/services';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { useOperatorsStore } from '@/lib/stores/operators';
import { DEFAULT_CATEGORY_COLOR } from '@/lib/const/category-colors';
import type { Fiche } from '@/lib/types/Fiche';
import type { FicheProduct } from '@/lib/types/FicheProduct';

const STATUS_STYLES: Record<string, string> = {
  [FicheStatus.CREATED]: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
  [FicheStatus.PENDING]: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  [FicheStatus.COMPLETED]: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
};

const STATUS_LABELS: Record<string, string> = {
  [FicheStatus.CREATED]: 'Creata',
  [FicheStatus.PENDING]: 'In corso',
  [FicheStatus.COMPLETED]: 'Completata',
};

function withOpacity(hex: string, opacity: number): string {
  const clamped = Math.round(Math.max(0, Math.min(1, opacity)) * 255);
  return `${hex}${clamped.toString(16).padStart(2, '0')}`;
}

interface FicheCardProps {
  fiche: Fiche;
  onEdit: (fiche: Fiche) => void;
  onDelete: (fiche: Fiche) => void;
  onCheckout: (fiche: Fiche) => void;
}

export function FicheCard({ fiche, onEdit, onDelete, onCheckout }: FicheCardProps) {
  const services = useServicesStore((s) => s.services);
  const categories = useServiceCategoriesStore((s) => s.service_categories);
  const operators = useOperatorsStore((s) => s.operators);
  const serviceMap = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const operatorMap = useMemo(() => new Map(operators.map((o) => [o.id, o])), [operators]);

  const client = fiche.getClient();
  const ficheServices = fiche.getFicheServices();
  const ficheProducts = fiche.getFicheProducts();

  const startDate = new Date(fiche.datetime);
  const totalDuration = fiche.getDuration();
  const endDate = totalDuration > 0 ? new Date(startDate.getTime() + totalDuration * 60_000) : null;
  const dateLabel = format(startDate, 'EEE d MMM', { locale: it });
  const startLabel = format(startDate, 'HH:mm');
  const endLabel = endDate ? format(endDate, 'HH:mm') : null;
  const timeWindow = endLabel ? `${startLabel} – ${endLabel}` : startLabel;

  const servicesTotal = ficheServices.reduce((sum, fs) => sum + fs.final_price, 0);
  const productsTotal = (ficheProducts as FicheProduct[]).reduce((sum, fp) => sum + (fp.final_price * fp.quantity), 0);
  const total = servicesTotal + productsTotal;

  const formatPrice = (value: number) =>
    `€ ${value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const isCompleted = fiche.status === FicheStatus.COMPLETED;
  const isPending = fiche.status === FicheStatus.PENDING;

  const categoryColors = useMemo(() => {
    return ficheServices.map((fs) => {
      const svc = serviceMap.get(fs.service_id);
      const cat = svc ? categoryMap.get(svc.category_id) : null;
      return cat?.color ?? DEFAULT_CATEGORY_COLOR;
    });
  }, [ficheServices, serviceMap, categoryMap]);

  return (
    <div
      className="group relative bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl flex flex-col overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 truncate tracking-tight">
            {client ? client.getFullName() : <span className="text-zinc-400 font-normal">Cliente sconosciuto</span>}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <Clock className="size-3 text-zinc-400 shrink-0" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
              <span className="capitalize">{dateLabel}</span>
              <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
              {timeWindow}
            </p>
          </div>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[fiche.status] ?? ''}`}>
          {isPending && <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />}
          {STATUS_LABELS[fiche.status] ?? fiche.status}
        </span>
      </div>

      {/* Body — services rendered as a thread; each service is a node connected
          by a thin line that morphs between adjacent category colors. */}
      <div className="px-4 py-3 flex-1 min-h-[80px] border-t border-zinc-100 dark:border-zinc-800/60">
        {ficheServices.length === 0 ? (
          <p className="text-xs text-zinc-400 italic flex items-center gap-1.5">
            <Sparkles className="size-3" />
            Nessun servizio aggiunto
          </p>
        ) : (
          <ol>
            {ficheServices.map((fs, i) => {
              const service = serviceMap.get(fs.service_id);
              const operator = operatorMap.get(fs.operator_id);
              const color = categoryColors[i] ?? DEFAULT_CATEGORY_COLOR;
              const nextColor = categoryColors[i + 1] ?? color;
              const isLast = i === ficheServices.length - 1;
              const fsStart = fs.start_time ? format(new Date(fs.start_time), 'HH:mm') : null;
              const fsEnd = fs.end_time ? format(new Date(fs.end_time), 'HH:mm') : null;
              const fsRange = fsStart && fsEnd ? `${fsStart} – ${fsEnd}` : fsStart;
              return (
                <li
                  key={fs.id}
                  className={`relative flex items-start gap-3 group/row ${isLast ? '' : 'pb-3'}`}
                >
                  {/* Node — sized to the dot; connector lives on the <li> so
                      its height matches the row regardless of content. */}
                  <span className="relative shrink-0 size-2.5 mt-1">
                    <span
                      className="absolute inset-0 rounded-full transition-transform duration-200 group-hover/row:scale-125"
                      style={{
                        backgroundColor: color,
                        boxShadow: `0 0 0 3px ${withOpacity(color, 0.18)}`,
                      }}
                    />
                  </span>
                  {!isLast && (
                    <span
                      aria-hidden
                      className="absolute left-[5px] -translate-x-1/2 top-[18px] bottom-0 w-px pointer-events-none"
                      style={{
                        background: `linear-gradient(to bottom, ${withOpacity(color, 0.8)}, ${withOpacity(nextColor, 0.8)})`,
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">
                        {fs.name || service?.name || '—'}
                      </span>
                      {operator && (
                        <span className="ml-auto text-2xs px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shrink-0 font-medium">
                          {operator.firstName}
                        </span>
                      )}
                    </div>
                    <p className="text-2xs text-zinc-400 dark:text-zinc-500 tabular-nums mt-0.5">
                      {fsRange && <span>{fsRange}</span>}
                      {fsRange && <span className="mx-1.5 text-zinc-300 dark:text-zinc-700">·</span>}
                      <span>{formatPrice(fs.final_price)}</span>
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pt-3 pb-4 mt-auto border-t border-zinc-100 dark:border-zinc-800/60 bg-gradient-to-b from-transparent to-zinc-50/60 dark:to-zinc-950/30">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-2xs uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500">Totale</span>
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
            {formatPrice(total)}
          </span>
        </div>
        {isCompleted ? (
          <div className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-md border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="size-4" />
            Pagata
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onDelete(fiche)}
                className="py-2 flex items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-900/40 transition-all active:scale-95"
                title="Elimina"
                aria-label="Elimina"
              >
                <Trash2 className="size-4" />
              </button>
              <button
                onClick={() => onEdit(fiche)}
                className="py-2 flex items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-95"
                title="Modifica"
                aria-label="Modifica"
              >
                <Pencil className="size-4" />
              </button>
            </div>
            <button
              onClick={() => onCheckout(fiche)}
              className="py-2 flex items-center justify-center gap-1.5 text-sm font-medium bg-primary-hover hover:bg-primary-active active:bg-primary-active text-white rounded-md transition-all active:scale-[0.98] shadow-sm hover:shadow-md"
            >
              <Receipt className="size-4" />
              Chiudi Fiche
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
