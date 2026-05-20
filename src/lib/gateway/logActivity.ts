import 'server-only';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export type ActivityAction = 'create' | 'update' | 'delete' | 'bulk';

export type LogActivityInput = {
  salonId: string;
  actorId: string;
  /** Display snapshot. Resolved from operators/profiles when omitted. */
  actorName?: string | null;
  /** Source table name, e.g. 'clients'. Mirrors the trigger's entity_type. */
  entityType: string;
  /** Affected row id (string; null for bulk operations). */
  entityId?: string | null;
  action: ActivityAction;
  /** {field:{old,new}} | full-row snapshot | {ids:[…]} — anything serializable. */
  changes?: Record<string, unknown> | null;
  /** Optional plain-Italian summary (used for bulk and where a diff isn't enough). */
  summary?: string | null;
};

/**
 * Records one entry in public.activity_log for a SERVICE-ROLE write.
 *
 * Why this exists: service-role writes run without an end-user JWT, so the
 * database-side log_activity() trigger sees auth.uid() = null and skips them to
 * avoid double-logging. Server routes that mutate with the admin client must call
 * this helper after a successful write so the action is still attributed to the
 * real actor (profile.id from getCallerProfile()).
 *
 * Rule: call ONLY after service-role writes. Routes that write through the user/SSR
 * client must NOT call this — the trigger already covers them (double rows otherwise).
 *
 * Never throws into the request path: a logging failure must not break a real
 * mutation, so all errors are swallowed and logged to the server console.
 */
export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    const admin = getAdminClient();

    let actorName = input.actorName ?? null;
    if (!actorName) {
      const { data } = await admin.rpc('actor_display_name', { p_uid: input.actorId });
      actorName = (typeof data === 'string' ? data : null);
    }

    await admin.from('activity_log').insert({
      salon_id: input.salonId,
      actor_id: input.actorId,
      actor_name: actorName,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      action: input.action,
      changes: input.changes ?? null,
      summary: input.summary ?? null,
    });
  } catch (err) {
    console.error('[logActivity] failed to record activity:', err);
  }
}

/**
 * Builds a {field:{old,new}} diff between two row snapshots, like the trigger does.
 * Pass the previous and next state of a row; housekeeping columns are ignored.
 */
export function diffRows(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
  ignore: string[] = ['updated_at', 'created_at', 'updated_by'],
): Record<string, { old: unknown; new: unknown }> {
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  for (const key of keys) {
    if (ignore.includes(key)) continue;
    const oldVal = before?.[key];
    const newVal = after?.[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes[key] = { old: oldVal ?? null, new: newVal ?? null };
    }
  }
  return changes;
}
