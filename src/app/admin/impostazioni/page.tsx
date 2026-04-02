'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Clock,
  Plus,
  Trash2,
  Save,
  Building2,
  User,
  CreditCard,
  ChevronRight,
  TriangleAlert,
} from 'lucide-react';
import { Switch } from '@/lib/components/shared/ui/Switch';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { DeleteWorkspaceModal } from '@/lib/components/admin/DeleteWorkspaceModal';

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = 'salone' | 'account' | 'abbonamento';

// ─── Schema ──────────────────────────────────────────────────────────────────

const shiftSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

const daySchema = z.object({
  day: z.number().min(0).max(6),
  isOpen: z.boolean(),
  shifts: z.array(shiftSchema),
});

const schema = z.object({ operating_hours: z.array(daySchema).length(7) });
type Schema = z.infer<typeof schema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

const DAY_NAMES: Record<number, string> = {
  0: 'Domenica',
  1: 'Lunedì',
  2: 'Martedì',
  3: 'Mercoledì',
  4: 'Giovedì',
  5: 'Venerdì',
  6: 'Sabato',
};

const DEFAULT_HOURS: Schema['operating_hours'] = DAYS_ORDER.map((day) => ({
  day,
  isOpen: day !== 0,
  shifts:
    day === 0
      ? []
      : day === 6
        ? [{ start: '09:00', end: '18:00' }]
        : [
            { start: '09:00', end: '13:00' },
            { start: '16:00', end: '20:00' },
          ],
}));

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'salone', label: 'Salone', icon: Building2 },
  { id: 'account', label: 'Account', icon: User },
  { id: 'abbonamento', label: 'Abbonamento', icon: CreditCard },
];

// ─── Panels ──────────────────────────────────────────────────────────────────

function SalonePanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { isDirty },
  } = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: { operating_hours: DEFAULT_HOURS },
  });

  const { fields, update } = useFieldArray({ control, name: 'operating_hours' });

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.operating_hours)) {
          const sorted = DAYS_ORDER.map(
            (d) =>
              data.operating_hours.find((h: { day: number }) => h.day === d) ??
              DEFAULT_HOURS.find((h) => h.day === d)!,
          );
          reset({ operating_hours: sorted });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (data: Schema) => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      messagePopup.getState().success('Impostazioni salvate con successo');
      reset(data);
    } catch {
      messagePopup.getState().error('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (index: number) => {
    const { id: _, ...rest } = fields[index] as typeof fields[number] & { id: string };
    const willOpen = !rest.isOpen;
    update(index, {
      ...rest,
      isOpen: willOpen,
      shifts: willOpen && rest.shifts.length === 0 ? [{ start: '09:00', end: '18:00' }] : rest.shifts,
    });
  };

  const addShift = (index: number) => {
    const { id: _, ...rest } = fields[index] as typeof fields[number] & { id: string };
    update(index, { ...rest, shifts: [...rest.shifts, { start: '09:00', end: '18:00' }] });
  };

  const removeShift = (dayIndex: number, shiftIndex: number) => {
    const { id: _, ...rest } = fields[dayIndex] as typeof fields[number] & { id: string };
    update(dayIndex, { ...rest, shifts: rest.shifts.filter((_, i) => i !== shiftIndex) });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-sm text-zinc-400">Caricamento impostazioni...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Orari di Apertura */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Orari di Apertura</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Configura i giorni di apertura e le fasce orarie del salone.
          </p>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className={`px-6 py-4 transition-colors ${
                field.isOpen ? '' : 'bg-zinc-50/50 dark:bg-zinc-950/30'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Switch + day name */}
                <div className="flex items-center gap-3 w-36 shrink-0 pt-1.5">
                  <Switch checked={field.isOpen} onChange={() => toggleDay(index)} />
                  <span
                    className={`text-sm font-medium transition-colors ${
                      field.isOpen
                        ? 'text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-400 dark:text-zinc-600'
                    }`}
                  >
                    {DAY_NAMES[field.day]}
                  </span>
                </div>

                {/* Shifts */}
                <div className="flex-1 min-w-0">
                  {!field.isOpen ? (
                    <span className="text-sm text-zinc-400 dark:text-zinc-600 italic">Chiuso</span>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {field.shifts.map((_, shiftIndex) => (
                        <div key={shiftIndex} className="flex items-center gap-2">
                          {/* lang="it" forces 24-hour clock in browsers that respect locale */}
                          <input
                            type="time"
                            lang="it"
                            {...register(`operating_hours.${index}.shifts.${shiftIndex}.start`)}
                            className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-shadow"
                          />
                          <span className="text-zinc-300 dark:text-zinc-600 text-sm select-none">—</span>
                          <input
                            type="time"
                            lang="it"
                            {...register(`operating_hours.${index}.shifts.${shiftIndex}.end`)}
                            className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-shadow"
                          />
                          {field.shifts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeShift(index, shiftIndex)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              aria-label="Rimuovi fascia oraria"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      ))}

                      {field.shifts.length < 3 && (
                        <button
                          type="button"
                          onClick={() => addShift(index)}
                          className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors w-fit mt-0.5"
                        >
                          <Plus className="size-3.5" />
                          Aggiungi fascia oraria
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || !isDirty}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="size-4" />
          {saving ? 'Salvataggio...' : 'Salva Impostazioni'}
        </button>
      </div>
    </form>
  );
}

function AccountPanel() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [salonName, setSalonName] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => { if (typeof data.name === 'string') setSalonName(data.name); })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <User className="size-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Profilo Account</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Gestisci email e password del tuo account.</p>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {/* Email row */}
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Email</p>
                <p className="text-xs text-zinc-500 mt-0.5">L'indirizzo email associato al tuo account.</p>
              </div>
              <button
                type="button"
                disabled
                className="flex items-center gap-1.5 text-sm text-indigo-500 hover:text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Modifica
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Password row */}
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Password</p>
                <p className="text-xs text-zinc-500 mt-0.5">Aggiorna la password del tuo account.</p>
              </div>
              <button
                type="button"
                disabled
                className="flex items-center gap-1.5 text-sm text-indigo-500 hover:text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Modifica
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-red-100 dark:border-red-900/40">
          <div className="flex items-center gap-2">
            <TriangleAlert className="size-4 text-red-500" />
            <h2 className="text-sm font-semibold text-red-700 dark:text-red-400">Zona Pericolosa</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Le azioni in questa sezione sono irreversibili e cancellano permanentemente i dati.
          </p>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Elimina Salone</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Cancella definitivamente il salone, tutti i suoi dati e disconnette l'account.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              disabled={salonName === null}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="size-4" />
              Elimina Salone
            </button>
          </div>
        </div>
      </div>

      {salonName !== null && (
        <DeleteWorkspaceModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          salonName={salonName}
        />
      )}
    </div>
  );
}

function AbbonamentoPanel() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <CreditCard className="size-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Gestione Abbonamento</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Visualizza e gestisci il tuo piano Lume.</p>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {/* Plan row */}
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Piano attuale</p>
                <p className="text-xs text-zinc-500 mt-0.5">Attiva o modifica il tuo abbonamento.</p>
              </div>
              <button
                type="button"
                disabled
                className="flex items-center gap-1.5 text-sm text-indigo-500 hover:text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Gestisci
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Billing row */}
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Fatturazione</p>
                <p className="text-xs text-zinc-500 mt-0.5">Storico pagamenti e metodo di pagamento.</p>
              </div>
              <button
                type="button"
                disabled
                className="flex items-center gap-1.5 text-sm text-indigo-500 hover:text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Visualizza
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ImpostazioniPage() {
  const [activeTab, setActiveTab] = useState<Tab>('salone');

  const TAB_TITLES: Record<Tab, { title: string; description: string }> = {
    salone: { title: 'Salone', description: 'Configura gli orari e le preferenze del salone.' },
    account: { title: 'Account', description: 'Gestisci le informazioni del tuo account.' },
    abbonamento: { title: 'Abbonamento', description: 'Piano, fatturazione e pagamenti.' },
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Impostazioni</h1>
        <p className="mt-1 text-sm text-zinc-500">Gestisci le preferenze del tuo salone e account.</p>
      </div>

      {/* 2-column layout */}
      <div className="flex gap-8 items-start">
        {/* ── Left nav ─────────────────────────────────────────────────────── */}
        <nav className="w-48 shrink-0">
          <ul className="flex flex-col gap-0.5">
            {TABS.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    <Icon className="size-4 shrink-0" />
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ── Right content ─────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Section header */}
          <div className="mb-6">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {TAB_TITLES[activeTab].title}
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">{TAB_TITLES[activeTab].description}</p>
          </div>

          {/* Panel */}
          {activeTab === 'salone' && <SalonePanel />}
          {activeTab === 'account' && <AccountPanel />}
          {activeTab === 'abbonamento' && <AbbonamentoPanel />}
        </div>
      </div>
    </div>
  );
}
