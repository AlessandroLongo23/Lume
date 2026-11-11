'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowRight, MoreVertical, Pencil, Trash2, Users, Ticket, Euro, FlaskConical } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { DeletePlatformSalonModal } from './DeletePlatformSalonModal';
import { Portal } from '@/lib/components/shared/ui/Portal';
import { FloatingPanel } from '@/lib/components/shared/ui/FloatingPanel';
import { ListBox, ListRow, ListSeparator } from '@/lib/components/shared/ui/list/ListBox';
import { StatusDot } from '@/lib/components/shared/ui/StatusDot';
import { Tag } from '@/lib/components/shared/ui/Tag';
import { subscriptionStatus } from './subscriptionStatus';
import { useAnchoredPopover } from '@/lib/hooks/useAnchoredPopover';
import { Button } from '@/lib/components/shared/ui/Button';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';

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
  const { tone, label } = subscriptionStatus(status);
  return <StatusDot tone={tone} className="font-medium">{label}</StatusDot>;
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

const MENU_WIDTH = 224;

export function SalonCard({ row }: { row: SalonCardRow }) {
  const router = useRouter();
  const [isEntering, setIsEntering] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(row.name);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmTestToggle, setConfirmTestToggle] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { open: menuOpen, show, hide, position, panelRef, side } = useAnchoredPopover(triggerRef, {
    panelMaxHeight: 160,
    offset: 6,
    align: 'end',
    panelWidth: MENU_WIDTH,
  });

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
  const renewalLabel = row.subscriptionStatus === 'trialing' ? 'Prova fino al' : 'Rinnovo';

  const closeMenu = hide;

  function toggleMenu() {
    if (menuOpen) { hide(); return; }
    setConfirmTestToggle(false);
    show();
  }

  return (
    <div className="surface-card relative flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {row.logoUrl ? (
            <Image
              src={row.logoUrl}
              alt={row.name}
              width={40}
              height={40}
              className="rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="size-10 rounded-lg bg-active flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-[var(--lume-text-secondary)] leading-none">
                {getInitials(row.name)}
              </span>
            </div>
          )}
          <div className="min-w-0">
            {isRenaming ? (
              <FormInput
                autoFocus
                size="sm"
                aria-label="Nuovo nome del salone"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsRenaming(false); }}
                fieldClassName="-mx-2"
                className="px-2 font-medium tracking-tight"
              />
            ) : (
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="text-sm font-medium tracking-tight text-[var(--lume-text)] truncate">
                  {row.name}
                </p>
                {row.isTest && (
                  <Tag className="shrink-0">
                    <FlaskConical aria-hidden />
                    Test
                  </Tag>
                )}
              </div>
            )}
            <p className="text-xs text-[var(--lume-text-secondary)] truncate">{row.ownerEmail}</p>
          </div>
        </div>

        <div className="shrink-0">
          <Button
            ref={triggerRef}
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Azioni"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={toggleMenu}
          >
            <MoreVertical />
          </Button>
          <Portal>
            <AnimatePresence>
              {menuOpen && position && (
                <FloatingPanel
                  ref={panelRef}
                  side={side}
                  layer="dropdown"
                  style={{ position: 'fixed', left: position.left, top: position.top, bottom: position.bottom, width: MENU_WIDTH }}
                >
                  <ListBox role="menu" aria-label="Azioni salone">
                    <ListRow icon={Pencil} onClick={() => { setIsRenaming(true); closeMenu(); }}>
                      Rinomina
                    </ListRow>

                    {confirmTestToggle ? (
                      <div className="px-3 py-2 flex flex-col gap-2">
                        <p className="text-xs text-[var(--lume-text-secondary)]">
                          {row.isTest ? 'Rimuovere il flag di test?' : 'Segnare come salone di test?'}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1"
                            onClick={async () => {
                              closeMenu();
                              try {
                                const res = await fetch(`/api/platform/salons/${row.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ is_test: !row.isTest }),
                                });
                                if (!res.ok) throw new Error('is_test update failed');
                                router.refresh();
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                          >
                            Conferma
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={() => setConfirmTestToggle(false)}
                          >
                            Annulla
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <ListRow icon={FlaskConical} onClick={() => setConfirmTestToggle(true)}>
                        {row.isTest ? 'Rimuovi da test' : 'Segna come test'}
                      </ListRow>
                    )}

                    <ListSeparator />

                    <ListRow icon={Trash2} destructive onClick={() => { setDeleteModalOpen(true); closeMenu(); }}>
                      Elimina
                    </ListRow>
                  </ListBox>
                </FloatingPanel>
              )}
            </AnimatePresence>
          </Portal>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2 py-3 border-y border-line">
        <div className="flex flex-col gap-1 min-w-0">
          <dt className="flex items-center gap-1.5 text-xs text-[var(--lume-text-secondary)]">
            <Users className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
            <span className="truncate">Clienti</span>
          </dt>
          <dd className="text-base tabular-nums text-[var(--lume-text)]">{row.clientsCount}</dd>
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <dt className="flex items-center gap-1.5 text-xs text-[var(--lume-text-secondary)]">
            <Ticket className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
            <span className="truncate">Fiche del mese</span>
          </dt>
          <dd className="text-base tabular-nums text-[var(--lume-text)]">{row.fichesThisMonth}</dd>
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <dt className="flex items-center gap-1.5 text-xs text-[var(--lume-text-secondary)]">
            <Euro className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
            <span className="truncate">Ricavi del mese</span>
          </dt>
          <dd className="text-base tabular-nums text-[var(--lume-text)] truncate">{formatEur(row.revenueThisMonth)}</dd>
        </div>
      </dl>

      <dl className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-[var(--lume-text-secondary)] mb-1">Stato</dt>
          <dd><StatusBadge status={row.subscriptionStatus} /></dd>
        </div>
        <div>
          <dt className="text-[var(--lume-text-secondary)] mb-1">Piano</dt>
          <dd className="text-[var(--lume-text)] font-medium">{plan}</dd>
        </div>
        <div>
          <dt className="text-[var(--lume-text-secondary)] mb-1">{renewalLabel}</dt>
          <dd className="text-[var(--lume-text)] tabular-nums">{formatDate(renewalDate)}</dd>
        </div>
        <div>
          <dt className="text-[var(--lume-text-secondary)] mb-1">Creato</dt>
          <dd className="text-[var(--lume-text)] tabular-nums">{formatDate(row.createdAt)}</dd>
        </div>
      </dl>

      {/* Secondary, not primary: a grid of cards would otherwise paint one
          indigo button per salon. */}
      <Button
        variant="secondary"
        size="sm"
        loading={isEntering}
        trailingIcon={ArrowRight}
        onClick={handleEnter}
        className="mt-1 w-full max-md:h-11"
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
