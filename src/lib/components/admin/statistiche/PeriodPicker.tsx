'use client';

import { endOfDay, format, parseISO } from 'date-fns';
import { useStatisticheStore, type QuickPreset, type YearPreset } from '@/lib/stores/statistiche';
import { usePastYears } from '@/lib/hooks/usePastYears';
import { CUSTOM_PERIOD, PeriodControl } from '@/lib/components/admin/period/PeriodControl';

const QUICK_PERIODS: { value: QuickPreset; label: string }[] = [
  { value: '7d',    label: 'Ultimi 7 giorni' },
  { value: 'month', label: 'Questo mese' },
  { value: '3m',    label: 'Ultimi 3 mesi' },
  { value: 'year',  label: "Quest'anno" },
];

const ymd = (d: Date) => format(d, 'yyyy-MM-dd');

export function PeriodPicker() {
  const preset    = useStatisticheStore((s) => s.preset);
  const dateFrom  = useStatisticheStore((s) => s.dateFrom);
  const dateTo    = useStatisticheStore((s) => s.dateTo);
  const isLoading = useStatisticheStore((s) => s.isLoading);
  const isRefreshing = useStatisticheStore((s) => s.isRefreshing);
  const setPreset = useStatisticheStore((s) => s.setPreset);
  const setRange  = useStatisticheStore((s) => s.setRange);
  // "Quest'anno" covers the current year; the ones before it are listed one by one.
  const pastYears = usePastYears(new Date().getFullYear() - 1);

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <PeriodControl
        layout="stack"
        presets={QUICK_PERIODS}
        pastYears={pastYears}
        preset={preset === 'custom' ? CUSTOM_PERIOD : preset}
        dal={ymd(dateFrom)}
        al={ymd(dateTo)}
        isLoading={isLoading || isRefreshing}
        onPreset={(v) => setPreset(v as QuickPreset | YearPreset)}
        onApply={(dal, al) => setRange(parseISO(dal), endOfDay(parseISO(al)))}
      />
    </div>
  );
}
