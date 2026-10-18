import type { Tables } from '@/lib/supabase/types';
import { isJsonObject } from '@/lib/supabase/json';

export type FicheEditChanges = Record<string, { old: unknown; new: unknown }>;

export class FicheEdit {
  id: string;
  fiche_id: string;
  salon_id: string;
  edited_by: string | null;
  edited_at: Date;
  changes: FicheEditChanges;
  reason: string | null;

  constructor(row: Tables<'fiche_edits'>) {
    this.id = row.id;
    this.fiche_id = row.fiche_id;
    this.salon_id = row.salon_id;
    this.edited_by = row.edited_by;
    this.edited_at = new Date(row.edited_at);
    // Written only by update_fiche_with_audit, as { field: { old, new } }.
    this.changes = isJsonObject(row.changes) ? (row.changes as FicheEditChanges) : {};
    this.reason = row.reason;
  }
}
