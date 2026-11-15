'use client';

import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { SwitchRow } from '@/lib/components/shared/ui/forms/SwitchRow';
import { Button } from '@/lib/components/shared/ui/Button';
import { StatusDot } from '@/lib/components/shared/ui/StatusDot';
import { useServicesStore } from '@/lib/stores/services';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { useOperatorsStore } from '@/lib/stores/operators';
import { useOperatorServicesStore } from '@/lib/stores/operatorServices';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import type { Service } from '@/lib/types/Service';
import { formatCurrency } from '@/lib/utils/format';
import { DURATION } from '@/lib/const/motion';
import type { Operator } from '@/lib/types/Operator';

const UNCATEGORIZED_KEY = '__uncategorized__';

type Group = {
  id: string;
  name: string;
  color?: string;
  services: Service[];
};

export interface BookableServicesPanelHandle {
  save: () => Promise<void>;
  discard: () => void;
}

interface Props {
  ref?: React.Ref<BookableServicesPanelHandle>;
  onDirtyChange?: (dirty: boolean) => void;
}

function OperatorAvatar({ operator }: { operator: Operator }) {
  if (operator.avatar_url) {
    return (
      <span className="block size-7 rounded-full overflow-hidden bg-active shrink-0">
        <Image
          src={operator.avatar_url}
          alt=""
          width={28}
          height={28}
          className="size-full object-cover"
          draggable={false}
        />
      </span>
    );
  }
  return (
    <span className="size-7 rounded-full bg-active flex items-center justify-center text-xs font-medium text-[var(--lume-text-secondary)] select-none shrink-0">
      {(operator.firstName?.[0] ?? '·').toUpperCase()}
    </span>
  );
}

function sortedKey(ids: string[]): string {
  return [...ids].sort().join(',');
}

