'use client';

import { useRouter } from 'next/navigation';
import { Plane, Mail, Phone, Calendar, Smile, Trash, ArchiveRestore } from 'lucide-react';
import type { Client } from '@/lib/types/Client';
import { useClientRatingsStore } from '@/lib/stores/client_ratings';
import { ClientRatingBadge } from './ClientRatingBadge';

const genderColors: Record<string, string> = {
  M: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  F: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800',
};

const initialsColors: Record<string, string> = {
  M: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
  F: 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300',
};

interface ClientCardProps {
  client: Client;
  onDelete: (client: Client) => void;
  onRestore?: (client: Client) => void;
  showArchived?: boolean;
}

export function ClientCard({ client, onDelete, onRestore, showArchived = false }: ClientCardProps) {
  const router = useRouter();
  const rating = useClientRatingsStore((s) => s.ratings[client.id]);

  return (
    <div
      id={`client-card-${client.id}`}
      role="button"
      tabIndex={0}
      className={`relative group bg-white dark:bg-zinc-900 rounded-lg overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-700 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-200 ${genderColors[client.gender] ?? ''}`}
      onClick={() => router.push(`/admin/clienti/${client.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/admin/clienti/${client.id}`)}
    >
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${initialsColors[client.gender] ?? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>
            {client.firstName?.[0]}{client.lastName?.[0]}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {client.firstName} {client.lastName}
            </h3>
            <div className="flex items-center mt-1 gap-2 text-xs">
              {client.isTourist && (
                <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-amber-700 dark:text-amber-300">
                  <Plane className="w-3 h-3 mr-1" />
                  Turista
                </span>
              )}
              <span className="text-zinc-500 dark:text-zinc-400">
                {(client as unknown as { created_at?: string }).created_at
                  ? `Cliente dal ${new Date((client as unknown as { created_at: string }).created_at).toLocaleDateString('it-IT')}`
                  : 'Cliente'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {client.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span className="text-zinc-800 dark:text-zinc-200 truncate" title={client.email}>{client.email}</span>
            </div>
          )}
          {client.phonePrefix && client.phoneNumber && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span className="text-zinc-800 dark:text-zinc-200">{client.phonePrefix} {client.phoneNumber}</span>
            </div>
          )}
          {client.birthDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span className="text-zinc-800 dark:text-zinc-200">{new Date(client.birthDate).toLocaleDateString('it-IT')}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 pt-3 border-t border-zinc-200 dark:border-zinc-700">
          <ClientRatingBadge stars={rating ? rating.spend_stars : null} kind="money" />
          <ClientRatingBadge stars={rating ? rating.visit_stars : null} kind="calendar" />
        </div>
      </div>

      <div className="flex justify-between items-center px-5 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center">
          {client.gender === 'M' ? (
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">M</span>
          ) : client.gender === 'F' ? (
            <span className="text-sm font-semibold text-pink-600 dark:text-pink-400">F</span>
          ) : (
            <Smile className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          )}
        </div>
        <div className="flex gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
          {showArchived ? (
            <button
              onClick={(e) => { e.stopPropagation(); onRestore?.(client); }}
              className="p-1.5 rounded-md bg-zinc-200 hover:bg-emerald-200 dark:bg-zinc-700 dark:hover:bg-emerald-900/40 transition-colors"
              title="Ripristina cliente"
            >
              <ArchiveRestore className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300 hover:text-emerald-700 dark:hover:text-emerald-400" />
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(client); }}
              className="p-1.5 rounded-md bg-zinc-200 hover:bg-red-200 dark:bg-zinc-700 dark:hover:bg-red-900/40 transition-colors"
              title="Elimina cliente"
            >
              <Trash className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300 hover:text-red-700 dark:hover:text-red-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
