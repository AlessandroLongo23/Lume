import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import type { ColumnMapping, EntityImportConfig, HeaderDictionary } from '../entities/types';

export interface MappingResult {
  mappings: ColumnMapping[];
  warnings: string[];
  usedLLM: boolean;
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/[._\-:/\\]+/g, ' ').replace(/\s+/g, ' ');
}

/**
 * Looks up a source column header in the dictionary. Returns the destination
 * field if there's an exact-or-near match, null otherwise.
 */
function lookupHeader(sourceHeader: string, dictionary: HeaderDictionary): string | null {
  const normalized = normalize(sourceHeader);
  for (const [dest, aliases] of Object.entries(dictionary)) {
    if (aliases.some((alias) => alias === normalized)) return dest;
  }
  // Fuzzier pass: strip non-alphanumerics and try contains
  const compact = normalized.replace(/\s+/g, '');
  for (const [dest, aliases] of Object.entries(dictionary)) {
    if (aliases.some((alias) => alias.replace(/\s+/g, '') === compact)) return dest;
  }
  return null;
}

/**
 * Maps a CSV/XLSX's source columns to the entity's destination fields.
 *
 * Strategy:
 *   1. Fast path — try the entity's deterministic Italian dictionary on every
 *      header. If `config.hasRequiredCoverage` is satisfied, return without
 *      ever calling the LLM.
 *   2. LLM fallback — for unmapped or ambiguous headers, send (header + 5
 *      sample values per column) to Claude with a JSON-schema-constrained
 *      tool call. PII exposure is bounded to 5 sample cells per column.
 */
export async function mapColumns(
  headers: string[],
  sampleRows: Record<string, string>[],
  config: EntityImportConfig,
): Promise<MappingResult> {
  const warnings: string[] = [];

  // Step 1 — dictionary fast path
  const dictMappings: ColumnMapping[] = headers.map((h) => {
    const dest = lookupHeader(h, config.dictionary);
    return { sourceColumn: h, destField: dest, confidence: dest ? 1 : 0 };
  });

  if (config.hasRequiredCoverage(dictMappings)) {
    return { mappings: dictMappings, warnings, usedLLM: false };
  }

  // Step 2 — LLM fallback for unmapped columns
  const unmapped = dictMappings.filter((m) => !m.destField).map((m) => m.sourceColumn);
  if (unmapped.length === 0) {
    warnings.push('Nessuna colonna obbligatoria identificata e nessun header rimanente da analizzare.');
    return { mappings: dictMappings, warnings, usedLLM: false };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    warnings.push('ANTHROPIC_API_KEY assente: salto la mappatura LLM.');
    return { mappings: dictMappings, warnings, usedLLM: false };
  }

  const samples: Record<string, string[]> = {};
  for (const h of unmapped) {
    samples[h] = sampleRows
      .slice(0, 5)
      .map((r) => (r[h] ?? '').toString().slice(0, 80))
      .filter((v) => v.length > 0);
  }

  const llmMappings = await callClaudeMapper(unmapped, samples, config);

  // Merge LLM results back into the full mappings array
  const merged = dictMappings.map((m) => {
    if (m.destField) return m;
    const found = llmMappings.find((x) => x.sourceColumn === m.sourceColumn);
    return found ?? m;
  });

  if (!config.hasRequiredCoverage(merged)) {
    warnings.push(config.insufficientMappingReason);
  }

  return { mappings: merged, warnings, usedLLM: true };
}

function buildMapperTool(config: EntityImportConfig) {
  return {
    name: 'submit_column_mapping',
    description:
      'Submit the column mapping decisions. For each source column produce one entry. Set destField to null if there is no good match.',
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
                enum: [...config.destFields, null],
              },
              confidence: { type: 'number' as const, minimum: 0, maximum: 1 },
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

function buildSystemPrompt(config: EntityImportConfig): string {
  const fieldLines = Object.entries(config.llmFieldDescriptions)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');
  // Provide a few aliases per field as concrete Italian-header examples
  const aliasHints = Object.entries(config.dictionary)
    .map(([dest, aliases]) => {
      const sample = aliases.slice(0, 3).join(', ');
      return sample ? `  • ${dest}: ${sample}` : null;
    })
    .filter(Boolean)
    .join('\n');

  return `You are mapping spreadsheet columns from an Italian salon-software export to our destination schema.

Domain: ${config.llmDomainHint}

Destination fields:
${fieldLines}

Rules:
- Map each source column to AT MOST one destination field
- Use null for columns that don't belong to any destination (loyalty points, internal IDs, addresses, etc.)
- Confidence: 1.0 = certain, 0.6+ = likely, <0.6 = uncertain (will not be used)
- Italian headers are common. Examples per destination:
${aliasHints}
- Sample values may contain PII or commercial data — use only to disambiguate column meaning, do not echo or transform them`;
}

async function callClaudeMapper(
  unmappedHeaders: string[],
  samples: Record<string, string[]>,
  config: EntityImportConfig,
): Promise<ColumnMapping[]> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userBlocks = unmappedHeaders.map((h) => {
    const sampleStr = (samples[h] ?? []).map((s) => `  - ${s}`).join('\n') || '  (no sample values)';
    return `Column: "${h}"\nSample values:\n${sampleStr}`;
  });

  const userPrompt = `Map these unrecognized columns to destination fields:\n\n${userBlocks.join('\n\n')}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: buildSystemPrompt(config),
    tools: [buildMapperTool(config)],
    tool_choice: { type: 'tool', name: 'submit_column_mapping' },
    messages: [{ role: 'user', content: userPrompt }],
  });

  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('LLM did not return a tool_use response');
  }

  const input = toolUse.input as { mappings: ColumnMapping[] };
  if (!input || !Array.isArray(input.mappings)) {
    throw new Error('LLM response missing mappings array');
  }

  return input.mappings;
}
