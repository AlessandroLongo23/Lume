/**
 * Sanity-check the import transform pipeline against a real CSV without
 * touching the dev server, Inngest, or Supabase.
 *
 *   npx tsx scripts/test-import-transform.ts <path/to/file.csv>
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Papa from 'papaparse';
import { transformClientRow as transformRow } from '../src/lib/imports/entities/clients/schema';
import { CLIENT_DICTIONARY, type ClientDestField } from '../src/lib/imports/entities/clients/dictionary';

function lookupHeader(h: string): ClientDestField | null {
  const norm = h.trim().toLowerCase().replace(/[._\-:/\\]+/g, ' ').replace(/\s+/g, ' ');
  for (const [dest, aliases] of Object.entries(CLIENT_DICTIONARY)) {
    if (aliases.some((a) => a === norm)) return dest as ClientDestField;
  }
  const compact = norm.replace(/\s+/g, '');
  for (const [dest, aliases] of Object.entries(CLIENT_DICTIONARY)) {
    if (aliases.some((a) => a.replace(/\s+/g, '') === compact)) return dest as ClientDestField;
  }
  return null;
}

const file = process.argv[2];
if (!file) {
  console.error('usage: tsx scripts/test-import-transform.ts <file.csv>');
  process.exit(1);
}

const text = readFileSync(resolve(file), 'utf8');
const parsed = Papa.parse<Record<string, string>>(text, {
  header: true,
  skipEmptyLines: 'greedy',
  dynamicTyping: false,
  transformHeader: (h) => h.trim(),
});

const headers = (parsed.meta.fields ?? []).filter(Boolean);
const rows = parsed.data;

console.log(`File: ${file}`);
console.log(`Rows: ${rows.length}`);
console.log(`Headers: ${headers.join(' · ')}\n`);

const mappings = headers.map((h) => {
  const dest = lookupHeader(h);
  return {
    sourceColumn: h,
    destField: dest as ClientDestField | null,
    confidence: dest ? 1 : 0,
  };
});

console.log('Mapping (dictionary fast-path):');
for (const m of mappings) {
  console.log(`  ${m.sourceColumn.padEnd(20)} → ${m.destField ?? '(ignore)'}`);
}
console.log();

let ok = 0;
const reasons = new Map<string, number>();
const sampleByReason = new Map<string, Record<string, string>>();

// Diagnostic: track rows that have a phone in the source but get rejected
let phoneRejected = 0;
const phoneRejectedSamples: string[] = [];

for (let i = 0; i < rows.length; i++) {
  const r = transformRow(rows[i], mappings, i);
  if (r.ok) {
    ok++;
  } else {
    reasons.set(r.reason, (reasons.get(r.reason) ?? 0) + 1);
    if (!sampleByReason.has(r.reason)) sampleByReason.set(r.reason, r.rawValues);

    if (r.reason.includes('contatto mancante')) {
      const cell = (rows[i]['Cellulare'] ?? '').trim();
      const tel = (rows[i]['Telefono'] ?? '').trim();
      if (cell || tel) {
        phoneRejected++;
        if (phoneRejectedSamples.length < 10) {
          phoneRejectedSamples.push(`row ${i}: Cellulare=[${cell}] Telefono=[${tel}]`);
        }
      }
    }
  }
}

console.log(`Result:`);
console.log(`  OK:     ${ok}`);
console.log(`  Failed: ${rows.length - ok}`);
console.log();
console.log(`Failure breakdown:`);
const sortedReasons = [...reasons.entries()].sort((a, b) => b[1] - a[1]);
for (const [reason, count] of sortedReasons) {
  console.log(`  ${String(count).padStart(5)} × ${reason}`);
}
console.log();
console.log(`Diagnostic — rejected as 'no contact' but had phone in source: ${phoneRejected}`);
for (const s of phoneRejectedSamples) console.log(`  ${s}`);
console.log();

console.log(`Sample failure for each reason:`);
for (const [reason, sample] of sampleByReason) {
  const compact = Object.entries(sample)
    .filter(([, v]) => v && String(v).trim())
    .map(([k, v]) => `${k}=${String(v).slice(0, 30)}`)
    .join(' · ');
  console.log(`  ${reason}\n    ${compact || '(all empty)'}\n`);
}
