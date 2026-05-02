import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import type {
  ColumnMapping,
  EntityImportConfig,
  SmartAssignment,
  SmartCondition,
  SmartRule,
  SmartTransform,
  ValueParser,
} from '../entities/types';
import type { MappingResult } from './llmMapper';

const PER_COLUMN_DISTINCT_LIMIT = 20;
const PER_COLUMN_SAMPLE_SCAN = 200;
const PER_VALUE_CHAR_CAP = 80;
const VALID_PARSERS: readonly ValueParser[] = ['string', 'number', 'integer', 'boolean', 'raw'];
const VALID_MATCH_TYPES: readonly SmartCondition['matchType'][] = [
  'numeric', 'nonNumeric', 'empty', 'nonEmpty', 'equalsAny', 'containsAny', 'regex', 'always',
];

interface ColumnSample {
  header: string;
  values: string[];     // up to PER_COLUMN_DISTINCT_LIMIT distinct non-empty values
  distinctCount: number; // total distinct values seen in scan
}

/**
 * Smart-mode column mapping. One LLM call per import. Sees all distinct values
 * (up to a per-column cap) so it can detect mixed-content columns that need
 * to split into multiple destFields based on per-row value semantics.
 *
 * Caller (runProcess) is responsible for catching errors and falling back to
 * the simple mapColumns() flow when this throws.
 *
 * GDPR note: only call this for entities that explicitly opt in via
 * config.smartModeEnabled. Never enable for clients.
 */
export async function smartMapColumns(
  headers: string[],
  allRows: Record<string, string>[],
  config: EntityImportConfig,
): Promise<MappingResult> {
  const warnings: string[] = [];

  if (!process.env.ANTHROPIC_API_KEY) {
    warnings.push('ANTHROPIC_API_KEY assente: salto la mappatura smart.');
    return {
      mappings: headers.map((h) => ({ sourceColumn: h, destField: null, confidence: 0 })),
      warnings,
      usedLLM: false,
    };
  }

  const samples = collectDistinctSamples(allRows, headers);
  const rawMappings = await callClaudeSmartMapper(samples, config);
  const validated = validateSmartMappings(rawMappings, headers, config, warnings);

  return { mappings: validated, warnings, usedLLM: true };
}

function collectDistinctSamples(
  rows: Record<string, string>[],
  headers: string[],
): ColumnSample[] {
  const scan = rows.slice(0, PER_COLUMN_SAMPLE_SCAN);
  return headers.map((h) => {
    const seen = new Set<string>();
    for (const r of scan) {
      const raw = r[h];
      if (raw == null) continue;
      const v = String(raw).trim();
      if (!v) continue;
      seen.add(v.slice(0, PER_VALUE_CHAR_CAP));
    }
    const values = Array.from(seen).slice(0, PER_COLUMN_DISTINCT_LIMIT);
    return { header: h, values, distinctCount: seen.size };
  });
}

function buildSystemPrompt(config: EntityImportConfig): string {
  const fieldLines = Object.entries(config.llmFieldDescriptions)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');

  const aliasHints = Object.entries(config.dictionary)
    .map(([dest, aliases]) => {
      const sample = aliases.slice(0, 3).join(', ');
      return sample ? `  • ${dest}: ${sample}` : null;
    })
    .filter(Boolean)
    .join('\n');

  const hintExamples = config.smartHints?.examples
    .map((e) => `  • "${e.sourceColumnHint}": ${e.explanation}`)
    .join('\n');
  const hintsBlock = config.smartHints
    ? `\nKnown splits in this domain (${config.smartHints.description}):\n${hintExamples ?? ''}\n`
    : '';

  return `You are mapping spreadsheet columns from an Italian salon-software export to Lume's destination schema.

Domain: ${config.llmDomainHint}

Destination fields:
${fieldLines}

Italian header aliases per destination (fast-match hints):
${aliasHints}
${hintsBlock}
You will receive each source column with up to 20 distinct sample values from the file. For each source column, return one mapping entry. By default, set destField to a single target. Set destField to null if the column doesn't belong to any destination (loyalty points, internal IDs, addresses, etc.).

When you detect that one source column carries information for MULTIPLE destination fields based on the per-row value (e.g. a "Prezzo vendita" column that is sometimes a number and sometimes the literal text "Non in vendita"), include a smartTransform with ordered conditional rules. Rules are evaluated top-to-bottom; the first matching rule's assignments fire and the rest are skipped. End with matchType:"always" if a fallback is needed.

Smart transform guidelines:
- Use literal:true / literal:false for boolean signals derived from text presence (e.g. "Non in vendita" → isForRetail=false).
- Use parser "number" / "integer" for numeric coercion of the cell.
- Use parser "raw" together with literal:null to clear a destField.
- Only emit smartTransform when cell values clearly require a per-row branch — don't wrap simple 1:1 mappings in it.
- Outputs must list every destField the rules can write.
- Set destField (the primary field) to the most semantically central output (e.g. for a price/retail-flag split, set destField=sellPrice).

Confidence: 1.0 = certain, 0.6+ = likely, <0.6 = uncertain (will be dropped).
Never invent destFields not in the schema above.
Sample values are commercial data (no PII concerns for this entity) — use them freely to disambiguate.`;
}

