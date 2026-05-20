export type ActivityAction = 'create' | 'update' | 'delete' | 'bulk';

export class ActivityLog {
  id: string;
  salon_id: string;
  actor_id: string | null;
  actor_name: string | null;
  entity_type: string;
  entity_id: string | null;
  action: ActivityAction;
  changes: unknown;
  summary: string | null;
  created_at: Date;

  constructor(a: {
    id: string;
    salon_id: string;
    actor_id: string | null;
    actor_name: string | null;
    entity_type: string;
    entity_id: string | null;
    action: ActivityAction;
    changes: unknown;
    summary: string | null;
    created_at: string | Date;
  }) {
    this.id = a.id;
    this.salon_id = a.salon_id;
    this.actor_id = a.actor_id;
    this.actor_name = a.actor_name;
    this.entity_type = a.entity_type;
    this.entity_id = a.entity_id;
    this.action = a.action;
    this.changes = a.changes;
    this.summary = a.summary;
    this.created_at = a.created_at instanceof Date ? a.created_at : new Date(a.created_at);
  }
}
