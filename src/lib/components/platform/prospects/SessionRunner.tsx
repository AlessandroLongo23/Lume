'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  PhoneOff,
  CalendarClock,
  XCircle,
  Laptop2,
  CheckCircle2,
  Send,
  Trophy,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Phone,
  Smartphone,
  MapPin,
  StickyNote,
  X,
  Check,
  PanelsTopLeft,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/lib/components/shared/ui/Button';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useProspectsStore } from '@/lib/stores/prospects';
import { Prospect, type ProspectStatus, STATUS_LABEL } from '@/lib/types/Prospect';
import { ProspectStatusChip } from './ProspectStatusChip';
import { cn } from '@/lib/utils';

interface SessionRunnerProps {
  queue: Prospect[];
}

const ACTION_BUTTONS: { key: string; label: string; status: ProspectStatus | 'callback' | 'interested' | 'materials_sent' | 'signed_up'; icon: React.ComponentType<{ className?: string }>; tone: 'neutral' | 'warning' | 'danger' | 'accent' | 'success' }[] = [
  { key: '1', label: 'Non risponde',     status: 'no_answer',          icon: PhoneOff,     tone: 'neutral' },
  { key: '2', label: 'Richiamare',       status: 'callback',           icon: CalendarClock, tone: 'warning' },
  { key: '3', label: 'Non interessato',  status: 'not_interested',     icon: XCircle,      tone: 'danger'  },
  { key: '4', label: 'Senza PC',         status: 'no_pc',              icon: Laptop2,      tone: 'danger'  },
  { key: '5', label: 'Interessato',      status: 'interested',         icon: CheckCircle2, tone: 'accent'  },
  { key: '6', label: 'Materiali inviati', status: 'materials_sent',    icon: Send,         tone: 'accent'  },
  { key: '7', label: 'Cliente',          status: 'signed_up',          icon: Trophy,       tone: 'success' },
];

const TONE_CLASSES: Record<'neutral' | 'warning' | 'danger' | 'accent' | 'success', string> = {
  neutral: 'border-border bg-card hover:bg-muted/60 text-foreground',
  warning: 'border-[var(--lume-warning-border)] bg-[var(--lume-warning-bg)] hover:brightness-95 text-[var(--lume-warning-fg)]',
  danger:  'border-[var(--lume-danger-border)]  bg-[var(--lume-danger-bg)]  hover:brightness-95 text-[var(--lume-danger-fg)]',
  accent:  'border-[var(--lume-accent-light)]   bg-[var(--lume-accent-light)] hover:brightness-95 text-[var(--lume-accent-dark)]',
  success: 'border-[var(--lume-success-border)] bg-[var(--lume-success-bg)] hover:brightness-95 text-[var(--lume-success-fg)]',
};

