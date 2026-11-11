'use client';

import { Scissors } from 'lucide-react';
import { useServicesStore } from '@/lib/stores/services';
import { MultiSelectList } from '@/lib/components/shared/ui/forms/MultiSelectList';
import { formatCurrency } from '@/lib/utils/format';

interface ServicesMultiSelectProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

/** The salon's active services as a searchable multi-select list. */
export function ServicesMultiSelect({ selectedIds, onChange }: ServicesMultiSelectProps) {
  const services = useServicesStore((s) => s.services).filter((s) => !s.isArchived);
  return (
    <MultiSelectList
      items={services}
      getId={(s) => s.id}
      getLabel={(s) => s.name}
      selectedIds={selectedIds}
      onChange={onChange}
      ariaLabel="Servizi"
      searchPlaceholder="Cerca servizi…"
      emptyText="Nessun servizio"
      icon={Scissors}
      renderTrailing={(s) => <span className="tabular-nums text-xs text-[var(--lume-text-muted)]">{formatCurrency(s.price)}</span>}
    />
  );
}
