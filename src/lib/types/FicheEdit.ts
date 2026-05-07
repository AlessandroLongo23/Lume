export type FicheEditChanges = Record<string, { old: unknown; new: unknown }>;

export class FicheEdit {
  id: string;
  fiche_id: string;
  salon_id: string;
  edited_by: string | null;
  edited_at: Date;
  changes: FicheEditChanges;
  reason: string | null;

  constructor(fe: {
    id: string;
    fiche_id: string;
    salon_id: string;
    edited_by: string | null;
    edited_at: string | Date;
    changes: FicheEditChanges;
    reason: string | null;
  }) {
    this.id = fe.id;
    this.fiche_id = fe.fiche_id;
    this.salon_id = fe.salon_id;
    this.edited_by = fe.edited_by;
    this.edited_at = fe.edited_at instanceof Date ? fe.edited_at : new Date(fe.edited_at);
    this.changes = fe.changes;
    this.reason = fe.reason;
  }
}
