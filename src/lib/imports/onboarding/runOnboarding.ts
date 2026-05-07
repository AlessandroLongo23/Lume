import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { loadParsedFile } from '../core/loadParsedFile';
import { classifyFileOrSheet, type ClassifierEntity } from '../core/classifier';
import { runProcessImport } from '../core/runProcess';
import { runCommitImport } from '../core/runCommit';
import { isEntitySupported } from '../entities/registry';
import { COMMIT_WAVES } from './types';
import type { ImportEntity, ColumnMapping } from '../entities/types';
import type { ImportJobMappingPayload } from '@/lib/types/ImportJob';
import type { OnboardingSummary } from '@/lib/types/OnboardingImport';

const CLASSIFIER_SAMPLE_SIZE = 10;

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

interface ChildRow {
  id: string;
  storage_path: string;
  source_filename: string;
  source_sheet_name: string | null;
  entity: string | null;
  status: string;
  auto_commit_eligible: boolean;
  mapping_json: ImportJobMappingPayload | null;
  processed_rows: number;
}

const CLASSIFY_CONCURRENCY = 4;
const PROCESS_CONCURRENCY = 2;

/**
 * Synchronous in-process orchestrator for the onboarding bulk-import flow.
 * Mirrors the existing manual-import pattern (`runProcessImport` /
 * `runCommitImport`) so onboarding works without an Inngest worker. Runs
 * inside `after()` from the API route — the browser is redirected to the
 * progress screen immediately and watches the parent row via Realtime.
 *
 * Phase A — classify every child in parallel
 * Phase B — for every supported child, run runProcessImport (parse + map)
 * Phase C — wave-by-wave commit using runCommitImport
 *
 * Idempotent: skips children already past the relevant stage so it's safe
 * to call again on a partial run.
 */