export function BookableServicesPanel({ ref, onDirtyChange }: Props) {
  const services = useServicesStore((s) => s.services);
  const isLoading = useServicesStore((s) => s.isLoading);
  const bulkUpdateServices = useServicesStore((s) => s.bulkUpdateServices);
  const fetchServices = useServicesStore((s) => s.fetchServices);
  const categories = useServiceCategoriesStore((s) => s.service_categories);
  const fetchCategories = useServiceCategoriesStore((s) => s.fetchServiceCategories);
  const operators = useOperatorsStore((s) => s.operators);
  const fetchOperators = useOperatorsStore((s) => s.fetchOperators);
  const opServiceItems = useOperatorServicesStore((s) => s.items);
  const opServicesLoaded = useOperatorServicesStore((s) => s.isLoaded);
  const fetchOpServices = useOperatorServicesStore((s) => s.fetchItems);
  const replaceForService = useOperatorServicesStore((s) => s.replaceForService);

  const reduceMotion = useReducedMotion();
  const [openServiceId, setOpenServiceId] = useState<string | null>(null);

  useEffect(() => {
    if (services.length === 0) fetchServices();
    if (categories.length === 0) fetchCategories();
    if (operators.length === 0) fetchOperators();
    if (!opServicesLoaded) fetchOpServices();
  }, [
    services.length,
    categories.length,
    operators.length,
    opServicesLoaded,
    fetchServices,
    fetchCategories,
    fetchOperators,
    fetchOpServices,
  ]);

  const visibleServices = useMemo(
    () => services.filter((s) => !s.isArchived),
    [services],
  );

  const activeOperators = useMemo(
    () => operators.filter((o) => !o.isArchived).sort((a, b) => a.getFullName().localeCompare(b.getFullName(), 'it')),
    [operators],
  );

  // ── Baselines pulled from the stores. We snapshot into draft state on
  //    first load and after each save; user toggles only mutate draft.
  const baselineBookable = useMemo(() => {
    const m: Record<string, boolean> = {};
    for (const s of visibleServices) m[s.id] = s.bookable_online;
    return m;
  }, [visibleServices]);

  const baselineOperators = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const it of opServiceItems) {
      if (!m[it.service_id]) m[it.service_id] = [];
      m[it.service_id].push(it.operator_id);
    }
    return m;
  }, [opServiceItems]);

  // Draft state: a single render-pass copy of the baseline that the user
  // edits in-place. Reset on initial load and after save/discard.
  const [draftBookable, setDraftBookable] = useState<Record<string, boolean>>({});
  const [draftOperators, setDraftOperators] = useState<Record<string, string[]>>({});
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    if (isLoading) return;
    if (!opServicesLoaded) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraftBookable({ ...baselineBookable });
    setDraftOperators({ ...baselineOperators });
    initializedRef.current = true;
  }, [isLoading, opServicesLoaded, baselineBookable, baselineOperators]);

  // ── Diff: figure out what changed vs baseline.
  const bookableDiff = useMemo(() => {
    const turnedOn: string[] = [];
    const turnedOff: string[] = [];
    for (const id of Object.keys(draftBookable)) {
      const next = draftBookable[id];
      const prev = baselineBookable[id] ?? false;
      if (next === prev) continue;
      if (next) turnedOn.push(id);
      else turnedOff.push(id);
    }
    return { turnedOn, turnedOff };
  }, [draftBookable, baselineBookable]);

  const operatorsDiff = useMemo(() => {
    const changed: { serviceId: string; nextIds: string[] }[] = [];
    for (const id of Object.keys(draftOperators)) {
      const next = draftOperators[id] ?? [];
      const prev = baselineOperators[id] ?? [];
      if (sortedKey(next) !== sortedKey(prev)) changed.push({ serviceId: id, nextIds: next });
    }
    return changed;
  }, [draftOperators, baselineOperators]);

  const isDirty =
    bookableDiff.turnedOn.length > 0 ||
    bookableDiff.turnedOff.length > 0 ||
    operatorsDiff.length > 0;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // ── Toggle handlers update draft only.
  const setBookable = (svc: Service, value: boolean) => {
    setDraftBookable((p) => ({ ...p, [svc.id]: value }));
    if (!value && openServiceId === svc.id) setOpenServiceId(null);
  };

  const setGroupBookable = (group: Group, value: boolean) => {
    setDraftBookable((p) => {
      const next = { ...p };
      for (const s of group.services) next[s.id] = value;
      return next;
    });
  };

  const setAllBookable = (value: boolean) => {
    setDraftBookable((p) => {
      const next = { ...p };
      for (const id of Object.keys(p)) next[id] = value;
      return next;
    });
  };

  const setOperatorEnabled = (
    serviceId: string,
    operatorId: string,
    visualOn: boolean,
  ) => {
    setDraftOperators((p) => {
      const allActiveIds = activeOperators.map((o) => o.id);
      const current = p[serviceId] ?? [];
      // Empty set = chiunque mode → expand to "all on" before editing.
      const explicit = current.length === 0 ? allActiveIds : current;
      let nextList: string[];
      if (visualOn) {
        // Turning OFF this operator.
        nextList = explicit.filter((id) => id !== operatorId);
      } else {
        nextList = explicit.includes(operatorId) ? explicit : [...explicit, operatorId];
      }
      // Collapse back to chiunque when every active operator is allowed.
      const isFull =
        allActiveIds.length > 0 && allActiveIds.every((id) => nextList.includes(id));
      return { ...p, [serviceId]: isFull ? [] : nextList };
    });
  };

  // ── Imperative handle for the page-level Save button.
  const save = useCallback(async () => {
    try {
      const writes: Promise<unknown>[] = [];
      if (bookableDiff.turnedOn.length > 0) {
        writes.push(bulkUpdateServices(bookableDiff.turnedOn, { bookable_online: true }));
      }
      if (bookableDiff.turnedOff.length > 0) {
        writes.push(bulkUpdateServices(bookableDiff.turnedOff, { bookable_online: false }));
      }
      for (const { serviceId, nextIds } of operatorsDiff) {
        writes.push(replaceForService(serviceId, nextIds));
      }
      await Promise.all(writes);
      // Refetch to pick up any server-side normalisations (and rebuild draft).
      await Promise.all([fetchServices(), fetchOpServices()]);
      initializedRef.current = false;
    } catch (err) {
      messagePopup
        .getState()
        .error(err instanceof Error && err.message ? err.message : 'Errore durante il salvataggio');
      throw err;
    }
  }, [bookableDiff, operatorsDiff, bulkUpdateServices, replaceForService, fetchServices, fetchOpServices]);

  const discard = useCallback(() => {
    setDraftBookable({ ...baselineBookable });
    setDraftOperators({ ...baselineOperators });
    setOpenServiceId(null);
  }, [baselineBookable, baselineOperators]);

  useImperativeHandle(ref, () => ({ save, discard }), [save, discard]);

  // ── Derived for rendering.
  const groups: Group[] = useMemo(() => {
    const byCat = new Map<string, Group>();
    for (const svc of visibleServices) {
      const cat = categories.find((c) => c.id === svc.category_id);
      const key = cat?.id ?? UNCATEGORIZED_KEY;
      const existing = byCat.get(key);
      if (existing) {
        existing.services.push(svc);
      } else {
        byCat.set(key, {
          id: key,
          name: cat?.name ?? 'Senza categoria',
          color: cat?.color,
          services: [svc],
        });
      }
    }
    const list = Array.from(byCat.values());
    for (const g of list) g.services.sort((a, b) => a.name.localeCompare(b.name, 'it'));
    list.sort((a, b) => {
      if (a.id === UNCATEGORIZED_KEY) return 1;
      if (b.id === UNCATEGORIZED_KEY) return -1;
      return a.name.localeCompare(b.name, 'it');
    });
    return list;
  }, [visibleServices, categories]);

  const bookableCount = visibleServices.filter((s) => draftBookable[s.id] ?? false).length;
  const totalCount = visibleServices.length;
  const allOn = totalCount > 0 && bookableCount === totalCount;

  return (
    <SettingsCard
      title="Servizi prenotabili online"
      description="Attiva i servizi da mostrare nella vetrina pubblica. Espandi un servizio per scegliere chi può svolgerlo — se sono tutti attivi, può farlo chiunque."
      rightSlot={
        <span className="text-xs text-[var(--lume-text-secondary)] tabular-nums">
          {bookableCount} / {totalCount}
        </span>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="size-4 animate-spin text-[var(--lume-text-muted)]" />
        </div>
      ) : visibleServices.length === 0 ? (
        <p className="text-sm text-[var(--lume-text-secondary)]">Nessun servizio attivo. Aggiungine uno dalla sezione Servizi.</p>
      ) : (
        <div className="flex flex-col gap-5">
          <SwitchRow
            className="pb-3 border-b border-line"
            label="Tutti i servizi"
            description={allOn
              ? 'Tutti i servizi sono prenotabili online.'
              : 'Attiva tutti i servizi in un colpo solo.'}
            checked={allOn}
            onChange={() => setAllBookable(!allOn)}
          />

          {groups.map((group) => {
            const groupOn = group.services.filter((s) => draftBookable[s.id] ?? false).length;
            const groupTotal = group.services.length;
            const groupAllOn = groupOn === groupTotal;
            return (
              <section key={group.id}>
                <SwitchRow
                  className="pb-1.5 mb-1 border-b border-line"
                  leading={group.color ? (
                    <span
                      aria-hidden
                      className="block size-2 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                  ) : undefined}
                  label={
                    <span className="flex items-center gap-2 text-xs text-[var(--lume-text-secondary)]">
                      {group.name}
                      <span className="tabular-nums font-normal text-[var(--lume-text-muted)]">
                        {groupOn}/{groupTotal}
                      </span>
                    </span>
                  }
                  checked={groupAllOn}
                  onChange={() => setGroupBookable(group, !groupAllOn)}
                />
                <ul className="divide-y divide-line">
                  {group.services.map((svc) => {
                    const isBookable = draftBookable[svc.id] ?? false;
                    const isOpen = isBookable && openServiceId === svc.id;
                    const explicitOps = draftOperators[svc.id] ?? [];
                    const isUnrestricted = explicitOps.length === 0;
                    const allowedCount = isUnrestricted ? activeOperators.length : explicitOps.length;
                    const canExpand = isBookable && activeOperators.length > 0;
                    return (
                      <li key={svc.id}>
                        <SwitchRow
                          className="py-2.5 gap-3"
                          leading={canExpand ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              iconOnly
                              onClick={() => setOpenServiceId(isOpen ? null : svc.id)}
                              aria-expanded={isOpen}
                              aria-controls={`svc-operators-${svc.id}`}
                              aria-label={isOpen ? 'Nascondi operatori' : 'Mostra operatori'}
                              className="size-6"
                            >
                              <ChevronDown
                                className={`transition-transform duration-[var(--duration-fast)] motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}
                              />
                            </Button>
                          ) : (
                            <span aria-hidden className="block size-6" />
                          )}
                          label={<span className="block truncate">{svc.name}</span>}
                          description={
                            <span className="block truncate">
                              <span className="tabular-nums">{svc.duration} min · {formatCurrency(svc.price)}</span>
                              {isBookable && (
                                <span className="ml-2">· 
                                  {isUnrestricted
                                    ? 'Tutti'
                                    : `${allowedCount} ${allowedCount === 1 ? 'operatore' : 'operatori'}`}
                                </span>
                              )}
                            </span>
                          }
                          trailing={isBookable ? (
                            <StatusDot tone="success" className="hidden sm:inline-flex text-xs text-[var(--lume-text-secondary)]">online</StatusDot>
                          ) : undefined}
                          checked={isBookable}
                          onChange={() => setBookable(svc, !isBookable)}
                        />
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              id={`svc-operators-${svc.id}`}
                              initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                              transition={{ duration: DURATION.base, ease: 'easeOut' }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div className="mb-3 ml-8 pl-3 border-l border-line py-1">
                                <p className="text-xs text-[var(--lume-text-secondary)] mb-2">
                                  Chi può svolgerlo
                                </p>
                                <ul className="flex flex-col gap-1.5">
                                  {activeOperators.map((op) => {
                                    const visualOn = isUnrestricted || explicitOps.includes(op.id);
                                    return (
                                      <li key={op.id}>
                                        <SwitchRow
                                          className="gap-3"
                                          label={
                                            <span className="flex items-center gap-2.5 min-w-0 font-normal">
                                              <OperatorAvatar operator={op} />
                                              <span className="truncate">{op.getFullName()}</span>
                                            </span>
                                          }
                                          checked={visualOn}
                                          onChange={() => setOperatorEnabled(svc.id, op.id, visualOn)}
                                        />
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </SettingsCard>
  );
}
