'use client';

import { useEffect, useState } from 'react';
import { Mail, Save, Loader2, Bell, Cake, Receipt } from 'lucide-react';
import { Switch } from '@/lib/components/shared/ui/Switch';
import { SettingsCard } from './SettingsCard';
import { useSalonSettingsStore } from '@/lib/stores/salonSettings';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import type { SalonEmailNotifications } from '@/lib/types/Salon';

interface FormState {
  sender_name: string;
  reply_to: string;
  appointment_reminder_enabled: boolean;
  appointment_reminder_hours: number;
  birthday_wishes_enabled: boolean;
  fiche_by_email_enabled: boolean;
}

const DEFAULT_REMINDER_HOURS = 24;

function fromSettings(en: SalonEmailNotifications | undefined): FormState {
  return {
    sender_name: en?.sender_name ?? '',
    reply_to: en?.reply_to ?? '',
    appointment_reminder_enabled: en?.appointment_reminder?.enabled ?? false,
    appointment_reminder_hours: en?.appointment_reminder?.hours_before ?? DEFAULT_REMINDER_HOURS,
    birthday_wishes_enabled: en?.birthday_wishes?.enabled ?? false,
    fiche_by_email_enabled: en?.fiche_by_email?.enabled ?? false,
  };
}

export function NotificheEmailPanel() {
  const isLoading = useSalonSettingsStore((s) => s.isLoading);
  const isLoaded = useSalonSettingsStore((s) => s.isLoaded);
  const settings = useSalonSettingsStore((s) => s.settings);
  const updateSettings = useSalonSettingsStore((s) => s.updateSettings);

  const [form, setForm] = useState<FormState>(() => fromSettings(settings?.email_notifications));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded) setForm(fromSettings(settings?.email_notifications));
  }, [isLoaded, settings?.email_notifications]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const onSave = async () => {
    const replyTo = form.reply_to.trim();
    if (replyTo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)) {
      setError("Email di risposta non valida");
      return;
    }
    if (
      !Number.isInteger(form.appointment_reminder_hours) ||
      form.appointment_reminder_hours < 1 ||
      form.appointment_reminder_hours > 168
    ) {
      setError('Ore promemoria non valide (1–168)');
      return;
    }

    setSaving(true);
    try {
      const payload: SalonEmailNotifications = {
        sender_name: form.sender_name.trim() || undefined,
        reply_to: replyTo || undefined,
        appointment_reminder: {
          enabled: form.appointment_reminder_enabled,
          hours_before: form.appointment_reminder_hours,
        },
        birthday_wishes: { enabled: form.birthday_wishes_enabled },
        fiche_by_email: { enabled: form.fiche_by_email_enabled },
      };
      await updateSettings({ email_notifications: payload });
      messagePopup.getState().success('Notifiche email salvate');
    } catch {
      messagePopup.getState().error('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="size-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SettingsCard
        icon={Mail}
        title="Mittente"
        description="Nome e indirizzo email mostrati come mittente delle email transazionali."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sender-name" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Nome mittente
            </label>
            <input
              id="sender-name"
              type="text"
              maxLength={80}
              value={form.sender_name}
              onChange={(e) => setField('sender_name', e.target.value)}
              placeholder="Salone Mario"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>
          <div>
            <label htmlFor="reply-to" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Email di risposta
            </label>
            <input
              id="reply-to"
              type="email"
              maxLength={200}
              value={form.reply_to}
              onChange={(e) => setField('reply_to', e.target.value)}
              placeholder="info@ilmiosalone.it"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Bell}
        title="Promemoria appuntamento"
        description="Inviato al cliente prima dell'appuntamento."
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Attiva promemoria</p>
            <p className="text-xs text-zinc-500 mt-0.5">Configura sotto le ore di anticipo.</p>
          </div>
          <Switch
            checked={form.appointment_reminder_enabled}
            onChange={() => setField('appointment_reminder_enabled', !form.appointment_reminder_enabled)}
          />
        </div>
        <div className={`mt-4 transition-opacity ${form.appointment_reminder_enabled ? '' : 'opacity-50 pointer-events-none'}`}>
          <label htmlFor="reminder-hours" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Ore di anticipo
          </label>
          <div className="flex items-center gap-3">
            <input
              id="reminder-hours"
              type="number"
              min={1}
              max={168}
              value={form.appointment_reminder_hours}
              onChange={(e) =>
                setField(
                  'appointment_reminder_hours',
                  Math.max(1, Math.min(168, Number(e.target.value) || 1)),
                )
              }
              disabled={!form.appointment_reminder_enabled}
              className="w-24 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <span className="text-sm text-zinc-500">ore prima</span>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Cake}
        title="Auguri di compleanno"
        description="Email automatica al cliente nel giorno del compleanno."
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Attiva auguri</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Inviata al mattino del giorno del compleanno se presente la data sulla scheda cliente.
            </p>
          </div>
          <Switch
            checked={form.birthday_wishes_enabled}
            onChange={() => setField('birthday_wishes_enabled', !form.birthday_wishes_enabled)}
          />
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Receipt}
        title="Fiche per email"
        description="Invia automaticamente la fiche al cliente al completamento del servizio."
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Invia fiche</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Solo se il cliente ha un indirizzo email registrato.
            </p>
          </div>
          <Switch
            checked={form.fiche_by_email_enabled}
            onChange={() => setField('fiche_by_email_enabled', !form.fiche_by_email_enabled)}
          />
        </div>
      </SettingsCard>

      {error && <p className="px-1 text-xs text-red-500">{error}</p>}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-hover hover:bg-primary-active text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="size-4" />
          {saving ? 'Salvataggio…' : 'Salva'}
        </button>
      </div>
    </div>
  );
}
