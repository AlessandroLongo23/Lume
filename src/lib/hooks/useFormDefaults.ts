'use client';

import { useMemo } from 'react';
import { useSalonSettingsStore } from '@/lib/stores/salonSettings';
import { FACTORY_FORM_DEFAULTS } from '@/lib/const/factory-defaults';
import type { SalonFormDefaults } from '@/lib/types/Salon';

/**
 * Returns the resolved form defaults for the active salon: salon overrides
 * merged onto the factory defaults. Used by entity-creation modals
 * (GiftCardModal, GiftCouponModal, AddAbbonamentoModal, AddServiceModal,
 * AddClientModal) to seed initial field values that the operator can still
 * override per-transaction.
 */
export function useFormDefaults(): Required<SalonFormDefaults> {
  const overrides = useSalonSettingsStore((s) => s.settings?.form_defaults);
  return useMemo(
    () => ({ ...FACTORY_FORM_DEFAULTS, ...(overrides ?? {}) }),
    [overrides],
  );
}

/**
 * Helper for date-bound defaults: today + N months as an ISO yyyy-mm-dd
 * string in the local timezone.
 */
export function todayPlusMonthsISO(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  // Avoid timezone drift to UTC by using local components.
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