function buildSmartMapperTool(config: EntityImportConfig) {
  const destEnum = [...config.destFields];
  return {
    name: 'submit_smart_mapping',
    description:
      'Submit one mapping per source column. For columns whose value semantics require splitting into multiple destFields based on cell content, include a smartTransform object with ordered conditional rules.',
    input_schema: {
      type: 'object' as const,
      properties: {
        mappings: {
          type: 'array' as const,
          items: {
            type: 'object' as const,
            properties: {
              sourceColumn: { type: 'string' as const },
              destField: {
                type: ['string', 'null'] as const,
                enum: [...destEnum, null],
              },
              confidence: { type: 'number' as const, minimum: 0, maximum: 1 },
              smartTransform: {
                type: 'object' as const,
                description:
                  'OPTIONAL. Include only when the cell value must split into multiple destFields by content.',
                properties: {
                  description: {
                    type: 'string' as const,
                    description: 'One-sentence Italian explanation shown to the salon owner.',
                  },
                  outputs: {
                    type: 'array' as const,
                    items: { type: 'string' as const, enum: destEnum },
                    minItems: 1,
                  },
                  rules: {
                    type: 'array' as const,
                    minItems: 1,
                    items: {
                      type: 'object' as const,
                      properties: {
                        condition: {
                          type: 'object' as const,
                          properties: {
                            matchType: {
                              type: 'string' as const,
                              enum: VALID_MATCH_TYPES,
                            },
                            values: { type: 'array' as const, items: { type: 'string' as const } },
                            pattern: { type: 'string' as const },
                            flags: { type: 'string' as const },
                          },
                          required: ['matchType'],
                          additionalProperties: false,
                        },
                        assignments: {
                          type: 'array' as const,
                          minItems: 1,
                          items: {
                            type: 'object' as const,
                            properties: {
                              destField: { type: 'string' as const, enum: destEnum },
                              parser: { type: 'string' as const, enum: VALID_PARSERS },
                              literal: {
                                description:
                                  'Optional literal value to write instead of the parsed cell. Accepts string, number, boolean, or null.',
                              },
                            },
                            required: ['destField', 'parser'],
                            additionalProperties: true,
                          },
                        },
                      },
                      required: ['condition', 'assignments'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['description', 'outputs', 'rules'],
                additionalProperties: false,
              },
            },
            required: ['sourceColumn', 'destField', 'confidence'],
            additionalProperties: false,
          },
        },
      },
      required: ['mappings'],
      additionalProperties: false,
    },
  };
}

async function callClaudeSmartMapper(
  samples: ColumnSample[],
  config: EntityImportConfig,
): Promise<unknown[]> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userBlocks = samples.map((s) => {
    const valuesStr = s.values.length
      ? s.values.map((v) => `  - ${v}`).join('\n')
      : '  (no non-empty values)';
    const tail = s.distinctCount > s.values.length ? ` (${s.distinctCount} distinct, sampled)` : ` (${s.distinctCount} distinct)`;
    return `Column: "${s.header}"${tail}\nSample values:\n${valuesStr}`;
  });

  const userPrompt = `Map these columns. For each, I list up to 20 distinct sample values from the file.\n\n${userBlocks.join('\n\n')}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    // Cache the system prompt — it's identical across imports of the same entity, so
    // repeat imports of the same entity hit the cache and skip the prefill cost.
    system: [
      {
        type: 'text',
        text: buildSystemPrompt(config),
        cache_control: { type: 'ephemeral' },
      },
    ],
    tools: [buildSmartMapperTool(config)],
    tool_choice: { type: 'tool', name: 'submit_smart_mapping' },
    messages: [{ role: 'user', content: userPrompt }],
  });

  const usage = response.usage;
  console.log(
    `[smartMapper ${config.entity}] usage in=${usage.input_tokens} out=${usage.output_tokens} cache_read=${usage.cache_read_input_tokens ?? 0} cache_write=${usage.cache_creation_input_tokens ?? 0}`,
  );

  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Smart mapper LLM did not return a tool_use response');
  }

  const input = toolUse.input as { mappings?: unknown };
  if (!input || !Array.isArray(input.mappings)) {
    throw new Error('Smart mapper response missing mappings array');
  }
  return input.mappings as unknown[];
}

/**
 * Validates Claude's tool output against the entity schema. Per-mapping rejection
 * drops the smartTransform (keeps the simple destField) and pushes a warning.
 * Never throws — always returns a usable mapping list.
 */
function validateSmartMappings(
  raw: unknown[],
  headers: string[],
  config: EntityImportConfig,
  warnings: string[],
): ColumnMapping[] {
  const destFieldSet = new Set<string>(config.destFields);
  const byHeader = new Map<string, ColumnMapping>();

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const m = item as Record<string, unknown>;
    const sourceColumn = typeof m.sourceColumn === 'string' ? m.sourceColumn : null;
    if (!sourceColumn) continue;

    const destField =
      typeof m.destField === 'string' && destFieldSet.has(m.destField)
        ? m.destField
        : m.destField === null
          ? null
          : null;
    const confidence = typeof m.confidence === 'number' ? Math.max(0, Math.min(1, m.confidence)) : 0;

    const validatedTransform = validateSmartTransform(m.smartTransform, destFieldSet, sourceColumn, warnings);

    byHeader.set(sourceColumn, {
      sourceColumn,
      destField,
      confidence: destField === null && !validatedTransform ? 0 : confidence,
      ...(validatedTransform ? { smartTransform: validatedTransform } : {}),
    });
  }

  // Ensure every header has an entry (in case Claude omitted one).
  return headers.map(
    (h) =>
      byHeader.get(h) ?? {
        sourceColumn: h,
        destField: null,
        confidence: 0,
      },
  );
}

function validateSmartTransform(
  raw: unknown,
  destFieldSet: Set<string>,
  sourceColumn: string,
  warnings: string[],
): SmartTransform | null {
  if (!raw || typeof raw !== 'object') return null;
  const t = raw as Record<string, unknown>;

  const description = typeof t.description === 'string' ? t.description : '';
  const outputsRaw = Array.isArray(t.outputs) ? (t.outputs as unknown[]) : [];
  const outputs = outputsRaw.filter((o): o is string => typeof o === 'string' && destFieldSet.has(o));

  const rulesRaw = Array.isArray(t.rules) ? (t.rules as unknown[]) : [];
  const rules: SmartRule[] = [];

  for (const r of rulesRaw) {
    if (!r || typeof r !== 'object') continue;
    const ruleObj = r as Record<string, unknown>;
    const condition = validateCondition(ruleObj.condition);
    if (!condition) continue;

    const assignmentsRaw = Array.isArray(ruleObj.assignments) ? (ruleObj.assignments as unknown[]) : [];
    const assignments: SmartAssignment[] = [];
    for (const a of assignmentsRaw) {
      if (!a || typeof a !== 'object') continue;
      const aObj = a as Record<string, unknown>;
      const destField = typeof aObj.destField === 'string' ? aObj.destField : null;
      if (!destField || !destFieldSet.has(destField)) continue;
      const parser = typeof aObj.parser === 'string' ? (aObj.parser as ValueParser) : null;
      if (!parser || !VALID_PARSERS.includes(parser)) continue;
      const assignment: SmartAssignment = { destField, parser };
      if (Object.prototype.hasOwnProperty.call(aObj, 'literal')) {
        const lit = aObj.literal;
        if (lit === null || ['string', 'number', 'boolean'].includes(typeof lit)) {
          assignment.literal = lit as string | number | boolean | null;
        }
      }
      assignments.push(assignment);
    }
    if (assignments.length === 0) continue;
    rules.push({ condition, assignments });
  }

  if (rules.length === 0 || outputs.length === 0) {
    warnings.push(
      `smartTransform per "${sourceColumn}" scartato (regole non valide); verrà usata la mappatura semplice.`,
    );
    return null;
  }

  return { description, outputs, rules };
}

function validateCondition(raw: unknown): SmartCondition | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;
  const matchType = c.matchType;
  if (typeof matchType !== 'string') return null;
  if (!VALID_MATCH_TYPES.includes(matchType as SmartCondition['matchType'])) return null;

  const cond: SmartCondition = { matchType: matchType as SmartCondition['matchType'] };
  if (Array.isArray(c.values)) {
    cond.values = c.values.filter((v): v is string => typeof v === 'string');
  }
  if (typeof c.pattern === 'string') {
    // Reject patterns that don't compile.
    try {
      new RegExp(c.pattern, typeof c.flags === 'string' ? c.flags : '');
      cond.pattern = c.pattern;
      if (typeof c.flags === 'string') cond.flags = c.flags;
    } catch {
      return null;
    }
  }
  return cond;
}
