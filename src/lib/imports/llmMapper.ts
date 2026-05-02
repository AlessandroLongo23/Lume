import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { ALL_CLIENT_DEST_FIELDS, lookupHeader, type ClientDestField } from './clientHeaderDictionary';

export interface ColumnMapping {
  sourceColumn: string;
  destField: ClientDestField | null;
  confidence: number; // 0..1
}

export interface MappingResult {
  mappings: ColumnMapping[];
  warnings: string[];
  usedLLM: boolean;
}

const REQUIRED_FIELDS = new Set<ClientDestField>(['firstName', 'lastName']);
const FULLNAME_SATISFIES = new Set<ClientDestField>(['fullName']);

/**
 * Maps a CSV/XLSX's source columns to our Client destination fields.
 *
 * Strategy:
 *   1. Fast path — try the deterministic Italian dictionary on every header.
 *      If every required field is covered, return without ever calling the LLM.
 *   2. LLM fallback — for unmapped or ambiguous headers, send (header + 5
 *      sample values per column) to Claude with a JSON-schema-constrained
 *      tool call. PII exposure is bounded to 5 sample cells per column.
 */
export async function mapClientColumns(
  headers: string[],
  sampleRows: Record<string, string>[],
): Promise<MappingResult> {
  const warnings: string[] = [];

  // Step 1 — dictionary fast path
  const dictMappings: ColumnMapping[] = headers.map((h) => {
    const dest = lookupHeader(h);
    return { sourceColumn: h, destField: dest, confidence: dest ? 1 : 0 };
  });

  if (hasRequiredCoverage(dictMappings)) {
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

  const llmMappings = await callClaudeMapper(unmapped, samples);

  // Merge LLM results back into the full mappings array
  const merged = dictMappings.map((m) => {
    if (m.destField) return m;
    const found = llmMappings.find((x) => x.sourceColumn === m.sourceColumn);
    return found ?? m;
  });

  if (!hasRequiredCoverage(merged)) {
    warnings.push('Impossibile identificare nome e cognome con sufficiente certezza.');
  }

  return { mappings: merged, warnings, usedLLM: true };
}

function hasRequiredCoverage(mappings: ColumnMapping[]): boolean {
  const mapped = new Set(mappings.filter((m) => m.confidence >= 0.6).map((m) => m.destField));
  if (mapped.has('firstName') && mapped.has('lastName')) return true;
  // fullName satisfies both first/last via splitting
  for (const f of FULLNAME_SATISFIES) if (mapped.has(f)) return true;
  return Array.from(REQUIRED_FIELDS).every((r) => mapped.has(r));
}

const MAPPER_TOOL = {
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
              enum: [...ALL_CLIENT_DEST_FIELDS, null],
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

const SYSTEM_PROMPT = `You are mapping spreadsheet columns from an Italian salon-software export to our destination schema.

Destination fields:
- firstName: customer's first/given name
- lastName: customer's last/family name
- fullName: combined name in a single column (will be split downstream)
- email
- phoneRaw: a single phone column with prefix and number combined
- phonePrefix: international dialing code only
- phoneNumber: phone digits without prefix
- gender: M/F or Italian equivalents (Maschio/Femmina) or honorifics (Sig./Sig.ra)
- birthDate: any date column representing birth date
- isTourist: boolean indicating tourist/non-resident customer
- note: free-text notes / observations / preferences

Rules:
- Map each source column to AT MOST one destination field
- Use null for columns that don't belong to any destination (loyalty points, internal IDs, addresses, etc.)
- Confidence: 1.0 = certain, 0.6+ = likely, <0.6 = uncertain (will not be used)
- Italian headers are common: Nome, Cognome, Telefono, Cellulare, Email, Data di nascita, Sesso, Note
- Sample values may contain PII — use only to disambiguate column meaning, do not echo or transform them`;

async function callClaudeMapper(
  unmappedHeaders: string[],
  samples: Record<string, string[]>,
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
    system: SYSTEM_PROMPT,
    tools: [MAPPER_TOOL],
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
