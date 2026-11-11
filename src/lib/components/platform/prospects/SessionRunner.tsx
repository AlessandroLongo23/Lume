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
import { TextArea } from '@/lib/components/shared/ui/forms/TextArea';
import { DateTimeField } from '@/lib/components/shared/ui/forms/DateTimeField';
import { Kbd } from '@/lib/components/shared/ui/Kbd';
import { Callout } from '@/lib/components/shared/ui/Callout';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { TextLink } from '@/lib/components/shared/ui/TextLink';
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

// Every action button is the same neutral control; the tone only tints the
// icon, so the grid reads as a set of choices and not a wall of colour.
const TONE_ICON: Record<'neutral' | 'warning' | 'danger' | 'accent' | 'success', string> = {
  neutral: 'text-[var(--lume-text-secondary)]',
  warning: 'text-warning-strong',
  danger:  'text-danger-strong',
  accent:  'text-[var(--lume-accent)]',
  success: 'text-success-strong',
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
        <Trophy className="size-12 text-success-strong" />
        <h2 className="text-xl font-medium tracking-tight text-[var(--lume-text)]">Sessione completata</h2>
        <p className="text-sm text-[var(--lume-text-secondary)]">
          Hai chiamato {queue.length} prospect{queue.length === 1 ? '' : ''}. Buon lavoro.
        </p>
        <Button asChild variant="primary" className="mt-2">
          <Link href="/platform/prospects">
            <PanelsTopLeft aria-hidden />
            Torna alla lista
          </Link>
        </Button>
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
        <Button asChild variant="ghost" size="sm" className="max-md:h-11">
          <Link href="/platform/prospects">
            <PanelsTopLeft aria-hidden />
            Lista
          </Link>
        </Button>
        <div className="flex-1 max-w-xs">
          <div className="text-xs text-[var(--lume-text-secondary)] tabular-nums text-center mb-1">
            {index + 1} di {queue.length}
            {queue.length > 0 && (
              <span className="mx-2">·</span>
            )}
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1 rounded-full bg-active overflow-hidden">
            <div
              className="h-full bg-[var(--lume-text)] transition-[width] duration-[var(--duration-base)] ease-[var(--ease-out)] motion-reduce:transition-none"
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
        <div className="surface-card mx-auto max-w-3xl p-5 md:p-8 space-y-6">
          {/* Header */}
          <PageHeader
            title={current.name}
            subtitle={current.cityProvince ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden />
                <span>{current.cityProvince}</span>
                {current.region && <span>· {current.region}</span>}
              </span>
            ) : undefined}
            actions={<ProspectStatusChip status={current.status} />}
          />

          {/* Callback indicator */}
          {current.callback_at && (
            <Callout tone={callbackOverdue ? 'danger' : 'warning'} icon={CalendarClock}>
              <span className="text-[var(--lume-text)]">
                Da richiamare il <strong className="tabular-nums font-medium">{new Date(current.callback_at).toLocaleString('it-IT')}</strong>
                {callbackOverdue && ' (scaduto)'}
              </span>
            </Callout>
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
            <TextLink
              href={current.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 min-h-11 md:min-h-0 text-sm"
            >
              <ExternalLink className="size-4" aria-hidden />
              Apri su Google Maps
            </TextLink>
          )}

          {current.notes && (
            <div className="rounded-lg bg-hover p-3 text-sm text-[var(--lume-text)]">
              <div className="flex items-center gap-1.5 text-xs text-[var(--lume-text-secondary)] mb-1">
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
                  // ds-ignore: call-outcome tile, a tall stacked choice (icon, label, shortcut key) on the control recipe; Button is a fixed-height single row
                  type="button"
                  key={a.label}
                  onClick={() => handleAction(a.status)}
                  disabled={working}
                  className={cn(
                    // A big choice tile on the field surface: edge, hover and
                    // focus come from the control recipe.
                    'control flex flex-col items-center gap-1.5 px-3 py-3 text-sm font-medium',
                    'active:scale-[0.98] motion-reduce:active:scale-100',
                  )}
                >
                  <a.icon className={cn('size-5', TONE_ICON[a.tone])} />
                  <span>{a.label}</span>
                  <Kbd className="tabular-nums">{a.key}</Kbd>
                </button>
              ))}
            </div>
          )}

          {/* Inline callback form */}
          {callbackOpen && (
            <div className="rounded-lg bg-hover p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium tracking-tight text-[var(--lume-text)] inline-flex items-center gap-2">
                  <CalendarClock className="size-4 text-warning-strong" />
                  Programma richiamo
                </h3>
                <Button variant="ghost" size="sm" iconOnly aria-label="Chiudi" onClick={() => setCallbackOpen(false)}>
                  <X />
                </Button>
              </div>
              <DateTimeField
                value={callbackAt}
                onChange={setCallbackAt}
                aria-label="Data e ora del richiamo"
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
            <div className="rounded-lg bg-hover p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium tracking-tight text-[var(--lume-text)] inline-flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-success-strong" />
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
              <TextArea
                id="interested-note"
                label="Nota rapida"
                value={interestedNote}
                onChange={(e) => setInterestedNote(e.target.value)}
                placeholder="Cosa hai concordato?"
                rows={2}
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setInterestedOpen(false)}>Annulla</Button>
                <Button variant="primary" size="sm" leadingIcon={Check} onClick={submitInterested} disabled={working}>
                  Conferma
                </Button>
              </div>
            </div>
          )}

          <div className="border-t border-line pt-4 text-xs text-[var(--lume-text-secondary)] hidden md:flex items-center gap-3 flex-wrap">
            <span>Tasti rapidi:</span>
            {ACTION_BUTTONS.map((a) => (
              <span key={a.key} className="inline-flex items-center gap-1">
                <Kbd className="tabular-nums">{a.key}</Kbd>
                <span>{a.label}</span>
              </span>
            ))}
            <span className="ml-auto inline-flex items-center gap-1">
              <Kbd>→</Kbd>
              salta
            </span>
          </div>

          <div className="text-xs text-[var(--lume-text-muted)]">
            Stato attuale: {STATUS_LABEL[current.status]}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactRow({ icon: Icon, label, value, whatsapp }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | null; whatsapp: string | null }) {
  return (
    <div className="surface-card rounded-lg px-3 py-2 flex items-center gap-2.5">
      <Icon className="size-4 text-[var(--lume-text-muted)] shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-[var(--lume-text-secondary)]">{label}</div>
        <div className="text-sm text-[var(--lume-text)] tabular-nums truncate">
          {value ?? <span className="text-[var(--lume-text-muted)]">—</span>}
        </div>
      </div>
      {whatsapp && (
        <TextLink
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center min-h-11 md:min-h-0 text-xs shrink-0"
        >
          WhatsApp
        </TextLink>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card rounded-lg px-3 py-2">
      <div className="text-xs text-[var(--lume-text-secondary)]">{label}</div>
      <div className="text-sm text-[var(--lume-text)] truncate">{value}</div>
    </div>
  );
}
