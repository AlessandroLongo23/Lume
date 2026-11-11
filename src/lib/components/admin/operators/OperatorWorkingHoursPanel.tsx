'use client';

import { useEffect, useMemo, useState } from 'react';
import { SwitchRow } from '@/lib/components/shared/ui/forms/SwitchRow';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useOperatorsStore } from '@/lib/stores/operators';
import { useSalonSettingsStore } from '@/lib/stores/salonSettings';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { canManageSalon } from '@/lib/auth/roles';
import {
  WorkingHoursForm,
  DEFAULT_WORKING_HOURS,
} from '@/lib/components/admin/settings/WorkingHoursForm';
import type { Operator } from '@/lib/types/Operator';
import type { OperatingHourDay } from '@/lib/stores/salonSettings';

interface Props {
  operator: Operator;
  /**
   * Force read-only regardless of role (e.g. archived operators). When omitted,
   * the panel is editable only for users that pass `canManageSalon` (owner / admin).
   */
  readOnly?: boolean;
}

/**
 * Schedule editor for a single operator. Offers two modes:
 * – Inherit salon hours (working_hours = null in the DB)
 * – Custom schedule (working_hours = OperatingHourDay[])
 */
export function OperatorWorkingHoursPanel({ operator, readOnly: readOnlyProp = false }: Props) {
  const updateOperator = useOperatorsStore((s) => s.updateOperator);
  const salonHours = useSalonSettingsStore((s) => s.settings?.operating_hours ?? null);
  const fetchSalonSettings = useSalonSettingsStore((s) => s.fetchSettings);
  const salonLoaded = useSalonSettingsStore((s) => s.isLoaded);
  const role = useSubscriptionStore((s) => s.role);

  // Only the owner (and platform admins) can edit. Operators always see read-only.
  const readOnly = readOnlyProp || !canManageSalon(role);

  // Make sure we have salon hours available (used as the "inherit" preview).
  useEffect(() => {
    if (!salonLoaded) fetchSalonSettings();
  }, [salonLoaded, fetchSalonSettings]);

  const [inherit, setInherit] = useState<boolean>(operator.working_hours === null);
  const [savingInherit, setSavingInherit] = useState(false);

  // Re-sync local inherit toggle whenever the operator row changes upstream.
  useEffect(() => {
    setInherit(operator.working_hours === null);
  }, [operator.id, operator.working_hours]);

  const initialCustom = useMemo<OperatingHourDay[]>(() => {
    if (operator.working_hours && operator.working_hours.length > 0) {
      return operator.working_hours;
    }
    if (salonHours && salonHours.length > 0) return salonHours;
    return DEFAULT_WORKING_HOURS;
  }, [operator.working_hours, salonHours]);

  const handleToggleInherit = async (next: boolean) => {
    if (readOnly) return;
    // Optimistic UI flip
    setInherit(next);
    setSavingInherit(true);
    try {
      if (next) {
        // Switch to "follow salon hours" → store NULL.
        await updateOperator(operator.id, {
          working_hours: null,
        });
        messagePopup.getState().success('Ora segue gli orari del salone');
      } else {
        // Switch to "custom" → seed with current salon hours so the form has
        // a reasonable starting point. The operator can then save a custom one.
        const seed = salonHours && salonHours.length > 0 ? salonHours : DEFAULT_WORKING_HOURS;
        await updateOperator(operator.id, {
          working_hours: seed,
        });
        messagePopup.getState().success('Orari personalizzati attivi');
      }
    } catch {
      // Rollback toggle on failure
      setInherit(!next);
      messagePopup.getState().error('Errore durante il salvataggio');
    } finally {
      setSavingInherit(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <SwitchRow
        className="surface-card px-6 py-4"
        label="Segui gli orari del salone"
        description={
          <>
            Quando attivo, l&apos;operatore lavora negli stessi orari di apertura del salone.
            Disattiva per impostare un orario personalizzato.
          </>
        }
        checked={inherit}
        onChange={() => handleToggleInherit(!inherit)}
        disabled={readOnly || savingInherit}
      />

      {!inherit ? (
        <WorkingHoursForm
          title="Orari di lavoro"
          description="Configura i giorni e le fasce orarie in cui l'operatore lavora."
          readOnly={readOnly}
          initialValue={initialCustom}
          onSubmit={async (working_hours) => {
            try {
              await updateOperator(operator.id, {
                working_hours,
              });
              messagePopup.getState().success('Orari salvati');
            } catch {
              messagePopup.getState().error('Errore durante il salvataggio');
              throw new Error('save-failed');
            }
          }}
        />
      ) : (
        readOnly && salonHours && salonHours.length > 0 && (
          // Read-only viewers (operators) inheriting the salon schedule still
          // need to see what those hours are — render a locked preview.
          <WorkingHoursForm
            title="Orari del salone"
            description="Stai seguendo gli orari di apertura del salone."
            readOnly
            initialValue={salonHours}
            onSubmit={async () => {}}
          />
        )
      )}
    </div>
  );
}
