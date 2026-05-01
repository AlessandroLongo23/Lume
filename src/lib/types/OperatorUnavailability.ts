import { useOperatorsStore } from '@/lib/stores/operators';
import type { Operator } from './Operator';

export class OperatorUnavailability {
  id: string;
  salon_id: string;
  operator_id: string;
  start_at: Date;
  end_at: Date;
  all_day: boolean;
  note: string | null;
  created_by: string | null;
  created_at: Date;

  constructor(
    row: Pick<OperatorUnavailability, 'id' | 'salon_id' | 'operator_id'> & {
      start_at: Date | string;
      end_at: Date | string;
      all_day?: boolean | null;
      note?: string | null;
      created_by?: string | null;
      created_at?: Date | string | null;
    },
  ) {
    this.id = row.id;
    this.salon_id = row.salon_id;
    this.operator_id = row.operator_id;
    this.start_at = row.start_at instanceof Date ? row.start_at : new Date(row.start_at);
    this.end_at = row.end_at instanceof Date ? row.end_at : new Date(row.end_at);
    this.all_day = row.all_day ?? false;
    this.note = row.note ?? null;
    this.created_by = row.created_by ?? null;
    this.created_at = row.created_at
      ? row.created_at instanceof Date
        ? row.created_at
        : new Date(row.created_at)
      : new Date();
  }

  getOperator(): Operator | null {
    return useOperatorsStore.getState().operators.find((o) => o.id === this.operator_id) ?? null;
  }

  /** Duration in minutes. */
  getDuration(): number {
    return Math.round((this.end_at.getTime() - this.start_at.getTime()) / 60_000);
  }

  /** True if this block covers any portion of the given date. */
  overlapsDate(date: Date): boolean {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    return this.start_at < dayEnd && this.end_at > dayStart;
  }

  /** True if this block overlaps the given range. */
  overlapsRange(start: Date, end: Date): boolean {
    return this.start_at < end && this.end_at > start;
  }
}