export async function runOnboarding(onboardingId: string, salonId: string): Promise<void> {
  const supabase = createAdminClient();
  const log = (msg: string, meta?: Record<string, unknown>) =>
    console.log(`[runOnboarding ${onboardingId.slice(0, 8)}] ${msg}`, meta ?? '');

  try {
    log('start');
    await markParent(supabase, onboardingId, {
      status: 'classifying',
      started_at: new Date().toISOString(),
    });

    // ── Phase A: classify ──────────────────────────────────────────────────
    const { data: rawChildren } = await supabase
      .from('import_jobs')
      .select('id, storage_path, source_filename, source_sheet_name, entity, status, auto_commit_eligible, mapping_json, processed_rows')
      .eq('onboarding_id', onboardingId);
    const children = (rawChildren ?? []) as ChildRow[];

    if (children.length === 0) {
      await markParent(supabase, onboardingId, { status: 'failed', failure_reason: 'Nessun file da classificare.' });
      return;
    }

    // Sibling sheet names per filename (helps the classifier disambiguate
    // tabs like "Categorie" inside a multi-sheet workbook).
    const siblingsByFile = new Map<string, string[]>();
    for (const c of children) {
      if (!c.source_sheet_name) continue;
      const list = siblingsByFile.get(c.source_filename) ?? [];
      list.push(c.source_sheet_name);
      siblingsByFile.set(c.source_filename, list);
    }

    let classifiedCount = 0;
    await runConcurrent(children, CLASSIFY_CONCURRENCY, async (child) => {
      // Skip already-classified children (resumable).
      if (child.entity || child.status === 'needs_concierge' || child.status === 'failed') {
        classifiedCount++;
        return;
      }
      try {
        // `loadParsedFile` handles every supported source type uniformly:
        // CSV/XLSX parsed inline, PDFs extracted via Claude. The PDF
        // extraction caches its result alongside the source, so the later
        // entity-aware processing pass reuses it without a second LLM call.
        const parsed = await loadParsedFile(supabase, {
          storage_path: child.storage_path,
          source_filename: child.source_filename,
          source_sheet_name: child.source_sheet_name,
        });
        const siblings = (siblingsByFile.get(child.source_filename) ?? []).filter(
          (s) => s !== child.source_sheet_name,
        );
        const result = await classifyFileOrSheet({
          filename: child.source_filename,
          sheetName: child.source_sheet_name,
          siblingSheets: siblings,
          headers: parsed.headers,
          sampleRows: parsed.rows.slice(0, CLASSIFIER_SAMPLE_SIZE),
        });
        await applyClassification(supabase, child.id, result);
        log('classified', { jobId: child.id.slice(0, 8), entity: result.entity, confidence: result.confidence });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log('classify failed', { jobId: child.id.slice(0, 8), err: msg });
        await applyClassification(supabase, child.id, {
          entity: 'unknown',
          confidence: 0,
          reason: `Classificazione fallita: ${msg.slice(0, 120)}`,
        });
      } finally {
        classifiedCount++;
        await supabase
          .from('onboarding_imports')
          .update({ classified_count: classifiedCount })
          .eq('id', onboardingId);
      }
    });

    // ── Phase B: process (parse + map) ─────────────────────────────────────
    await markParent(supabase, onboardingId, { status: 'mapping' });

    // Re-read children — entity is filled in by classification.
    const { data: rawAfterClassify } = await supabase
      .from('import_jobs')
      .select('id, storage_path, source_filename, source_sheet_name, entity, status, auto_commit_eligible, mapping_json, processed_rows')
      .eq('onboarding_id', onboardingId);
    const supportedChildren = ((rawAfterClassify ?? []) as ChildRow[]).filter(
      (c) => c.entity && isEntitySupported(c.entity) && (c.status === 'queued' || c.status === 'parsing'),
    );

    if (supportedChildren.length === 0) {
      // Every file got concierge'd — nothing to commit. Surface as
      // partial_failure so the UI can show the "we'll handle it manually" message.
      await markParent(supabase, onboardingId, {
        status: 'partial_failure',
        completed_at: new Date().toISOString(),
        failure_reason:
          "Nessun file riconosciuto automaticamente — il team Lume completerà l'import.",
        summary_json: { unclassifiedFiles: children.length },
      });
      return;
    }

    await runConcurrent(supportedChildren, PROCESS_CONCURRENCY, async (child) => {
      try {
        await runProcessImport(child.id);
      } catch (err) {
        log('processImport threw', { jobId: child.id.slice(0, 8), err: String(err) });
      }
    });

    // ── Phase C: commit in waves ───────────────────────────────────────────
    const { data: rawAfterProcess } = await supabase
      .from('import_jobs')
      .select('id, storage_path, source_filename, source_sheet_name, entity, status, auto_commit_eligible, mapping_json, processed_rows')
      .eq('onboarding_id', onboardingId);
    const processedChildren = (rawAfterProcess ?? []) as ChildRow[];

    const eligible = processedChildren.filter(
      (c) =>
        c.entity &&
        isEntitySupported(c.entity) &&
        c.status === 'awaiting_review' &&
        c.auto_commit_eligible,
    );

    if (eligible.length === 0) {
      // Nothing auto-committable — leave parent in 'reviewing' state.
      // The deferred-review banner will prompt the user to confirm each file.
      await markParent(supabase, onboardingId, { status: 'reviewing' });
      return;
    }

    await markParent(supabase, onboardingId, { status: 'committing' });

    let totalCommitted = 0;
    const summary: OnboardingSummary = {};

    for (let waveIndex = 0; waveIndex < COMMIT_WAVES.length; waveIndex++) {
      const waveEntities = COMMIT_WAVES[waveIndex];
      const inWave = eligible.filter((c) => waveEntities.includes(c.entity as ImportEntity));
      if (inWave.length === 0) continue;

      // Within a wave the children's target tables are disjoint, so we can
      // commit them in parallel safely. Use the same low concurrency as
      // process to avoid hammering Postgres.
      await runConcurrent(inWave, PROCESS_CONCURRENCY, async (child) => {
        const mappings: ColumnMapping[] = child.mapping_json?.mappings ?? [];
        try {
          await runCommitImport(child.id, mappings);
        } catch (err) {
          log('commitImport threw', { jobId: child.id.slice(0, 8), err: String(err) });
        }
      });

      // Tally what landed in this wave
      const { data: tallies } = await supabase
        .from('import_jobs')
        .select('id, entity, processed_rows')
        .in('id', inWave.map((c) => c.id));
      for (const t of (tallies ?? []) as Array<{ id: string; entity: ImportEntity; processed_rows: number }>) {
        summary[t.entity] = (summary[t.entity] ?? 0) + (t.processed_rows ?? 0);
        totalCommitted += t.processed_rows ?? 0;
      }
      await supabase
        .from('onboarding_imports')
        .update({ committed_count: totalCommitted, summary_json: summary })
        .eq('id', onboardingId);
    }

    const conciergeChildren = processedChildren.filter((c) => c.status === 'needs_concierge');
    summary.unclassifiedFiles = conciergeChildren.length;

    const stillWaiting = processedChildren.filter(
      (c) => c.status === 'awaiting_review' && !c.auto_commit_eligible,
    );
    const finalStatus =
      stillWaiting.length === 0 && conciergeChildren.length === 0 ? 'completed' : 'partial_failure';

    const completedAt = new Date().toISOString();
    await supabase
      .from('onboarding_imports')
      .update({
        status: finalStatus,
        committed_count: totalCommitted,
        summary_json: summary,
        completed_at: completedAt,
      })
      .eq('id', onboardingId);

    await supabase
      .from('salons')
      .update({ onboarded_at: completedAt })
      .eq('id', salonId)
      .is('onboarded_at', null);

    log('done', { status: finalStatus, totalCommitted, summary });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[runOnboarding ${onboardingId.slice(0, 8)}] FAILED:`, msg);
    await markParent(supabase, onboardingId, {
      status: 'failed',
      failure_reason: msg,
      completed_at: new Date().toISOString(),
    }).catch(() => {});
  }
}

async function applyClassification(
  supabase: SupabaseAdmin,
  jobId: string,
  result: { entity: ClassifierEntity; confidence: number; reason: string },
): Promise<void> {
  const supported = result.entity !== 'unknown' && isEntitySupported(result.entity);
  const status = supported ? 'queued' : 'needs_concierge';
  const patch: Record<string, unknown> = {
    status,
    mapping_json: { classification: result },
  };
  if (supported) patch.entity = result.entity;
  if (!supported) patch.failure_reason = result.reason;
  const { error } = await supabase.from('import_jobs').update(patch).eq('id', jobId);
  if (error) console.error('[runOnboarding] applyClassification update error:', error.message);
}

async function markParent(
  supabase: SupabaseAdmin,
  onboardingId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.from('onboarding_imports').update(patch).eq('id', onboardingId);
  if (error) console.error('[runOnboarding] markParent error:', error.message);
}

/**
 * Pool-style concurrency: at most `concurrency` callbacks run in parallel,
 * the next item starts as soon as one finishes. Avoids the all-at-once
 * hammer pattern Promise.all gives you on large arrays.
 */
async function runConcurrent<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  const queue = items.slice();
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item === undefined) return;
      await fn(item);
    }
  });
  await Promise.all(workers);
}
