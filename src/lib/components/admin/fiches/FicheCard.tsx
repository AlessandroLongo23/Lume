'use client';

import { useMemo } from 'react';
import { Scissors, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { FicheStatus } from '@/lib/types/ficheStatus';
import { useServicesStore } from '@/lib/stores/services';
import { useOperatorsStore } from '@/lib/stores/operators';
import type { Fiche } from '@/lib/types/Fiche';
import type { FicheProduct } from '@/lib/types/FicheProduct';

const STATUS_STYLES: Record<string, string> = {
  [FicheStatus.CREATED]: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
  [FicheStatus.PENDING]: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  [FicheStatus.COMPLETED]: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700',
};

const STATUS_LABELS: Record<string, string> = {
  [FicheStatus.CREATED]: 'Creata',
  [FicheStatus.PENDING]: 'In corso',
  [FicheStatus.COMPLETED]: 'Completata',
};

interface FicheCardProps {
  fiche: Fiche;
  onEdit: (fiche: Fiche) => void;
  onDelete: (fiche: Fiche) => void;
  onCheckout: (fiche: Fiche) => void;
}

export function FicheCard({ fiche, onEdit, onDelete, onCheckout }: FicheCardProps) {
  const services = useServicesStore((s) => s.services);
  const operators = useOperatorsStore((s) => s.operators);
  const serviceMap = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);
  const operatorMap = useMemo(() => new Map(operators.map((o) => [o.id, o])), [operators]);

  const client = fiche.getClient();
  const ficheServices = fiche.getFicheServices();
  const ficheProducts = fiche.getFicheProducts();
  const time = new Date(fiche.datetime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  const servicesTotal = ficheServices.reduce((sum, fs) => sum + fs.final_price, 0);
  const productsTotal = (ficheProducts as FicheProduct[]).reduce((sum, fp) => sum + (fp.final_price * fp.quantity), 0);
  const total = servicesTotal + productsTotal;

  const isCompleted = fiche.status === FicheStatus.COMPLETED;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="px-4 py-3 flex items-start justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800">
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {client ? client.getFullName() : <span className="text-zinc-400 font-normal">Cliente sconosciuto</span>}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{time}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[fiche.status] ?? ''}`}>
            {STATUS_LABELS[fiche.status] ?? fiche.status}
          </span>
          <button
            onClick={() => onEdit(fiche)}
            className="p-1.5 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Modifica"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={() => onDelete(fiche)}
            className="p-1.5 rounded text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Elimina"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 flex-1 space-y-2 min-h-[80px]">
        {ficheServices.length === 0 ? (
          <p className="text-xs text-zinc-400 italic">Nessun servizio aggiunto</p>
        ) : (
          ficheServices.map((fs) => {
            const service = serviceMap.get(fs.service_id);
            const operator = operatorMap.get(fs.operator_id);
            return (
              <div key={fs.id} className="flex items-center gap-2 min-w-0">
                <Scissors className="size-3 text-zinc-400 shrink-0" />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
                  {service?.name ?? '—'}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">
                  {operator ? operator.firstName : '—'}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pt-4 pb-4 border-t border-zinc-100 dark:border-zinc-800 mt-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Totale</span>
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            € {total.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        {isCompleted ? (
          <div className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-md border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="size-4" />
            Pagata
          </div>
        ) : (
          <button
            onClick={() => onCheckout(fiche)}
            className="w-full py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-md transition-colors"
          >
            Chiudi Fiche
          </button>
        )}
      </div>
    </div>
  );
}
