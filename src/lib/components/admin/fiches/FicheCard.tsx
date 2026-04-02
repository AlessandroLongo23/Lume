'use client';

import { Scissors, User, Pencil, Trash2 } from 'lucide-react';
import { FicheStatus } from '@/lib/types/ficheStatus';
import { useServicesStore } from '@/lib/stores/services';
import { useOperatorsStore } from '@/lib/stores/operators';
import type { Fiche } from '@/lib/types/Fiche';

const STATUS_STYLES: Record<string, string> = {
  [FicheStatus.CREATED]: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  [FicheStatus.PENDING]: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  [FicheStatus.COMPLETED]: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
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

  const client = fiche.getClient();
  const ficheServices = fiche.getFicheServices();
  const time = new Date(fiche.datetime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  const total = ficheServices.reduce((sum, fs) => {
    const service = services.find((s) => s.id === fs.service_id);
    return sum + (service?.price ?? 0);
  }, 0);

  const isCompleted = fiche.status === FicheStatus.COMPLETED;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="px-4 py-3 flex items-start justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {client ? client.getFullName() : <span className="text-zinc-400">Cliente sconosciuto</span>}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{time}</p>
        </div>
        <span className={`inline-flex shrink-0 items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[fiche.status] ?? ''}`}>
          {STATUS_LABELS[fiche.status] ?? fiche.status}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 flex-1 space-y-2 min-h-[80px]">
        {ficheServices.length === 0 ? (
          <p className="text-xs text-zinc-400 italic">Nessun servizio aggiunto</p>
        ) : (
          ficheServices.map((fs) => {
            const service = services.find((s) => s.id === fs.service_id);
            const operator = operators.find((o) => o.id === fs.operator_id);
            return (
              <div key={fs.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Scissors className="size-3 text-zinc-400 shrink-0" />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate">
                    {service?.name ?? '—'}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <User className="size-3 text-zinc-400" />
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                    {operator ? operator.firstName : '—'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100 shrink-0">
          € {total.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        {isCompleted ? (
          <div className="flex-1 flex items-center justify-center py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Pagata ✓
          </div>
        ) : (
          <button
            onClick={() => onCheckout(fiche)}
            className="flex-1 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-md transition-colors"
          >
            Chiudi Fiche
          </button>
        )}
        <div className="flex items-center gap-1 shrink-0">
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
    </div>
  );
}
