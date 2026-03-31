'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Mail, Phone, Copy, Contact2, FileHeart, ClipboardList, UserX } from 'lucide-react';
import { useClientsStore } from '@/lib/stores/clients';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { EditClientModal } from '@/lib/components/admin/clients/EditClientModal';
import { DeleteClientModal } from '@/lib/components/admin/clients/DeleteClientModal';
import type { Client } from '@/lib/types/Client';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clients = useClientsStore((s) => s.clients);
  const isLoading = useClientsStore((s) => s.isLoading);

  const [client, setClient] = useState<Client | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editedClient, setEditedClient] = useState<Partial<Client>>({});

  const clientId = params.id as string;

  useEffect(() => {
    if (!isLoading) {
      const found = clients.find((c) => c.id === clientId);
      if (found) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setClient(found);
      } else {
        setError('Cliente non trovato');
      }
    }
  }, [clients, clientId, isLoading]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="w-16 h-16 border-4 border-zinc-500/25 border-t-blue-500 rounded-full animate-spin" />
        <p className="mt-4 text-zinc-500 dark:text-zinc-400">Caricamento...</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
        <UserX className="size-16 text-zinc-400 dark:text-zinc-500 mb-4" />
        <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-300 mb-2">Cliente non trovato</h2>
        <p className="text-zinc-600 dark:text-zinc-400">{error ?? 'Il cliente non esiste o è stato rimosso.'}</p>
        <button
          className="mt-6 px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-100 rounded-md transition-colors"
          onClick={() => router.push('/admin/clienti')}
        >
          Torna alla lista clienti
        </button>
      </div>
    );
  }

  const isMale = client.gender === 'M';
  const genderBg = isMale ? 'bg-blue-100 dark:bg-blue-900' : 'bg-pink-100 dark:bg-pink-900';
  const genderText = isMale ? 'text-blue-600 dark:text-blue-300' : 'text-pink-600 dark:text-pink-300';
  const genderBadge = isMale ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300';

  return (
    <>
      <EditClientModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        selectedClient={client}
        editedClient={editedClient}
        onEditedClientChange={setEditedClient}
      />
      <DeleteClientModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        selectedClient={client}
      />

      <div className="flex h-full gap-0">
        {/* Left column */}
        <div className="w-1/3 p-4 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/clienti')}
              className="p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
              aria-label="Torna indietro"
            >
              <ArrowLeft className="size-5 text-zinc-600 dark:text-zinc-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{client.firstName} {client.lastName}</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Dettagli cliente</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-500/25 overflow-hidden">
            <div className="p-8 flex flex-col items-center">
              <div className={`size-32 rounded-full ${genderBg} flex items-center justify-center mb-4`}>
                <span className={`text-3xl font-bold ${genderText}`}>
                  {client.firstName?.[0]}{client.lastName?.[0]}
                </span>
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{client.firstName} {client.lastName}</h2>
              {client.birthDate && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Data di nascita: {new Date(client.birthDate).toLocaleDateString('it-IT')}
                </p>
              )}
              <div className="flex flex-row justify-between items-center mt-6 w-full border-t border-zinc-500/25 pt-6">
                <span className={`text-sm ${genderBadge} px-3 py-1 rounded-full`}>
                  {isMale ? 'Uomo' : 'Donna'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditedClient(client); setShowEdit(true); }}
                    className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-md transition-colors"
                    aria-label="Modifica cliente"
                  >
                    <Edit className="size-5 text-zinc-600 dark:text-zinc-300" />
                  </button>
                  <button
                    onClick={() => setShowDelete(true)}
                    className="p-2 bg-zinc-100 hover:bg-red-100 dark:bg-zinc-800 dark:hover:bg-red-900/30 rounded-md transition-colors"
                    aria-label="Elimina cliente"
                  >
                    <Trash2 className="size-5 text-zinc-600 dark:text-zinc-300 hover:text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="w-2/3 p-4 overflow-y-auto flex flex-col gap-8">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-500/25 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-zinc-500/25">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Contact2 className="size-5 text-zinc-600 dark:text-zinc-400" />
                Informazioni di contatto
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="size-4 text-zinc-500 dark:text-zinc-400" />
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Email</p>
                </div>
                <div className="flex items-center gap-2">
                  {client.email ? (
                    <>
                      <p className="text-base text-zinc-900 dark:text-zinc-100">{client.email}</p>
                      <button
                        className="p-1 text-zinc-400 hover:text-blue-500"
                        onClick={() => { navigator.clipboard.writeText(client.email); messagePopup.getState().success('Email copiata negli appunti'); }}
                        title="Copia negli appunti"
                      >
                        <Copy className="size-4" />
                      </button>
                    </>
                  ) : (
                    <p className="text-base text-zinc-400 dark:text-zinc-500 italic">Nessuna email</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="size-4 text-zinc-500 dark:text-zinc-400" />
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Telefono</p>
                </div>
                <div className="flex items-center gap-2">
                  {client.phonePrefix && client.phoneNumber ? (
                    <>
                      <p className="text-base text-zinc-900 dark:text-zinc-100">{client.phonePrefix} {client.phoneNumber}</p>
                      <button
                        className="p-1 text-zinc-400 hover:text-blue-500"
                        onClick={() => { navigator.clipboard.writeText(client.phonePrefix + client.phoneNumber); messagePopup.getState().success('Numero copiato negli appunti'); }}
                        title="Copia negli appunti"
                      >
                        <Copy className="size-4" />
                      </button>
                    </>
                  ) : (
                    <p className="text-base text-zinc-400 dark:text-zinc-500 italic">Nessun telefono</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-500/25 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-zinc-500/25">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <FileHeart className="size-5 text-zinc-600 dark:text-zinc-400" />
                Note
              </h3>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="size-4 text-zinc-500 dark:text-zinc-400" />
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Note sul cliente</span>
              </div>
              {client.note ? (
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-md p-4 border border-zinc-500/25">
                  <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">{client.note}</p>
                </div>
              ) : (
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-md p-4 border border-dashed border-zinc-300 dark:border-zinc-700 text-center">
                  <p className="text-zinc-400 dark:text-zinc-500">Nessuna nota</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
