import type { FicheService } from '@/lib/types/FicheService';
import type { OperatorUnavailability } from '@/lib/types/OperatorUnavailability';
import type { DaySchedule } from '@/lib/utils/operating-hours';
import { isRangeWithinHours } from '@/lib/utils/operating-hours';

export type ConflictReason =
  | 'overlap'
  | 'client-overlap'
  | 'unavailability'
  | 'outside-hours'
  | 'closed-day'
  | 'past'
  | 'invalid-range'
  | null;

export interface ConflictResult {
  /** True when the drop should be allowed. Warnings (outside-hours, closed-day) are still valid. */
  valid: boolean;
  reason: ConflictReason;
  conflictingFicheServiceIds: string[];
}

const OK: ConflictResult = { valid: true, reason: null, conflictingFicheServiceIds: [] };

/** Reasons that hard-block the drop. Other reasons are soft warnings. */
const HARD_REASONS: ReadonlySet<NonNullable<ConflictReason>> = new Set([
  'overlap',
  'client-overlap',
  'unavailability',
  'past',
  'invalid-range',
]);

export function isWarningReason(reason: ConflictReason): boolean {
  return reason !== null && !HARD_REASONS.has(reason);
}

interface CollideArgs {
  operatorId: string;
  start: Date;
  end: Date;
  excludeFicheServiceIds: string[];
  allFicheServices: FicheService[];
  schedule: DaySchedule[];
  allowPast?: boolean;
  /** Client of the segment being moved/created. When provided, overlaps with any
   *  other service for this client (regardless of operator) are also reported. */
  clientId?: string | null;
  /** Map of fiche_id → client_id, used to evaluate cross-operator client overlaps. */
  ficheClientMap?: Map<string, string>;
  /** Active unavailability blocks; the segment is rejected if it overlaps any
   *  block owned by the same operator. */
  unavailabilities?: OperatorUnavailability[];
}

export function wouldCollide(args: CollideArgs): ConflictResult {
  const {
    operatorId,
    start,
    end,
    excludeFicheServiceIds,
    allFicheServices,
    schedule,
    allowPast = false,
    clientId = null,
    ficheClientMap,
    unavailabilities,
  } = args;

  if (end.getTime() <= start.getTime()) {
    return { valid: false, reason: 'invalid-range', conflictingFicheServiceIds: [] };
  }

  if (!allowPast && start.getTime() < Date.now()) {
    return { valid: false, reason: 'past', conflictingFicheServiceIds: [] };
  }

  const exclude = new Set(excludeFicheServiceIds);
  const startMs = start.getTime();
  const endMs = end.getTime();

  const timeOverlapping = allFicheServices.filter((fs) => {
    if (exclude.has(fs.id)) return false;
    const fsStart = new Date(fs.start_time).getTime();
    const fsEnd = new Date(fs.end_time).getTime();
    return fsStart < endMs && fsEnd > startMs;
  });

  const operatorOverlaps = timeOverlapping
    .filter((fs) => fs.operator_id === operatorId)
    .map((fs) => fs.id);

  if (operatorOverlaps.length > 0) {
    return { valid: false, reason: 'overlap', conflictingFicheServiceIds: operatorOverlaps };
  }

  if (clientId && ficheClientMap) {
    const clientOverlaps = timeOverlapping
      .filter((fs) => ficheClientMap.get(fs.fiche_id) === clientId)
      .map((fs) => fs.id);
    if (clientOverlaps.length > 0) {
      return { valid: false, reason: 'client-overlap', conflictingFicheServiceIds: clientOverlaps };
    }
  }

  if (unavailabilities && unavailabilities.length > 0) {
    const blocks = unavailabilities.some(
      (u) => u.operator_id === operatorId && u.start_at.getTime() < endMs && u.end_at.getTime() > startMs,
    );
    if (blocks) {
      return { valid: false, reason: 'unavailability', conflictingFicheServiceIds: [] };
    }
  }

  if (schedule.length > 0) {
    const day = schedule.find((d) => d.day === start.getDay());
    if (!day || !day.isOpen || day.shifts.length === 0) {
      return { valid: true, reason: 'closed-day', conflictingFicheServiceIds: [] };
    }
    if (!isRangeWithinHours(schedule, start, end)) {
      return { valid: true, reason: 'outside-hours', conflictingFicheServiceIds: [] };
    }
  }

  return OK;
}

interface BlockSegment {
  ficheServiceId: string;
  operatorId: string;
  start: Date;
  end: Date;
}

interface BlockCollideArgs {
  segments: BlockSegment[];
  excludeFicheServiceIds: string[];
  allFicheServices: FicheService[];
  /**
   * Either a single schedule applied to every segment, or a resolver that
   * returns the effective schedule for the operator that owns each segment
   * (used so per-operator working hours are honored).
   */
  schedule: DaySchedule[] | ((operatorId: string) => DaySchedule[]);
  allowPast?: boolean;
  clientId?: string | null;
  ficheClientMap?: Map<string, string>;
  unavailabilities?: OperatorUnavailability[];
}

/**
 * Aggregate validation across multiple segments (a fiche moved as a block).
 * Priority of returned reason: overlap > client-overlap > outside-hours > closed-day > past > invalid-range.
 */
export function wouldBlockCollide(args: BlockCollideArgs): ConflictResult {
  const allConflictingIds = new Set<string>();
  const reasonCounts: Record<NonNullable<ConflictReason>, number> = {
    overlap: 0,
    'client-overlap': 0,
    unavailability: 0,
    'outside-hours': 0,
    'closed-day': 0,
    past: 0,
    'invalid-range': 0,
  };

  const resolveSchedule =
    typeof args.schedule === 'function'
      ? args.schedule
      : () => args.schedule as DaySchedule[];

  for (const seg of args.segments) {
    const r = wouldCollide({
      operatorId: seg.operatorId,
      start: seg.start,
      end: seg.end,
      excludeFicheServiceIds: args.excludeFicheServiceIds,
      allFicheServices: args.allFicheServices,
      schedule: resolveSchedule(seg.operatorId),
      allowPast: args.allowPast,
      clientId: args.clientId,
      ficheClientMap: args.ficheClientMap,
      unavailabilities: args.unavailabilities,
    });
    if (r.reason) {
      reasonCounts[r.reason]++;
      r.conflictingFicheServiceIds.forEach((id) => allConflictingIds.add(id));
    }
  }

  const priorityOrder: NonNullable<ConflictReason>[] = [
    'overlap',
    'client-overlap',
    'unavailability',
    'past',
    'invalid-range',
    'outside-hours',
    'closed-day',
  ];
  for (const reason of priorityOrder) {
    if (reasonCounts[reason] > 0) {
      return {
        valid: !HARD_REASONS.has(reason),
        reason,
        conflictingFicheServiceIds: Array.from(allConflictingIds),
      };
    }
  }

  return OK;
}