export function SessionRunner({ queue: initialQueue }: SessionRunnerProps) {
  const update = useProspectsStore((s) => s.update);

  const [index, setIndex] = useState(0);
  const queue = initialQueue;
  const [callbackOpen, setCallbackOpen]     = useState(false);
  const [interestedOpen, setInterestedOpen] = useState(false);
  const [callbackAt,   setCallbackAt]   = useState('');
  const [phonePersonal, setPhonePersonal] = useState('');
  const [ownerName,    setOwnerName]    = useState('');
  const [interestedNote, setInterestedNote] = useState('');
  const [working, setWorking] = useState(false);
  const [tick, setTick]       = useState(0); // force-refresh timer for "live" updated_at displays

  // Refresh ticking display every minute so callback timing stays current
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  // Latest version of the displayed prospect (so any other session mutations are reflected)
  const live = useProspectsStore((s) => s.prospects);
  const current = useMemo(() => {
    const target = queue[index];
    if (!target) return null;
    return live.find((p) => p.id === target.id) ?? target;
  }, [queue, index, live]);

  const advance = useCallback(() => {
    setIndex((i) => i + 1);
    setCallbackOpen(false);
    setInterestedOpen(false);
    setCallbackAt('');
    setPhonePersonal('');
    setOwnerName('');
    setInterestedNote('');
  }, []);

  const back = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
    setCallbackOpen(false);
    setInterestedOpen(false);
  }, []);

  const apply = useCallback(async (patch: Parameters<typeof update>[1], successMsg = 'Aggiornato') => {
    if (!current) return;
    setWorking(true);
    try {
      await update(current.id, patch);
      messagePopup.getState().success(successMsg);
      advance();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
      messagePopup.getState().error('Errore: ' + msg);
    } finally {
      setWorking(false);
    }
  }, [current, update, advance]);

  const handleAction = useCallback(async (status: typeof ACTION_BUTTONS[number]['status']) => {
    if (status === 'callback') {
      setCallbackOpen(true);
      return;
    }
    if (status === 'interested') {
      setInterestedOpen(true);
      return;
    }
    await apply({ status: status as ProspectStatus });
  }, [apply]);

  const submitCallback = useCallback(async () => {
    if (!callbackAt) {
      messagePopup.getState().error('Imposta data e ora del richiamo');
      return;
    }
    await apply(
      { status: 'callback_scheduled', callback_at: new Date(callbackAt).toISOString() },
      'Richiamo programmato',
    );
  }, [apply, callbackAt]);

  const submitInterested = useCallback(async () => {
    if (!phonePersonal.trim()) {
      messagePopup.getState().error('Inserisci il numero personale del titolare');
      return;
    }
    const patch: Parameters<typeof update>[1] = {
      status:         'interested',
      phone_personal: phonePersonal.trim(),
    };
    if (ownerName.trim()) patch.owner_name = ownerName.trim();
    if (interestedNote.trim()) {
      patch.notes = current?.notes
        ? `${current.notes}\n— ${new Date().toLocaleDateString('it-IT')}: ${interestedNote.trim()}`
        : interestedNote.trim();
    }
    await apply(patch, 'Marcato come interessato');
  }, [apply, phonePersonal, ownerName, interestedNote, current]);

  // Keyboard shortcuts (1-7 for actions, ← → navigation, Esc to close inline forms)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (callbackOpen || interestedOpen) {
        if (e.key === 'Escape') {
          setCallbackOpen(false); setInterestedOpen(false);
        }
        return;
      }
      if (e.key === 'ArrowRight') { advance(); return; }
      if (e.key === 'ArrowLeft')  { back();    return; }
      const action = ACTION_BUTTONS.find((a) => a.key === e.key);
      if (action) {
        e.preventDefault();
        handleAction(action.status);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [advance, back, handleAction, callbackOpen, interestedOpen]);

  // Done state
  if (!current || index >= queue.length) {
    return (
      <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-4 py-20 text-center">
        <Trophy className="size-12 text-[var(--lume-success-fg)]" />
        <h2 className="text-xl font-semibold text-foreground">Sessione completata</h2>
        <p className="text-sm text-muted-foreground">
          Hai chiamato {queue.length} prospect{queue.length === 1 ? '' : ''}. Buon lavoro.
        </p>
        <Link href="/platform/prospects" className="mt-2">
          <Button variant="primary" leadingIcon={PanelsTopLeft}>
            Torna alla lista
          </Button>
        </Link>
      </div>
    );
  }

  const progress = queue.length === 0 ? 0 : ((index + 1) / queue.length) * 100;
  const callbackOverdue = current.callback_at && new Date(current.callback_at).getTime() < Date.now();

  // Tick referenced to satisfy the timer effect dependency
  void tick;

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Link href="/platform/prospects">
          <Button variant="ghost" size="sm" leadingIcon={PanelsTopLeft}>Lista</Button>
        </Link>
        <div className="flex-1 max-w-xs">
          <div className="text-xs text-muted-foreground tabular-nums text-center mb-1">
            {index + 1} di {queue.length}
            {queue.length > 0 && (
              <span className="mx-2">·</span>
            )}
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-[var(--lume-accent)] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" iconOnly aria-label="Indietro" onClick={back} disabled={index === 0}>
            <ArrowLeft />
          </Button>
          <Button variant="ghost" size="sm" iconOnly aria-label="Salta" onClick={advance}>
            <ArrowRight />
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto max-w-3xl rounded-xl border border-border bg-card shadow-sm p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground truncate">
                {current.name}
              </h1>
              {current.cityProvince && (
                <div className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-4" />
                  <span>{current.cityProvince}</span>
                  {current.region && <span>· {current.region}</span>}
                </div>
              )}
            </div>
            <ProspectStatusChip status={current.status} />
          </div>

          {/* Callback indicator */}
          {current.callback_at && (
            <div className={cn(
              'rounded-lg border px-4 py-3 text-sm flex items-center gap-2',
              callbackOverdue
                ? 'border-[var(--lume-danger-border)] bg-[var(--lume-danger-bg)] text-[var(--lume-danger-fg)]'
                : 'border-[var(--lume-warning-border)] bg-[var(--lume-warning-bg)] text-[var(--lume-warning-fg)]',
            )}>
              <CalendarClock className="size-4" />
              <span>
                Da richiamare il <strong className="tabular-nums">{new Date(current.callback_at).toLocaleString('it-IT')}</strong>
                {callbackOverdue && ' (scaduto)'}
              </span>
            </div>
          )}

          {/* Contact grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ContactRow icon={Phone} label="Telefono salone" value={current.phone_shop}
                        whatsapp={current.whatsappUrl(current.phone_shop)} />
            <ContactRow icon={Smartphone} label="Telefono titolare" value={current.phone_personal}
                        whatsapp={current.whatsappUrl(current.phone_personal)} />
            {current.owner_name && <InfoRow label="Titolare" value={current.owner_name} />}
            {current.current_software && <InfoRow label="Software" value={current.current_software} />}
            {current.address && <InfoRow label="Indirizzo" value={current.address} />}
            <InfoRow label="Chiamate fatte" value={String(current.call_count)} />
          </div>

          {current.google_maps_url && (
            <a
              href={current.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[var(--lume-accent)] hover:text-[var(--lume-accent-dark)] transition-colors"
            >
              <ExternalLink className="size-4" />
              Apri su Google Maps
            </a>
          )}

          {current.notes && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide mb-1">
                <StickyNote className="size-3.5" />
                Note
              </div>
              <div className="whitespace-pre-wrap">{current.notes}</div>
            </div>
          )}

          {/* Action buttons */}
          {!callbackOpen && !interestedOpen && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-2">
              {ACTION_BUTTONS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => handleAction(a.status)}
                  disabled={working}
                  className={cn(
                    'flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border text-sm font-medium transition-all',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    TONE_CLASSES[a.tone],
                  )}
                >
                  <a.icon className="size-5" />
                  <span>{a.label}</span>
                  <span className="text-[10px] opacity-60 font-mono tabular-nums">{a.key}</span>
                </button>
              ))}
            </div>
          )}

          {/* Inline callback form */}
          {callbackOpen && (
            <div className="rounded-lg border border-[var(--lume-warning-border)] bg-[var(--lume-warning-bg)]/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground inline-flex items-center gap-2">
                  <CalendarClock className="size-4 text-[var(--lume-warning-fg)]" />
                  Programma richiamo
                </h3>
                <Button variant="ghost" size="sm" iconOnly aria-label="Chiudi" onClick={() => setCallbackOpen(false)}>
                  <X />
                </Button>
              </div>
              <input
                type="datetime-local"
                value={callbackAt}
                onChange={(e) => setCallbackAt(e.target.value)}
                className="w-full rounded-md border bg-card text-foreground border-input focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none px-3 py-2 text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setCallbackOpen(false)}>Annulla</Button>
                <Button variant="primary" size="sm" leadingIcon={Check} onClick={submitCallback} disabled={working}>
                  Conferma
                </Button>
              </div>
            </div>
          )}

          {/* Inline interested form */}
          {interestedOpen && (
            <div className="rounded-lg border border-[var(--lume-accent-light)] bg-[var(--lume-accent-light)]/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground inline-flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[var(--lume-accent)]" />
                  Marcalo come interessato
                </h3>
                <Button variant="ghost" size="sm" iconOnly aria-label="Chiudi" onClick={() => setInterestedOpen(false)}>
                  <X />
                </Button>
              </div>
              <FormInput
                label="Telefono personale del titolare"
                value={phonePersonal}
                onChange={(e) => setPhonePersonal(e.target.value)}
                required
                placeholder="+39 333 1234567"
                inputMode="tel"
              />
              <FormInput
                label="Nome titolare"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Mario Rossi"
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Nota rapida</label>
                <textarea
                  value={interestedNote}
                  onChange={(e) => setInterestedNote(e.target.value)}
                  placeholder="Cosa hai concordato?"
                  rows={2}
                  className="w-full rounded-md border bg-card text-foreground placeholder:text-muted-foreground border-input focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setInterestedOpen(false)}>Annulla</Button>
                <Button variant="primary" size="sm" leadingIcon={Check} onClick={submitInterested} disabled={working}>
                  Conferma
                </Button>
              </div>
            </div>
          )}

          <div className="border-t border-border pt-4 text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
            <span>Tasti rapidi:</span>
            {ACTION_BUTTONS.map((a) => (
              <span key={a.key} className="inline-flex items-center gap-1">
                <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border">{a.key}</kbd>
                <span>{a.label}</span>
              </span>
            ))}
            <span className="ml-auto inline-flex items-center gap-1">
              <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border">→</kbd>
              salta
            </span>
          </div>

          <div className="text-[10px] text-muted-foreground/70 italic">
            Stato attuale: {STATUS_LABEL[current.status]}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactRow({ icon: Icon, label, value, whatsapp }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | null; whatsapp: string | null }) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 flex items-center gap-2.5">
      <Icon className="size-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-sm text-foreground tabular-nums truncate">
          {value ?? <span className="italic text-muted-foreground">—</span>}
        </div>
      </div>
      {whatsapp && (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--lume-success-fg)] hover:underline shrink-0"
        >
          WhatsApp
        </a>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground truncate">{value}</div>
    </div>
  );
}
