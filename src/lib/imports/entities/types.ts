/**
 * Generic types shared by every entity import. Each entity ships its own
 * dictionary, schema, dedup config, and insert builder via an
 * `EntityImportConfig`. Core pipeline files (runProcess, runCommit, llmMapper)
 * are entity-agnostic and dispatch through the registry by `job.entity`.
 */

export type ImportEntity =
  | 'clients'
  | 'productCategories'
  | 'manufacturers'
  | 'suppliers'
  | 'serviceCategories'
  | 'operators'
  | 'products'
  | 'services';

/** Recognized value parsers shared across entities. Maps 1:1 to helpers in core/transforms.ts. */
export type ValueParser = 'string' | 'number' | 'integer' | 'boolean' | 'raw';

/**
 * A predicate against the raw cell value (a string after CSV/XLSX parse).
 * Rules are evaluated in order — first matching rule wins (like switch-case).
 */
export interface SmartCondition {
  matchType:
    | 'numeric'        // parseNumber(cell) != null
    | 'nonNumeric'     // non-empty AND parseNumber(cell) == null
    | 'empty'          // trim() === ''
    | 'nonEmpty'
    | 'equalsAny'      // values[]: lowercased+trimmed equality
    | 'containsAny'    // values[]: lowercased substring
    | 'regex'          // pattern + optional flags
    | 'always';        // unconditional fallback (typically the last rule)
  values?: string[];
  pattern?: string;
  flags?: string;
}

/** What to write to which destField when a condition matches. */
export interface SmartAssignment {
  destField: string;
  parser: ValueParser;
  /**
   * When defined, write this literal instead of the parsed cell. Used for
   * boolean signals derived from text presence (e.g. "Non in vendita" → false).
   */
  literal?: string | number | boolean | null;
}

/** One conditional branch in the rule list. */
export interface SmartRule {
  condition: SmartCondition;
  /** All assignments fire when the condition matches. */
  assignments: SmartAssignment[];
}

/**
 * Optional advanced transformation produced by the smart mapper. When present,
 * applySmartRules() is invoked at row time and its outputs are merged into the
 * dest map, possibly writing multiple destFields from one source column.
 */
export interface SmartTransform {
  /** One-line Italian explanation surfaced in the review UI. */
  description: string;
  /** Union of all assignments[*].destField — used by the UI badge. */
  outputs: string[];
  /** Evaluated in order; first matching rule applies, the rest are skipped. */
  rules: SmartRule[];
}

/** Result of mapping one source column to a destination field. */
export interface ColumnMapping {
  sourceColumn: string;
  /** Primary 1:1 target. Null = ignored. Kept for back-compat with the simple flow. */
  destField: string | null;
  confidence: number; // 0..1
  /**
   * Optional smart transform produced by the LLM in smart mode. When present
   * it OVERRIDES the simple destField behavior for this column at row time.
   * destField is still set (to the rule's most "primary" output) so the
   * review-UI dropdown has something meaningful to show and so
   * hasRequiredCoverage() continues to work without changes.
   */
  smartTransform?: SmartTransform;
}

/** Map of destination field → Italian/English aliases for fast-path lookup. */
export type HeaderDictionary = Record<string, readonly string[]>;

export interface FailedRow {
  ok: false;
  rowIndex: number;
  reason: string;
  rawValues: Record<string, string>;
  /** Partially-transformed candidate at the moment validation failed. */
  partialRow?: Record<string, unknown>;
}

export interface TransformedRow<TRow> {
  ok: true;
  row: TRow;
}

export type RowResult<TRow = Record<string, unknown>> = TransformedRow<TRow> | FailedRow;

export interface DedupKeyConfig {
  /** Property on the transformed row to read */
  rowField: string;
  /** Column on the target table to compare against */
  column: string;
  /** Optional normalization before comparing */
  normalize?: 'lower' | 'lower-trim';
}

export interface FkColumnConfig<TRow = Record<string, unknown>> {
  /** Field on the transformed row holding the referenced name */
  sourceField: keyof TRow & string;
  /** FK column on the entity's own table */
  targetField: string;
  /** Referenced table */
  table: string;
  /** Match column on the referenced table (usually 'name') */
  matchField: string;
  /** v1: always true — silently insert a new record on miss */
  autoCreate: true;
}

export interface PreviewColumn {
  /** Field on the transformed row (also looked up on `partialRow` for failed rows) */
  key: string;
  label: string;
}

export interface EntityImportConfig<TRow extends Record<string, unknown> = Record<string, unknown>> {
  entity: ImportEntity;
  /** Supabase table to insert into */
  table: string;
  /** Italian label for UI headers */
  italianLabel: string;
  /** All mapping targets, in dropdown order */
  destFields: readonly string[];
  /** Italian labels for each dest field (review dropdown + preview header) */
  destFieldLabels: Record<string, string>;
  /** True when current mappings cover the entity's required fields */
  hasRequiredCoverage: (mappings: ColumnMapping[]) => boolean;
  /** Human-readable reason returned when coverage check fails (sent to concierge) */
  insufficientMappingReason: string;
  /** Fast-path dictionary: dest field → normalized aliases */
  dictionary: HeaderDictionary;
  /** Field-by-field descriptions injected into the LLM system prompt */
  llmFieldDescriptions: Record<string, string>;
  /** Domain hint inserted into the LLM system prompt */
  llmDomainHint: string;
  /**
   * When true, runProcess invokes smartMapColumns() (sees full row data) instead of
   * the header-only mapColumns() flow. Default: false. Never enable for client-PII entities.
   */
  smartModeEnabled?: boolean;
  /**
   * Optional curated hints injected into the smart-mapper system prompt.
   * Teach Claude about known multi-output splits in this entity's exports.
   */
  smartHints?: {
    description: string;
    examples: Array<{ sourceColumnHint: string; explanation: string }>;
  };
  /** Apply mappings to a single source row; never throws */
  transformRow: (
    source: Record<string, string>,
    mappings: ColumnMapping[],
    rowIndex: number,
  ) => RowResult<TRow>;
  /** Optional FK columns resolved before insert */
  fkColumns?: FkColumnConfig<TRow>[];
  /** Skip a row if any key matches an existing record (or a previously-seen row in the same batch) */
  dedupKeys: DedupKeyConfig[];
  /** Build the Supabase insert payload for one transformed row */
  buildInsertPayload: (row: TRow, ctx: { salonId: string }) => Record<string, unknown>;
  /** Columns shown in the review-page preview table */
  previewColumns: readonly PreviewColumn[];
  /** Path to navigate to from the completed/cancelled/error states */
  redirectAfterCompletion: string;
}
