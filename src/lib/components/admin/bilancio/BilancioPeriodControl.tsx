'use client';

import { BILANCIO_PRESETS, useBilancioStore, type BilancioPreset } from '@/lib/stores/bilancio';
import { usePastYears } from '@/lib/hooks/usePastYears';
import { CUSTOM_PERIOD, PeriodControl } from '@/lib/components/admin/period/PeriodControl';

const QUICK_PERIODS = BILANCIO_PRESETS.filter((p) => p.value !== CUSTOM_PERIOD);

/** The years before "Anno scorso" are listed one by one, as far back as the salon has fiches. */
export function BilancioPeriodControl() {
  const preset = useBilancioStore((s) => s.preset);
  const dal = useBilancioStore((s) => s.dal);
  const al = useBilancioStore((s) => s.al);
  const isLoading = useBilancioStore((s) => s.isLoading);
  const setPreset = useBilancioStore((s) => s.setPreset);
  const setRange = useBilancioStore((s) => s.setRange);
  const pastYears = usePastYears(new Date().getFullYear() - 2);

  return (
    <PeriodControl
      presets={QUICK_PERIODS}
      pastYears={pastYears}
      preset={preset}
      dal={dal}
      al={al}
      isLoading={isLoading}
      onPreset={(v) => setPreset(v as Exclude<BilancioPreset, 'personalizzato'>)}
      onApply={setRange}
    />
  );
}
