'use client';

import { useMemo } from 'react';
import { Pencil, Trash2, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { FicheStatus } from '@/lib/types/ficheStatus';
import { FICHE_BUCKET_LABELS, getFicheBucket } from '@/lib/types/Fiche';
import { useServicesStore } from '@/lib/stores/services';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { useOperatorsStore } from '@/lib/stores/operators';
import { DEFAULT_CATEGORY_COLOR } from '@/lib/const/category-colors';
import { Button } from '@/lib/components/shared/ui/Button';
import { StatusDot } from '@/lib/components/shared/ui/StatusDot';
import { FICHE_BUCKET_TONE } from './ficheBucketTone';
import type { Fiche } from '@/lib/types/Fiche';
import type { FicheProduct } from '@/lib/types/FicheProduct';

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
  const productsTotal = (ficheProducts as FicheProduct[]).reduce((sum, fp) => sum + fp.final_price, 0);
  const total = servicesTotal + productsTotal;

  const formatPrice = (value: number) =>
    `€ ${value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const isCompleted = fiche.status === FicheStatus.COMPLETED;
  const bucket = getFicheBucket(fiche);

  const categoryColors = useMemo(() => {
    return ficheServices.map((fs) => {
      const svc = serviceMap.get(fs.service_id);
      const cat = svc?.category_id ? categoryMap.get(svc.category_id) : null;
      return cat?.color ?? DEFAULT_CATEGORY_COLOR;
    });
  }, [ficheServices, serviceMap, categoryMap]);

  return (
    <div
      className="surface-card group relative flex flex-col overflow-hidden hover:shadow-[inset_0_0_0_1px_var(--lume-edge-hover)] transition-shadow duration-[var(--duration-fast)]"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium text-[var(--lume-text)] truncate tracking-tight">
            {client ? client.getFullName() : <span className="text-[var(--lume-text-muted)] font-normal">Cliente sconosciuto</span>}
          </p>
          <p className="mt-0.5 text-xs text-[var(--lume-text-secondary)]">
            <span className="capitalize">{dateLabel}</span>
            <span className="mx-1.5 text-[var(--lume-text-muted)]" aria-hidden>·</span>
            <span className="tabular-nums text-[var(--lume-text)]">{timeWindow}</span>
          </p>
        </div>
        <StatusDot tone={FICHE_BUCKET_TONE[bucket]} className="shrink-0 mt-0.5 text-xs">
          {FICHE_BUCKET_LABELS[bucket]}
        </StatusDot>
      </div>

      {/* Body: services as a thread of category-coloured nodes joined by a hairline. */}
      <div className="px-4 py-3 flex-1 min-h-20 shadow-[inset_0_1px_0_var(--lume-line)]">
        {ficheServices.length === 0 ? (
          <p className="text-xs text-[var(--lume-text-muted)]">
            Nessun servizio aggiunto
          </p>
        ) : (
          <ol>
            {ficheServices.map((fs, i) => {
              const service = serviceMap.get(fs.service_id);
              const operator = operatorMap.get(fs.operator_id);
              const color = categoryColors[i] ?? DEFAULT_CATEGORY_COLOR;
              const isLast = i === ficheServices.length - 1;
              const fsStart = fs.start_time ? format(new Date(fs.start_time), 'HH:mm') : null;
              const fsEnd = fs.end_time ? format(new Date(fs.end_time), 'HH:mm') : null;
              const fsRange = fsStart && fsEnd ? `${fsStart} – ${fsEnd}` : fsStart;
              return (
                <li
                  key={fs.id}
                  className={`relative flex items-start gap-3 ${isLast ? '' : 'pb-3'}`}
                >
                  <span
                    className="relative shrink-0 size-2 mt-1.5 rounded-full"
                    style={{ backgroundColor: color, boxShadow: `0 0 0 3px color-mix(in oklab, ${color} 18%, transparent)` }}
                    aria-hidden
                  />
                  {!isLast && (
                    <span
                      aria-hidden
                      className="absolute left-1 -translate-x-1/2 top-5 bottom-1 w-px pointer-events-none bg-line"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-[var(--lume-text)] truncate">
                        {fs.name || service?.name || '—'}
                      </span>
                      {operator && (
                        <span className="ml-auto text-xs text-[var(--lume-text-secondary)] shrink-0">
                          {operator.firstName}
                        </span>
                      )}
                    </div>
                    <p className="tabular-nums text-xs text-[var(--lume-text-muted)] mt-0.5">
                      {fsRange && <span>{fsRange}</span>}
                      {fsRange && <span className="mx-1.5" aria-hidden>·</span>}
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
      <div className="px-4 pt-3 pb-4 mt-auto shadow-[inset_0_1px_0_var(--lume-line)]">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-xs text-[var(--lume-text-secondary)]">Totale</span>
          <span className="tabular-nums text-base text-[var(--lume-text)]">
            {formatPrice(total)}
          </span>
        </div>
        {isCompleted ? (
          <div className="flex items-center gap-2">
            <StatusDot tone="success" className="flex-1 text-sm">Pagata</StatusDot>
            <Button
              variant="ghost-destructive"
              iconOnly
              aria-label="Elimina"
              onClick={() => onDelete(fiche)}
            >
              <Trash2 />
            </Button>
            <Button
              variant="ghost"
              iconOnly
              aria-label="Modifica"
              tooltip="Modifica fiche chiusa"
              onClick={() => onEdit(fiche)}
            >
              <Pencil />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* Secondary: a grid shows many cards, and indigo stays for the one page action. */}
            <Button variant="secondary" leadingIcon={Receipt} onClick={() => onCheckout(fiche)} className="flex-1">
              Chiudi fiche
            </Button>
            <Button
              variant="ghost-destructive"
              iconOnly
              aria-label="Elimina"
              onClick={() => onDelete(fiche)}
            >
              <Trash2 />
            </Button>
            <Button
              variant="ghost"
              iconOnly
              aria-label="Modifica"
              onClick={() => onEdit(fiche)}
            >
              <Pencil />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
