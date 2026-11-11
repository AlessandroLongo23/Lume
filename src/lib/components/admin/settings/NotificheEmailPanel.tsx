'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, Eye } from 'lucide-react';
import { SwitchRow } from '@/lib/components/shared/ui/forms/SwitchRow';
import { Button } from '@/lib/components/shared/ui/Button';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { SettingsCard } from './SettingsCard';
import { BookingEmailPreviewModal } from './BookingEmailPreviewModal';
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
  const [showPreview, setShowPreview] = useState(false);

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
        <Loader2 className="size-5 animate-spin text-[var(--lume-text-muted)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SettingsCard
        title="Email prenotazioni online"
        description="Le email automatiche inviate ai clienti quando prenotano, vengono approvati o rifiutati. Usano i colori e il logo del tuo salone."
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-[var(--lume-text-secondary)]">
            Anteprima delle 6 varianti (conferma, in attesa, approvata, rifiutata, annullata, promemoria).
          </p>
          <Button
            variant="secondary"
            leadingIcon={Eye}
            onClick={() => setShowPreview(true)}
            disabled={!settings}
          >
            Visualizza anteprima
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Mittente"
        description="Nome e indirizzo email mostrati come mittente delle email transazionali."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            id="sender-name"
            label="Nome mittente"
            maxLength={80}
            value={form.sender_name}
            onChange={(e) => setField('sender_name', e.target.value)}
            placeholder="Salone Mario"
          />
          <FormInput
            id="reply-to"
            label="Email di risposta"
            type="email"
            maxLength={200}
            value={form.reply_to}
            onChange={(e) => setField('reply_to', e.target.value)}
            placeholder="info@ilmiosalone.it"
          />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Promemoria appuntamento"
        description="Inviato al cliente prima dell'appuntamento."
      >
        <SwitchRow
          label="Attiva promemoria"
          description="Configura sotto le ore di anticipo."
          checked={form.appointment_reminder_enabled}
          onChange={() => setField('appointment_reminder_enabled', !form.appointment_reminder_enabled)}
        />
        <div className={`mt-4 transition-opacity ${form.appointment_reminder_enabled ? '' : 'opacity-50 pointer-events-none'}`}>
          <FormInput
            id="reminder-hours"
            label="Ore di anticipo"
            suffix="ore prima"
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
            fieldClassName="w-44"
            className="tabular-nums"
          />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Auguri di compleanno"
        description="Email automatica al cliente nel giorno del compleanno."
      >
        <SwitchRow
          label="Attiva auguri"
          description="Inviata al mattino del giorno del compleanno se presente la data sulla scheda cliente."
          checked={form.birthday_wishes_enabled}
          onChange={() => setField('birthday_wishes_enabled', !form.birthday_wishes_enabled)}
        />
      </SettingsCard>

      <SettingsCard
        title="Fiche per email"
        description="Invia automaticamente la fiche al cliente al completamento del servizio."
      >
        <SwitchRow
          label="Invia fiche"
          description="Solo se il cliente ha un indirizzo email registrato."
          checked={form.fiche_by_email_enabled}
          onChange={() => setField('fiche_by_email_enabled', !form.fiche_by_email_enabled)}
        />
      </SettingsCard>

      {error && <p className="px-1 text-xs text-danger-strong">{error}</p>}

      <div className="flex justify-end">
        <Button variant="primary" leadingIcon={Save} loading={saving} onClick={onSave}>
          {saving ? 'Salvataggio…' : 'Salva'}
        </Button>
      </div>

      <BookingEmailPreviewModal isOpen={showPreview} onClose={() => setShowPreview(false)} />
    </div>
  );
}
