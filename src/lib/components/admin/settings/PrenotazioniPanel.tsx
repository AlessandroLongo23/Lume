'use client';

import { useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Globe, Link as LinkIcon, Loader2, MessageSquare, ShieldCheck, Sliders, ToggleRight } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { Switch } from '@/lib/components/shared/ui/Switch';
import { Select } from '@/lib/components/shared/ui/forms/Select';
import { NumberInput } from '@/lib/components/shared/ui/forms/NumberInput';
import { useSalonSettingsStore } from '@/lib/stores/salonSettings';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { PUBLIC_SITE_HOST } from '@/lib/const/site';
import type { BookingAccessMode, BookingApprovalScope, BookingConfig } from '@/lib/types/Salon';

const ACCESS_OPTIONS: { value: BookingAccessMode; label: string; hint: string }[] = [
  { value: 'public',        label: 'Aperta a tutti',                hint: 'Chiunque ha il link può prenotare.' },
  { value: 'clients_only',  label: 'Solo clienti esistenti',        hint: 'Verifica l\'esistenza del cliente dal telefono o email.' },
  { value: 'selected',      label: 'Solo clienti selezionati',      hint: 'Solo clienti con il flag "può prenotare online".' },
];

const SCOPE_OPTIONS: { value: BookingApprovalScope; label: string }[] = [
  { value: 'chosen_operator', label: 'Solo l\'operatore scelto + titolari' },
  { value: 'any_staff',       label: 'Tutto lo staff' },
];

interface FormState {
  slug: string;
  booking_enabled: boolean;
  config: Required<Pick<BookingConfig,
    | 'access_mode'
    | 'allow_operator_choice'
    | 'require_approval'
    | 'approval_scope'
    | 'min_lead_minutes'
    | 'max_lead_days'
    | 'cancel_window_hours'
    | 'buffer_between_minutes'
    | 'guest_email_required'
  >> & { public_message: string };
}

function fromSettings(s: ReturnType<typeof useSalonSettingsStore.getState>['settings']): FormState {
  const c = s?.booking_config ?? {};
  return {
    slug: s?.slug ?? '',
    booking_enabled: s?.booking_enabled ?? false,
    config: {
      access_mode:            c.access_mode            ?? 'public',
      allow_operator_choice:  c.allow_operator_choice  ?? true,
      require_approval:       c.require_approval       ?? false,
      approval_scope:         c.approval_scope         ?? 'chosen_operator',
      min_lead_minutes:       c.min_lead_minutes       ?? 120,
      max_lead_days:          c.max_lead_days          ?? 60,
      cancel_window_hours:    c.cancel_window_hours    ?? 24,
      buffer_between_minutes: c.buffer_between_minutes ?? 0,
      guest_email_required:   c.guest_email_required   ?? false,
      public_message:         c.public_message         ?? '',
    },
  };
}

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export interface PrenotazioniPanelHandle {
  save: () => Promise<void>;
  discard: () => void;
  /** Last-known validation state; the page bar reads this to disable Save. */
  hasInvalidSlug: () => boolean;
}

interface Props {
  ref?: React.Ref<PrenotazioniPanelHandle>;
  onDirtyChange?: (dirty: boolean) => void;
  onValidityChange?: (valid: boolean) => void;
}

