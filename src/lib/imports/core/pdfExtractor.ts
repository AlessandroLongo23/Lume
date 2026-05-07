import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import type { EntityImportConfig } from '../entities/types';
import type { ParsedFile } from './parseFile';

/** Anthropic accepts PDFs up to 32 MB / 100 pages on the messages API. */
const MAX_PDF_SIZE_BYTES = 32 * 1024 * 1024;

/**
 * Extracts a tabular `{ headers, rows }` shape from a PDF using Claude's
 * document content support. The PDF is sent as a single base64-encoded
 * `document` content block; the model returns the table via tool use, which
 * gives us a strict JSON schema instead of free-form prose to parse.
 *
 * Stays at the same shape as `parseFile()` so the rest of the pipeline
 * (column mapping, transform, dedup, insert) doesn't care which kind of
 * source file came in.
 *
 * Pass `config` when the entity is already known (manual single-file import)
 * so the prompt can hint at the expected domain. Omit it during onboarding
 * classification — the result is then cached and reused by the entity-aware
 * `runProcessImport` step without paying for a second extraction.
 *
 * Throws (caller marks the job `failed` or routes to concierge):
 *   - PDF too large for the API
 *   - ANTHROPIC_API_KEY missing
 *   - Model couldn't find a table (`noTableFound: true`)
 *   - Model didn't return a tool_use response
 */
export async function extractPdfTable(
  buffer: ArrayBuffer,
  config?: EntityImportConfig,
): Promise<ParsedFile> {
  if (buffer.byteLength > MAX_PDF_SIZE_BYTES) {
    throw new Error('PDF troppo grande per l\'estrazione automatica (max 32 MB).');
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY assente: estrazione PDF non disponibile.');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const base64 = Buffer.from(buffer).toString('base64');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    system: buildSystemPrompt(config),
    tools: [EXTRACTION_TOOL],
    tool_choice: { type: 'tool', name: 'submit_extracted_table' },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64,
            },
          },
          {
            type: 'text',
            text: 'Estrai la tabella di dati da questo PDF. Restituisci headers + rows come definito dallo schema.',
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Estrazione PDF: risposta del modello non valida.');
  }

  const input = toolUse.input as ExtractionToolInput;
  if (input.noTableFound) {
    throw new Error(
      `Nessuna tabella riconoscibile nel PDF${input.noTableReason ? `: ${input.noTableReason}` : '.'}`,
    );
  }
  if (!Array.isArray(input.headers) || !Array.isArray(input.rows)) {
    throw new Error('Estrazione PDF: schema risposta inatteso.');
  }

  return toParsedFile(input.headers, input.rows);
}

interface ExtractionToolInput {
  headers?: string[];
  rows?: string[][];
  noTableFound?: boolean;
  noTableReason?: string;
}

const EXTRACTION_TOOL = {
  name: 'submit_extracted_table',
  description:
    'Submit the table extracted from the PDF. Provide the column headers and the data rows aligned positionally to those headers.',
  input_schema: {
    type: 'object' as const,
    properties: {
      headers: {
        type: 'array' as const,
        items: { type: 'string' as const },
        description: 'Column headers as written in the PDF.',
      },
      rows: {
        type: 'array' as const,
        items: {
          type: 'array' as const,
          items: { type: 'string' as const },
        },
        description: 'Data rows. Each row is an array of cell values aligned to headers.',
      },
      noTableFound: {
        type: 'boolean' as const,
        description: 'Set to true when the PDF contains no recognizable tabular data.',
      },
      noTableReason: {
        type: 'string' as const,
        description: 'Brief reason if noTableFound is true.',
      },
    },
    required: ['headers', 'rows'],
    additionalProperties: false,
  },
};

function buildSystemPrompt(config?: EntityImportConfig): string {
  const domainLine = config
    ? `Domain: ${config.llmDomainHint}\nThe salon is migrating to a new tool and exported their existing ${config.italianLabel.toLowerCase()} as a PDF.`
    : `The salon is migrating to a new tool and exported some of their data as a PDF. The file may contain clients, services, products, operators, fiches (closed appointments), or any other salon data.`;

  return `You are extracting tabular data from an Italian salon-software PDF report.

${domainLine} Find the tabular data (typically a table or repeating list of records) and return it as headers + rows.

Rules:
- Use the column header text exactly as written in the PDF (Italian, English, abbreviations — anything). The salon-side mapping step normalizes them later.
- Each row is an array of strings positionally aligned to headers. Empty cells → empty string. Do NOT omit cells.
- If headers repeat across pages (each page reprints the header row), include them once.
- Skip page numbers, footers, "Pagina N di M", logos, and totals/summary rows that don't fit the row schema.
- Keep numeric and date values exactly as written — the downstream pipeline parses them. Do not reformat.
- Do not invent data. If a cell is unreadable, leave it blank.
- If the PDF has no recognizable table (cover page, license document, scanned image of a logo, etc.), set noTableFound=true with a brief reason in noTableReason — do not hallucinate a table.
- Sample values may contain PII or commercial data — extract literally, do not summarize, transform, or echo them outside the tool output.`;
}

function toParsedFile(headers: string[], rows: string[][]): ParsedFile {
  // Trim + dedup empty headers (PDFs sometimes include a phantom trailing column)
  const cleanHeaders = headers.map((h) => (h ?? '').trim()).filter((h) => h.length > 0);
  const headerIndex = new Map<string, number>();
  cleanHeaders.forEach((h, i) => headerIndex.set(h, i));

  const objectRows: Record<string, string>[] = [];
  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    const obj: Record<string, string> = {};
    for (const [h, i] of headerIndex) {
      const v = row[i];
      obj[h] = v == null ? '' : String(v);
    }
    // Skip rows that are entirely empty after extraction
    if (Object.values(obj).some((v) => v.trim().length > 0)) {
      objectRows.push(obj);
    }
  }
  return { headers: cleanHeaders, rows: objectRows };
}
