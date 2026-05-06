'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowRight, MoreVertical, Pencil, Trash2, Users, Ticket, Euro, FlaskConical } from 'lucide-react';
import { DeletePlatformSalonModal } from './DeletePlatformSalonModal';
import { Button } from '@/lib/components/shared/ui/Button';

export type SalonCardRow = {
  id:                 string;
  name:               string;
  logoUrl:            string | null;
  ownerEmail:         string;
  ownerName:          string;
  subscriptionStatus: string;
  subscriptionPlan:   string | null;
  subscriptionEndsAt: string | null;
  trialEndsAt:        string;
  createdAt:          string;
  clientsCount:       number;
  fichesThisMonth:    number;
  revenueThisMonth:   number;
  isTest:             boolean;
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    trialing:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    past_due:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    canceled:   'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    unpaid:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    incomplete: 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  };
  const labels: Record<string, string> = {
    active:     'Attivo',
    trialing:   'Trial',
    past_due:   'Scaduto',
    canceled:   'Annullato',
    unpaid:     'Non pagato',
    incomplete: 'Incompleto',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] ?? styles.incomplete}`}>
      {labels[status] ?? status}
    </span>
  );
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatEur(value: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

export function SalonCard({ row }: { row: SalonCardRow }) {
  const router = useRouter();
  const [isEntering, setIsEntering] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(row.name);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmTestToggle, setConfirmTestToggle] = useState(false);

  async function handleEnter() {
    setIsEntering(true);
    try {
      const res = await fetch('/api/platform/enter-salon', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ salonId: row.id }),
      });
      if (!res.ok) throw new Error('enter-salon failed');
      const { redirect } = await res.json();
      router.push(redirect ?? '/admin/calendario');
    } catch (err) {
      console.error(err);
      setIsEntering(false);
    }
  }

  async function handleRename() {
    const name = renameValue.trim();
    if (!name || name === row.name) {
      setIsRenaming(false);
      return;
    }
    const res = await fetch(`/api/platform/salons/${row.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name }),
    });
    if (res.ok) {
      setIsRenaming(false);
      router.refresh();
    }
  }

  const plan = row.subscriptionPlan === 'yearly' ? 'Annuale' : row.subscriptionPlan === 'monthly' ? 'Mensile' : '—';
  const renewalDate = row.subscriptionStatus === 'trialing' ? row.trialEndsAt : row.subscriptionEndsAt;
  const renewalLabel = row.subscriptionStatus === 'trialing' ? 'Trial fino al' : 'Rinnovo';

  return (
    <div className="relative flex flex-col gap-4 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-card hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {row.logoUrl ? (
            <Image
              src={row.logoUrl}
              alt={row.name}
              width={40}
              height={40}
              className="rounded-md object-cover shrink-0 border border-zinc-200 dark:border-zinc-700"
            />
          ) : (
            <div className="w-10 h-10 rounded-md bg-primary/15 dark:bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-primary-hover dark:text-primary/70 leading-none">
                {getInitials(row.name)}
              </span>
            </div>
          )}
          <div className="min-w-0">
            {isRenaming ? (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsRenaming(false); }}
                className="w-full text-sm font-semibold tracking-tight text-zinc-900 dark:text-white bg-transparent border-b border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-primary"
              />
            ) : (
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white truncate">
                  {row.name}
                </p>
                {row.isTest && (
                  <span className="shrink-0 flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                    <FlaskConical className="size-2.5" />
                    Test
                  </span>
                )}
              </div>
            )}
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{row.ownerEmail}</p>
          </div>
        </div>

        <div className="relative shrink-0">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Azioni"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MoreVertical />
          </Button>
          {menuOpen && (
            <>
              <button
                type="button"
                aria-label="Chiudi menu"
                className="fixed inset-0"
                onClick={() => { setMenuOpen(false); setConfirmTestToggle(false); }}
              />
              <div className="absolute right-0 top-8 z-dropdown w-48 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg py-1">
                <button
                  type="button"
                  onClick={() => { setIsRenaming(true); setMenuOpen(false); setConfirmTestToggle(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Pencil className="w-4 h-4" /> Rinomina
                </button>

                {confirmTestToggle ? (
                  <div className="px-3 py-2 flex flex-col gap-2">
                    <p className="text-xs text-zinc-600 dark:text-zinc-300">
                      {row.isTest ? 'Rimuovere il flag di test?' : 'Segnare come salone di test?'}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          setConfirmTestToggle(false);
                          setMenuOpen(false);
                          await fetch(`/api/platform/salons/${row.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ is_test: !row.isTest }),
                          });
                          router.refresh();
                        }}
                        className="flex-1 text-xs px-2 py-1 rounded bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100"
                      >
                        Conferma
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmTestToggle(false)}
                        className="flex-1 text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmTestToggle(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <FlaskConical className="w-4 h-4" />
                    {row.isTest ? 'Rimuovi da test' : 'Segna come test'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => { setDeleteModalOpen(true); setMenuOpen(false); setConfirmTestToggle(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="w-4 h-4" /> Elimina
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-3">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
            <Users className="size-3.5" strokeWidth={1.75} />
            <span className="text-[10px] uppercase tracking-wider">Clienti</span>
          </div>
          <p className="text-base font-semibold tabular-nums text-zinc-900 dark:text-white">{row.clientsCount}</p>
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
            <Ticket className="size-3.5" strokeWidth={1.75} />
            <span className="text-[10px] uppercase tracking-wider">Fiches/m</span>
          </div>
          <p className="text-base font-semibold tabular-nums text-zinc-900 dark:text-white">{row.fichesThisMonth}</p>
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
            <Euro className="size-3.5" strokeWidth={1.75} />
            <span className="text-[10px] uppercase tracking-wider">Ricavi/m</span>
          </div>
          <p className="text-base font-semibold tabular-nums text-zinc-900 dark:text-white truncate">{formatEur(row.revenueThisMonth)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-zinc-500 dark:text-zinc-400 mb-1">Stato</p>
          <StatusBadge status={row.subscriptionStatus} />
        </div>
        <div>
          <p className="text-zinc-500 dark:text-zinc-400 mb-1">Piano</p>
          <p className="text-zinc-900 dark:text-zinc-100 font-medium">{plan}</p>
        </div>
        <div>
          <p className="text-zinc-500 dark:text-zinc-400 mb-1">{renewalLabel}</p>
          <p className="text-zinc-900 dark:text-zinc-100 font-medium tabular-nums">{formatDate(renewalDate)}</p>
        </div>
        <div>
          <p className="text-zinc-500 dark:text-zinc-400 mb-1">Creato</p>
          <p className="text-zinc-900 dark:text-zinc-100 font-medium tabular-nums">{formatDate(row.createdAt)}</p>
        </div>
      </div>

      <Button
        variant="primary"
        size="sm"
        fullWidth
        loading={isEntering}
        leadingIcon={ArrowRight}
        onClick={handleEnter}
        className="mt-1"
      >
        {isEntering ? 'Entrando…' : 'Entra nel salone'}
      </Button>

      <DeletePlatformSalonModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        salonId={row.id}
        salonName={row.name}
      />
    </div>
  );
}