export function PrenotazioniPanel({ ref, onDirtyChange, onValidityChange }: Props) {
  const isLoading = useSalonSettingsStore((s) => s.isLoading);
  const isLoaded = useSalonSettingsStore((s) => s.isLoaded);
  const settings = useSalonSettingsStore((s) => s.settings);
  const updateSettings = useSalonSettingsStore((s) => s.updateSettings);

  const [form, setForm] = useState<FormState>(() => fromSettings(settings));
  const [slugError, setSlugError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isLoaded) setForm(fromSettings(settings));
  }, [isLoaded, settings]);

  const setSlug = (raw: string) => {
    const sanitised = raw.toLowerCase().replace(/\s+/g, '');
    setForm((p) => ({ ...p, slug: sanitised }));
    if (!sanitised) {
      setSlugError(null);
    } else if (!SLUG_RE.test(sanitised)) {
      setSlugError('Lettere minuscole, numeri e trattini (non agli estremi).');
    } else {
      setSlugError(null);
    }
  };

  const setConfig = <K extends keyof FormState['config']>(key: K, value: FormState['config'][K]) =>
    setForm((p) => ({ ...p, config: { ...p.config, [key]: value } }));

  const slugIsValid = !!form.slug && SLUG_RE.test(form.slug);

  const isDirty = useMemo(() => {
    if (!settings) return false;
    const baseline = fromSettings(settings);
    return JSON.stringify(baseline) !== JSON.stringify(form);
  }, [settings, form]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const hasInvalidSlug = !!slugError || (form.booking_enabled && !slugIsValid);
  useEffect(() => {
    onValidityChange?.(!hasInvalidSlug);
  }, [hasInvalidSlug, onValidityChange]);

  const save = useCallback(async () => {
    if (form.slug && !SLUG_RE.test(form.slug)) {
      setSlugError('Lettere minuscole, numeri e trattini (non agli estremi).');
      throw new Error('slug-invalid');
    }
    if (form.booking_enabled && !slugIsValid) {
      messagePopup.getState().error('Imposta uno slug valido prima di attivare le prenotazioni.');
      throw new Error('slug-required');
    }
    try {
      await updateSettings({
        slug: form.slug ? form.slug : null,
        booking_enabled: form.booking_enabled,
        booking_config: {
          ...form.config,
          public_message: form.config.public_message.trim() || null,
        },
      });
    } catch (err) {
      messagePopup
        .getState()
        .error(err instanceof Error && err.message ? err.message : 'Errore durante il salvataggio');
      throw err;
    }
  }, [form, slugIsValid, updateSettings]);

  const discard = useCallback(() => {
    setForm(fromSettings(settings));
    setSlugError(null);
  }, [settings]);

  useImperativeHandle(
    ref,
    () => ({ save, discard, hasInvalidSlug: () => hasInvalidSlug }),
    [save, discard, hasInvalidSlug],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="size-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  const c = form.config;

  return (
    <div className="flex flex-col gap-6">
      <SettingsCard
        icon={ToggleRight}
        title="Stato prenotazioni online"
        description="Quando attivo, il tuo salone è raggiungibile dal link pubblico e i clienti possono prenotare in autonomia."
        rightSlot={
          <Switch
            checked={form.booking_enabled}
            onChange={() => setForm((p) => ({ ...p, booking_enabled: !p.booking_enabled }))}
            disabled={!slugIsValid && !form.booking_enabled}
          />
        }
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="booking-slug" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            URL pubblica <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-hidden focus-within:ring-2 focus-within:ring-primary/40 transition-shadow">
            <span className="flex items-center gap-1.5 pl-3 pr-2 py-2 text-xs text-zinc-500 border-r border-zinc-200 dark:border-zinc-700 select-none">
              <LinkIcon className="size-3.5" />
              {PUBLIC_SITE_HOST}/
            </span>
            <input
              id="booking-slug"
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              maxLength={63}
              placeholder="il-mio-salone"
              value={form.slug}
              onChange={(e) => setSlug(e.target.value)}
              className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
          {slugError ? (
            <p className="text-xs text-red-500">{slugError}</p>
          ) : (
            <p className="text-xs text-zinc-500">Comparirà ai tuoi clienti come {PUBLIC_SITE_HOST}/{form.slug || 'il-mio-salone'}.</p>
          )}
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Globe}
        title="Chi può prenotare"
        description="Decide se il link è aperto al pubblico o riservato ai tuoi clienti."
      >
        <div className="flex flex-col gap-4">
          <Select
            value={c.access_mode}
            onChange={(v) => setConfig('access_mode', (v ?? 'public') as BookingAccessMode)}
            options={ACCESS_OPTIONS}
            labelKey="label"
            valueKey="value"
            searchable={false}
          />
          <p className="text-xs text-zinc-500">
            {ACCESS_OPTIONS.find((o) => o.value === c.access_mode)?.hint}
          </p>

          {c.access_mode === 'public' && (
            <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm text-zinc-700 dark:text-zinc-200">Richiedi anche l&apos;email agli ospiti</p>
                <p className="text-xs text-zinc-500">Utile per inviare conferme e promemoria oltre al WhatsApp.</p>
              </div>
              <Switch
                checked={c.guest_email_required}
                onChange={() => setConfig('guest_email_required', !c.guest_email_required)}
              />
            </div>
          )}
        </div>
      </SettingsCard>

      <SettingsCard
        icon={ShieldCheck}
        title="Approvazione"
        description="Decidi se le prenotazioni sono confermate automaticamente o richiedono il tuo via libera."
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-zinc-700 dark:text-zinc-200">
              Richiedi approvazione manuale
            </span>
            <Switch
              checked={c.require_approval}
              onChange={() => setConfig('require_approval', !c.require_approval)}
            />
          </div>

          {c.require_approval && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Chi riceve le richieste</label>
              <Select
                value={c.approval_scope}
                onChange={(v) => setConfig('approval_scope', (v ?? 'chosen_operator') as BookingApprovalScope)}
                options={SCOPE_OPTIONS}
                labelKey="label"
                valueKey="value"
                searchable={false}
              />
            </div>
          )}
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Sliders}
        title="Regole della prenotazione"
        description="Limiti di tempo, anticipo minimo e finestra di disdetta."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Permetti al cliente di scegliere l&apos;operatore</label>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2">
              <span className="text-xs text-zinc-500">
                Se disattivato, assegni tu l&apos;operatore al momento dell&apos;approvazione (o lo fa l&apos;algoritmo se auto-confermato).
              </span>
              <Switch
                checked={c.allow_operator_choice}
                onChange={() => setConfig('allow_operator_choice', !c.allow_operator_choice)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Anticipo minimo</label>
            <NumberInput
              value={c.min_lead_minutes}
              onChange={(v) => setConfig('min_lead_minutes', v ?? 0)}
              min={0}
              max={43200}
              step={15}
              suffix="min"
              size="md"
            />
            <p className="text-xs text-zinc-500">Minuti tra ora e il primo slot disponibile.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Anticipo massimo</label>
            <NumberInput
              value={c.max_lead_days}
              onChange={(v) => setConfig('max_lead_days', v ?? 1)}
              min={1}
              max={365}
              step={1}
              suffix="giorni"
              size="md"
            />
            <p className="text-xs text-zinc-500">Quanto in avanti il cliente può guardare.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Finestra di disdetta</label>
            <NumberInput
              value={c.cancel_window_hours}
              onChange={(v) => setConfig('cancel_window_hours', v ?? 0)}
              min={0}
              max={720}
              step={1}
              suffix="ore"
              size="md"
            />
            <p className="text-xs text-zinc-500">Entro quante ore prima dell&apos;appuntamento il cliente può disdire.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Buffer fra appuntamenti</label>
            <NumberInput
              value={c.buffer_between_minutes}
              onChange={(v) => setConfig('buffer_between_minutes', v ?? 0)}
              min={0}
              max={240}
              step={5}
              suffix="min"
              size="md"
            />
            <p className="text-xs text-zinc-500">Pausa minima fra una prenotazione e la successiva.</p>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={MessageSquare}
        title="Messaggio pubblico"
        description="Comunica una nota in cima alla pagina pubblica (orari speciali, festività, ecc.). Lascia vuoto per nasconderla."
      >
        <textarea
          rows={3}
          maxLength={500}
          value={c.public_message}
          placeholder="Es. Domenica 18 maggio chiuso per ferie."
          onChange={(e) => setConfig('public_message', e.target.value)}
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow resize-y"
        />
        <p className="mt-1 text-xs text-zinc-500">{c.public_message.length}/500</p>
      </SettingsCard>
    </div>
  );
}
