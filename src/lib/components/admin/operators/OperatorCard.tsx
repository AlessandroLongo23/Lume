'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Phone, Calendar, Edit, Trash, Scissors } from 'lucide-react';
import type { Operator } from '@/lib/types/Operator';

const schedule = [
  { day: 'Lun', hours: '9:00 - 18:00' },
  { day: 'Mar', hours: '9:00 - 18:00' },
  { day: 'Mer', hours: '9:00 - 14:00' },
  { day: 'Gio', hours: '9:00 - 18:00' },
  { day: 'Ven', hours: '9:00 - 18:00' },
  { day: 'Sab', hours: '9:00 - 13:00' },
  { day: 'Dom', hours: 'Chiuso' },
];

const statusColors: Record<string, string> = {
  available: 'bg-green-500 dark:bg-green-400',
  busy: 'bg-amber-500 dark:bg-amber-400',
  offline: 'bg-zinc-400 dark:bg-zinc-500',
};

const statusLabels: Record<string, string> = {
  available: 'Disponibile',
  busy: 'Occupato',
  offline: 'Non disponibile',
};

interface OperatorCardProps {
  operator: Operator;
  onEdit: (operator: Operator) => void;
  onDelete: (operator: Operator) => void;
}

export function OperatorCard({ operator, onEdit, onDelete }: OperatorCardProps) {
  const router = useRouter();
  const [completedServicesPercentage] = useState(() => Math.min(100, Math.floor(Math.random() * 100)));
  const [totalServices] = useState(() => Math.floor(Math.random() * 200) + 50);
  const completedServices = Math.floor((totalServices * completedServicesPercentage) / 100);
  const statuses = ['available', 'busy', 'offline'];
  const [status] = useState(() => statuses[Math.floor(Math.random() * statuses.length)]);

  return (
    <div
      id={`operator-card-${operator.id}`}
      role="button"
      tabIndex={0}
      className="relative group bg-white dark:bg-zinc-900 rounded-lg overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-700 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-200 bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800"
      onClick={() => router.push(`/admin/operatori/${operator.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/admin/operatori/${operator.id}`)}
    >
      <div className="relative">
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/90 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 shadow-sm z-20">
          <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{statusLabels[status]}</span>
        </div>
        <div className="h-24 bg-gradient-to-r from-teal-500/20 to-blue-500/20 dark:from-teal-800/30 dark:to-blue-800/30" />
        <div className="absolute top-12 inset-x-0 flex flex-col items-center">
          <div className="size-24 rounded-full border-4 border-white dark:border-zinc-800 bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 flex items-center justify-center text-xl font-semibold shadow-sm overflow-hidden">
            <span>{operator.firstName?.[0]}{operator.lastName?.[0]}</span>
          </div>
        </div>
      </div>

      <div className="pt-16 p-5">
        <div className="text-center mb-3">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{operator.firstName} {operator.lastName}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Estetista • Generico</p>
        </div>

        <div className="flex justify-between items-center p-3 mb-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <div className="text-center flex-1">
            <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{completedServices}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Servizi</div>
          </div>
          <div className="h-12 w-px bg-zinc-200 dark:bg-zinc-700" />
          <div className="text-center flex-1">
            <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{completedServicesPercentage}%</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Puntualità</div>
          </div>
        </div>

        <div className="space-y-2.5 mb-4">
          {operator.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span className="text-zinc-800 dark:text-zinc-200 truncate" title={operator.email}>{operator.email}</span>
            </div>
          )}
          {operator.phonePrefix && operator.phoneNumber && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span className="text-zinc-800 dark:text-zinc-200">{operator.phonePrefix} {operator.phoneNumber}</span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 rounded-md bg-teal-100 dark:bg-teal-900/30">
              <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            </div>
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Disponibilità</h4>
          </div>
          <div className="grid grid-cols-7 gap-1 text-xs text-center">
            {schedule.map(({ day, hours }) => (
              <div key={day}>
                <div className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">{day}</div>
                <div className="text-zinc-500 dark:text-zinc-400 whitespace-nowrap truncate">{hours}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center px-5 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300">
          <Scissors className="w-3 h-3" />
          <span>3 specializzazioni</span>
        </div>
        <div className="flex gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onEdit(operator); }} className="p-1.5 rounded-md bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 transition-colors" title="Modifica operatore">
            <Edit className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(operator); }} className="p-1.5 rounded-md bg-zinc-200 hover:bg-red-200 dark:bg-zinc-700 dark:hover:bg-red-900/40 transition-colors" title="Elimina operatore">
            <Trash className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
          </button>
        </div>
      </div>
    </div>
  );
}
