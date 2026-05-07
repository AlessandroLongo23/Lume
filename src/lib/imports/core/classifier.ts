import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import type { ImportEntity } from '../entities/types';

/** Special bucket: classifier couldn't decide → file goes to concierge. */
export type ClassifierEntity = ImportEntity | 'unknown';

export interface ClassificationResult {
  entity: ClassifierEntity;
  confidence: number;
  /** One-line Italian explanation surfaced in the review UI. */
  reason: string;
}

const CLASSIFIER_SYSTEM_PROMPT = `Sei un classificatore di file esportati da gestionali per saloni italiani (parrucchieri, barbieri, estetiste). Il salone sta migrando a Lume.

Decidi a quale entità appartiene questo file (o foglio, se è un foglio di un Excel multi-foglio). Le entità possibili sono:

- clients              (anagrafica clienti — nomi, telefoni, email)
- clientCategories     (gruppi di clienti, es. "VIP", "Iscritti", "Privati")
- operators            (staff: parrucchieri, barbieri, estetiste)
- services             (servizi/prestazioni con prezzo e/o durata)
- serviceCategories    (gruppi/reparti di servizi)
- products             (prodotti retail/professional con prezzo o quantità)
- productCategories    (categorie merceologiche)
- manufacturers        (marchi/produttori prodotti)
- suppliers            (fornitori prodotti)
- fiches               (scontrini / appuntamenti chiusi con righe servizi/prodotti/pagamenti)
- unknown              (qualsiasi altra cosa: contabilità, log, immagini, file vuoti)

Regole:
- Esamina SIA gli header SIA i valori di esempio, non solo gli header.
- PII (nome, cognome, telefono, email) senza prezzi né durate → clients.
- operatore + servizio + prezzo + data → fiches.
- "Durata" o "minuti" presenti → services o fiches.
- Prezzi negativi o metodi di pagamento → fiches.
- Un foglio "Categorie" dentro a un workbook che contiene anche "Clienti" o "Prodotti" → clientCategories o productCategories a seconda del contesto dei fogli vicini.
- Confidenza < 0.5 → restituisci "unknown".
- NON fare echo, summary, o trasformazione dei valori di esempio: usali solo per decidere. Trattali come PII.

La 'reason' che restituisci viene mostrata al proprietario del salone — usa una frase italiana di una sola riga, naturale e chiara.`;

const CLASSIFIER_TOOL = {
  name: 'submit_classification',
  description: 'Submit la decisione di classificazione per il file/foglio dato.',
  input_schema: {
    type: 'object' as const,
    properties: {
      entity: {
        type: 'string' as const,
        enum: [
          'clients',
          'clientCategories',
          'operators',
          'services',
          'serviceCategories',
          'products',
          'productCategories',
          'manufacturers',
          'suppliers',
          'fiches',
          'unknown',
        ],
      },
      confidence: { type: 'number' as const, minimum: 0, maximum: 1 },
      reason: { type: 'string' as const, maxLength: 200 },
    },
    required: ['entity', 'confidence', 'reason'],
    additionalProperties: false,
  },
};

export interface ClassifyInput {
  filename: string;
  sheetName?: string | null;
  /** Other sheet names in the same workbook — useful context for ambiguous tabs. */
  siblingSheets?: string[];
  headers: string[];
  /** First ~10 rows from the file. */
  sampleRows: Record<string, string>[];
}

/**
 * Sends a file (or sheet) signature to Claude and returns its best guess of
 * which Lume entity it represents. Bounds PII exposure to ≤ headers + 10 rows.
 *
 * Returns `entity: 'unknown'` on low confidence — the orchestrator routes those
 * children to the concierge email path without blocking siblings.
 */
export async function classifyFileOrSheet(input: ClassifyInput): Promise<ClassificationResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      entity: 'unknown',
      confidence: 0,
      reason: 'Classificazione automatica disabilitata (API key mancante).',
    };
  }
  if (input.headers.length === 0 || input.sampleRows.length === 0) {
    return { entity: 'unknown', confidence: 0, reason: 'Il file è vuoto o non contiene dati.' };
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const sampleBlock = input.sampleRows
    .slice(0, 10)
    .map((row, i) => {
      const cells = input.headers.map((h) => `${h}=${truncate(row[h] ?? '', 60)}`).join(' | ');
      return `  ${i + 1}. ${cells}`;
    })
    .join('\n');

  const userPrompt = [
    `File: ${input.filename}${input.sheetName ? ` (foglio "${input.sheetName}")` : ''}`,
    input.siblingSheets && input.siblingSheets.length > 0
      ? `Altri fogli nel workbook: ${input.siblingSheets.join(', ')}`
      : null,
    `Headers: ${input.headers.join(' | ')}`,
    `Prime ${Math.min(input.sampleRows.length, 10)} righe:`,
    sampleBlock,
  ]
    .filter(Boolean)
    .join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    system: CLASSIFIER_SYSTEM_PROMPT,
    tools: [CLASSIFIER_TOOL],
    tool_choice: { type: 'tool', name: 'submit_classification' },
    messages: [{ role: 'user', content: userPrompt }],
  });

  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Classifier did not return a tool_use response');
  }
  const out = toolUse.input as ClassificationResult;
  if (typeof out.confidence !== 'number' || !out.entity || !out.reason) {
    throw new Error('Classifier response missing required fields');
  }
  return out;
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}
