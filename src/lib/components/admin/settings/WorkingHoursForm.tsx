'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Clock, Plus, Trash2, Save } from 'lucide-react';
import { Switch } from '@/lib/components/shared/ui/Switch';
import type { OperatingHourDay } from '@/lib/stores/salonSettings';

const shiftSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

const daySchema = z.object({
  day: z.number().min(0).max(6),
  isOpen: z.boolean(),
  shifts: z.array(shiftSchema),
});

const schema = z.object({
  operating_hours: z.array(daySchema).length(7),
});
type Schema = z.infer<typeof schema>;

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

export const DEFAULT_WORKING_HOURS: OperatingHourDay[] = DAYS_ORDER.map((day) => ({
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

function sortToWeekOrder(value: OperatingHourDay[] | null | undefined): OperatingHourDay[] {
  if (!Array.isArray(value) || value.length !== 7) return DEFAULT_WORKING_HOURS;
  return DAYS_ORDER.map(
    (d) => value.find((h) => h.day === d) ?? DEFAULT_WORKING_HOURS.find((h) => h.day === d)!,
  );
}

interface WorkingHoursFormProps {
  /** Initial schedule. `null` falls back to {@link DEFAULT_WORKING_HOURS}. */
  initialValue: OperatingHourDay[] | null | undefined;
  /** Heading shown at the top of the card. */
  title: string;
  /** Optional caption under the title. */
  description?: string;
  /** Read-only mode disables every input and hides the save button. */
  readOnly?: boolean;
  /** Called when the user clicks Save with a valid schedule. */
  onSubmit: (value: OperatingHourDay[]) => Promise<void>;
}

/**
 * Reusable weekly-schedule editor (7 days × multiple shifts) used for both
 * salon-wide opening hours and per-operator working hours.
 */
export function WorkingHoursForm({
  initialValue,
  title,
  description,
  readOnly = false,
  onSubmit,
}: WorkingHoursFormProps) {
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { isDirty },
  } = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: { operating_hours: sortToWeekOrder(initialValue) },
  });

  const { fields, update } = useFieldArray({ control, name: 'operating_hours' });

  useEffect(() => {
    reset({ operating_hours: sortToWeekOrder(initialValue) });
  }, [initialValue, reset]);

  const submit = async (data: Schema) => {
    setSaving(true);
    try {
      await onSubmit(data.operating_hours);
      reset(data);
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (index: number) => {
    if (readOnly) return;
    const { id: _id, ...rest } = fields[index] as typeof fields[number] & { id: string };
    const willOpen = !rest.isOpen;
    update(index, {
      ...rest,
      isOpen: willOpen,
      shifts: willOpen && rest.shifts.length === 0 ? [{ start: '09:00', end: '18:00' }] : rest.shifts,
    });
  };

  const addShift = (index: number) => {
    if (readOnly) return;
    const { id: _id, ...rest } = fields[index] as typeof fields[number] & { id: string };
    update(index, { ...rest, shifts: [...rest.shifts, { start: '09:00', end: '18:00' }] });
  };

  const removeShift = (dayIndex: number, shiftIndex: number) => {
    if (readOnly) return;
    const { id: _id, ...rest } = fields[dayIndex] as typeof fields[number] & { id: string };
    update(dayIndex, { ...rest, shifts: rest.shifts.filter((_, i) => i !== shiftIndex) });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-6">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
          </div>
          {description && (
            <p className="mt-1 text-xs text-zinc-500">{description}</p>
          )}
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
                <div className="flex items-center gap-3 w-36 shrink-0 pt-1.5">
                  <Switch
                    checked={field.isOpen}
                    onChange={() => toggleDay(index)}
                    disabled={readOnly}
                  />
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

                <div className="flex-1 min-w-0">
                  {!field.isOpen ? (
                    <span className="text-sm text-zinc-400 dark:text-zinc-600 italic">Chiuso</span>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {field.shifts.map((_, shiftIndex) => (
                        <div key={shiftIndex} className="flex items-center gap-2">
                          <input
                            type="time"
                            lang="it"
                            disabled={readOnly}
                            {...register(`operating_hours.${index}.shifts.${shiftIndex}.start`)}
                            className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                          <span className="text-zinc-300 dark:text-zinc-600 text-sm select-none">—</span>
                          <input
                            type="time"
                            lang="it"
                            disabled={readOnly}
                            {...register(`operating_hours.${index}.shifts.${shiftIndex}.end`)}
                            className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                          {!readOnly && field.shifts.length > 1 && (
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

                      {!readOnly && field.shifts.length < 3 && (
                        <button
                          type="button"
                          onClick={() => addShift(index)}
                          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-active dark:hover:text-primary/70 transition-colors w-fit mt-0.5"
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

      {!readOnly && (
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || !isDirty}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-primary-hover hover:bg-primary-active active:bg-primary-active text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="size-4" />
            {saving ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      )}
    </form>
  );
}
