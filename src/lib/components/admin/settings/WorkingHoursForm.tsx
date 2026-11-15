'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Save } from 'lucide-react';
import { Switch } from '@/lib/components/shared/ui/Switch';
import { Button } from '@/lib/components/shared/ui/Button';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
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
      <section>
        <div className="mb-4">
          <h3 className="text-base font-medium tracking-tight text-[var(--lume-text)]">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-[var(--lume-text-secondary)] max-w-prose">{description}</p>
          )}
        </div>

        <div className="divide-y divide-line border-y border-line">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="py-3"
            >
              <div className="flex items-start gap-4">
                {/* Switch before the day name, not SwitchRow: the day column lines up with the shifts beside it. */}
                <div className="flex items-center gap-3 w-36 shrink-0 pt-1.5">
                  <Switch
                    id={`day-open-${field.id}`}
                    checked={field.isOpen}
                    onChange={() => toggleDay(index)}
                    disabled={readOnly}
                  />
                  <label
                    // ds-ignore: day name labelling the Switch before it; SwitchRow puts the switch last and CheckboxRow is for checkboxes
                    htmlFor={`day-open-${field.id}`}
                    className={`text-sm font-medium transition-colors ${readOnly ? '' : 'cursor-pointer'} ${
                      field.isOpen
                        ? 'text-[var(--lume-text)]'
                        : 'text-[var(--lume-text-muted)]'
                    }`}
                  >
                    {DAY_NAMES[field.day]}
                  </label>
                </div>

                <div className="flex-1 min-w-0">
                  {!field.isOpen ? (
                    <span className="inline-block pt-1.5 text-sm text-[var(--lume-text-muted)]">Chiuso</span>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {field.shifts.map((_, shiftIndex) => (
                        <div key={shiftIndex} className="flex items-center gap-2">
                          <FormInput
                            type="time"
                            lang="it"
                            size="sm"
                            aria-label={`${DAY_NAMES[field.day]}, inizio fascia ${shiftIndex + 1}`}
                            disabled={readOnly}
                            {...register(`operating_hours.${index}.shifts.${shiftIndex}.start`)}
                            fieldClassName="w-auto"
                            className="tabular-nums"
                          />
                          <span className="text-[var(--lume-text-muted)] text-sm select-none">—</span>
                          <FormInput
                            type="time"
                            lang="it"
                            size="sm"
                            aria-label={`${DAY_NAMES[field.day]}, fine fascia ${shiftIndex + 1}`}
                            disabled={readOnly}
                            {...register(`operating_hours.${index}.shifts.${shiftIndex}.end`)}
                            fieldClassName="w-auto"
                            className="tabular-nums"
                          />
                          {!readOnly && field.shifts.length > 1 && (
                            <Button
                              variant="ghost-destructive"
                              size="sm"
                              iconOnly
                              aria-label="Rimuovi fascia oraria"
                              onClick={() => removeShift(index, shiftIndex)}
                            >
                              <Trash2 />
                            </Button>
                          )}
                        </div>
                      ))}

                      {!readOnly && field.shifts.length < 3 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          leadingIcon={Plus}
                          onClick={() => addShift(index)}
                          className="w-fit mt-0.5"
                        >
                          Aggiungi fascia oraria
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {!readOnly && (
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            leadingIcon={Save}
            loading={saving}
            disabled={!isDirty}
          >
            {saving ? 'Salvataggio...' : 'Salva'}
          </Button>
        </div>
      )}
    </form>
  );
}
