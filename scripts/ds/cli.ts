/**
 * Design-system checks for Lume. Reference: scripts/ds/README.md.
 *
 *   npm run ds:check                 gates: exit 2 on violations the baseline does not know
 *   npm run ds:check -- --all        also list the known ones
 *   npm run ds:check -- --rule raw-color
 *   npm run ds:check -- --all --file src/lib/components/shell/   (one path prefix; never writes the baseline)
 *   npm run ds:baseline              record today's violations as known
 *   npm run ds:report                metrics and gate totals, for a person
 *   npm run ds:report -- --json      the same as JSON
 */
import fs from 'node:fs';
import path from 'node:path';
import { type Context, type Finding, GATES, runGates } from './gates';
import { adoption, escapeHatches, handRolled, library, overrides, promotionCandidates, tokenCoverage, tokenLayer } from './metrics';
import { type Source, ROOT, lineText, loadComponents, loadSources, loadTokens } from './scan';

const BASELINE = path.join(ROOT, '.ds-baseline.json');
const LIST_LIMIT = 50;

interface BaselineEntry {
  rule: string;
  value: string;
  /** The trimmed source line. With rule and value, it identifies the violation. */
  source: string;
  /** Where it was when recorded; informational, not part of the match. */
  file: string;
  count: number;
}

interface Baseline {
  about: string;
  total: number;
  findings: BaselineEntry[];
}

const args = process.argv.slice(2);
const mode = args[0] ?? 'check';
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? null : args[i + 1] ?? null;
};

function context(): Context {
  const sources = loadSources();
  return {
    sources,
    tokens: loadTokens(sources),
    components: loadComponents(sources),
    known: new Set(sources.map((src) => src.file)),
  };
}

function sourceLine(byFile: Map<string, Source>, f: Finding): string {
  const src = byFile.get(f.file);
  return src ? lineText(src, f.line).trim().replace(/\s+/g, ' ') : '';
}

const keyOf = (rule: string, value: string, source: string) => `${rule}\u0000${value}\u0000${source}`;

function readBaseline(): Baseline | null {
  if (!fs.existsSync(BASELINE)) return null;
  return JSON.parse(fs.readFileSync(BASELINE, 'utf8')) as Baseline;
}

function writeBaseline(findings: Finding[], byFile: Map<string, Source>) {
  const entries = new Map<string, BaselineEntry>();
  for (const f of findings) {
    const source = sourceLine(byFile, f);
    const key = keyOf(f.rule, f.value, source);
    const entry = entries.get(key);
    if (entry) entry.count++;
    else entries.set(key, { rule: f.rule, value: f.value, source, file: f.file, count: 1 });
  }
  const sorted = [...entries.values()].sort((a, b) => a.file.localeCompare(b.file) || a.rule.localeCompare(b.rule) || a.value.localeCompare(b.value));
  const baseline: Baseline = {
    about: 'Design-system violations known when recorded. `npm run ds:check` fails only on others. Written by `npm run ds:baseline`; lowered automatically when a check passes with fewer. A violation is matched by rule, value and source line, never by file or line number.',
    total: findings.length,
    findings: sorted,
  };
  fs.writeFileSync(BASELINE, JSON.stringify(baseline, null, 2) + '\n');
}

/** Splits findings into the ones the baseline knows and the new ones. */
function compare(findings: Finding[], baseline: Baseline | null, byFile: Map<string, Source>) {
  const budget = new Map<string, number>();
  for (const e of baseline?.findings ?? []) budget.set(keyOf(e.rule, e.value, e.source), (budget.get(keyOf(e.rule, e.value, e.source)) ?? 0) + e.count);
  const known: Finding[] = [];
  const fresh: Finding[] = [];
  for (const f of findings) {
    const key = keyOf(f.rule, f.value, sourceLine(byFile, f));
    const left = budget.get(key) ?? 0;
    if (left > 0) {
      budget.set(key, left - 1);
      known.push(f);
    } else {
      fresh.push(f);
    }
  }
  return { known, fresh };
}

const format = (f: Finding) => `${f.file}:${f.line}  ${f.rule}  ${f.value}  (${f.hint})`;
const n = (value: number) => value.toLocaleString('en-US');
const p = (value: number | null) => (value === null ? '–' : `${value.toFixed(1)}%`);
const pad = (text: string | number, width: number) => String(text).padEnd(width);
const padStart = (text: string | number, width: number) => String(text).padStart(width);

function perRule(known: Finding[], fresh: Finding[]) {
  return GATES.map((rule) => ({
    rule,
    known: known.filter((f) => f.rule === rule).length,
    new: fresh.filter((f) => f.rule === rule).length,
  }));
}

// ─── check ─────────────────────────────────────────────────────────────────

function check() {
  const ctx = context();
  const byFile = new Map(ctx.sources.map((src) => [src.file, src]));
  const only = option('rule');
  const file = option('file');
  const findings = runGates(ctx).filter((f) => (!only || f.rule === only) && (!file || f.file.startsWith(file)));

  if (flag('update-baseline') || mode === 'baseline') {
    writeBaseline(findings, byFile);
    console.log(`ds: baseline recorded, ${n(findings.length)} known violations in ${path.relative(ROOT, BASELINE)}`);
    return;
  }

  const baseline = readBaseline();
  const { known, fresh } = compare(findings, baseline, byFile);

  if (flag('json')) {
    console.log(JSON.stringify({ known: known.length, new: fresh, rules: perRule(known, fresh) }, null, 2));
  } else {
    const shown = flag('all') ? findings : fresh;
    for (const f of shown.slice(0, LIST_LIMIT)) console.log(format(f));
    if (shown.length > LIST_LIMIT) console.log(`… ${n(shown.length - LIST_LIMIT)} more (narrow with --rule <name>)`);
    if (!baseline) console.log('ds: no baseline yet; run `npm run ds:baseline` to record the current state as known');
    const summary = perRule(known, fresh).filter((r) => r.known || r.new).map((r) => `${r.rule} ${r.known}${r.new ? `+${r.new}` : ''}`).join(', ');
    console.log(fresh.length
      ? `ds: ${n(fresh.length)} new violation${fresh.length === 1 ? '' : 's'} (${n(known.length)} known). ${summary}`
      : `ds: no new violations (${n(known.length)} known). ${summary}`);
  }

  if (fresh.length) {
    process.exitCode = 2;
    return;
  }
  // Fixed violations leave the baseline on the next passing run, so they cannot come back unnoticed.
  if (baseline && !only && !file && findings.length < baseline.total) {
    writeBaseline(findings, byFile);
    if (!flag('json')) console.log(`ds: baseline lowered from ${n(baseline.total)} to ${n(findings.length)}`);
  }
}

// ─── report ────────────────────────────────────────────────────────────────

function report() {
  const ctx = context();
  const byFile = new Map(ctx.sources.map((src) => [src.file, src]));
  const findings = runGates(ctx);
  const baseline = readBaseline();
  const { known, fresh } = compare(findings, baseline, byFile);

  const data = {
    date: new Date().toISOString().slice(0, 10),
    files: Object.fromEntries(['app', 'ds', 'story', 'exempt', 'token'].map((kind) => [kind, ctx.sources.filter((s) => s.kind === kind).length])),
    adoption: adoption(ctx, findings),
    tokens: tokenCoverage(ctx, findings),
    gates: perRule(known, fresh),
    library: library(ctx),
    overrides: overrides(ctx),
    handRolled: handRolled(ctx),
    promotionCandidates: promotionCandidates(ctx),
    tokenLayer: tokenLayer(ctx, findings),
    escapeHatches: escapeHatches(ctx, baseline?.total ?? 0),
  };

  if (flag('json')) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  const out: string[] = [];
  const line = (text = '') => out.push(text);
  const head = (text: string) => { line(); line(text); };

  const f = data.files;
  line(`Lume design system report, ${data.date}`);
  line(`${n(f.app)} app files, ${n(f.ds)} design-system files, ${n(f.story)} stories, ${n(f.token)} token files, ${n(f.exempt)} exempt`);

  const a = data.adoption;
  head(`Component adoption: ${p(a.adoption)} (${n(a.system)} library uses against ${n(a.native)} native elements a component replaces)`);
  line(`  ${n(a.reach.usingDesignSystem)} of ${n(a.reach.files)} screen files import from the library (${p(a.reach.share)}); ${n(a.instances)} instances of ${a.componentsUsed} components`);
  line(`  ${pad('component', 16)}${padStart('library', 8)}${padStart('native', 8)}${padStart('adoption', 10)}`);
  for (const r of a.components) line(`  ${pad(r.component, 16)}${padStart(n(r.system), 8)}${padStart(n(r.native), 8)}${padStart(p(r.adoption), 10)}`);
  line(`  ${pad('area', 20)}${padStart('library', 8)}${padStart('native', 8)}${padStart('adoption', 10)}`);
  for (const r of a.areas) line(`  ${pad(r.area, 20)}${padStart(n(r.system), 8)}${padStart(n(r.native), 8)}${padStart(p(r.adoption), 10)}`);

  head('Token coverage (share of values that come from a token)');
  line(`  ${pad('category', 10)}${padStart('token', 8)}${padStart('off', 7)}${padStart('coverage', 10)}  detail`);
  for (const c of data.tokens.categories) {
    const off = 'bridge' in c ? c.bridge + c.palette + c.literal : c.literal;
    const detail = 'bridge' in c
      ? `${c.literal} literal, ${c.palette} palette step, ${c.bridge} shadcn bridge`
      : 'halfSteps' in c ? `${n(c.halfSteps)} of the token uses are half steps (2/6/10px)` : '';
    line(`  ${pad(c.category, 10)}${padStart(n(c.token), 8)}${padStart(n(off), 7)}${padStart(p(c.coverage), 10)}  ${detail}`);
  }

  head(`Gates (known in the baseline + new)${baseline ? '' : ': no baseline yet, everything counts as new'}`);
  for (const r of data.gates) line(`  ${pad(r.rule, 16)}${padStart(r.known, 5)}${r.new ? ` + ${r.new} new` : ''}`);

  const l = data.library;
  head(`Library: ${l.components} components in ${l.files} files, ${p(l.storyCoverage)} of files have a story`);
  if (l.unstoried.length) line(`  no story: ${l.unstoried.join(', ')}`);
  line(`  unused anywhere: ${l.unused.length ? l.unused.join(', ') : 'none'}`);
  line(`  used only inside the library: ${l.internalOnly.length ? l.internalOnly.join(', ') : 'none'}`);
  line(`  most used: ${l.mostUsed.map((m) => `${m.component} ${n(m.uses)}`).join(', ')}`);

  const o = data.overrides;
  head(`Overrides: ${p(o.overriddenRate)} of ${n(o.instances)} instances carry className or style; ${p(o.visualRate)} change the look (colour, type, size, radius, shadow)`);
  for (const r of o.components) line(`  ${pad(r.component, 18)}${padStart(p(r.visualRate), 7)} of ${n(r.instances)} restyled`);

  head('Hand-rolled patterns (the "Not" column of shared/ui/README.md)');
  for (const h of data.handRolled) {
    line(`  ${pad(h.pattern, 28)}${padStart(h.count, 4)}  ${h.why}`);
    if (h.top.length) line(`  ${' '.repeat(32)}${h.top.join(', ')}`);
  }
  head(`Local components named for a library role that do not use it: ${data.promotionCandidates.length}`);
  for (const c of data.promotionCandidates) line(`  ${c.file} (${c.role})`);

  const t = data.tokenLayer;
  head('Token layer');
  line(`  definitions: ${Object.entries(t.definitions).map(([file, count]) => `${file} ${count}`).join(', ')}`);
  line(`  semantic tokens with a literal value: ${t.semanticLiterals.count} (${t.semanticLiterals.light} light, ${t.semanticLiterals.dark} dark); semantic.css says every value is a palette reference`);
  for (const e of t.semanticLiterals.examples) line(`    ${e}`);
  line(`  pointing at Tailwind's stock palette: ${t.stockPaletteRefs.length ? t.stockPaletteRefs.join('; ') : 'none'}`);
  line(`  colour tokens with one value for both themes (check that is meant): ${t.lightOnlyColourTokens.length ? t.lightOnlyColourTokens.join(', ') : 'none'}`);
  line(`  --lume-* tokens nothing references: ${t.deadTokens.length ? t.deadTokens.join(', ') : 'none'}`);
  line(`  references to undefined tokens: ${t.unknownTokenRefs}`);
  line(`  Tailwind's stock palettes still compile (no --color-*: initial): ${t.stockPaletteCompiled ? 'yes' : 'no'}`);

  const e = data.escapeHatches;
  head('Escape hatches');
  line(`  ds-ignore comments ${e.ignores}, ALLOW entries ${e.allowEntries}, baseline ${n(e.baseline)}, important modifiers ${e.importantModifiers}, dark: variants ${e.darkVariants}`);
  if (e.darkFiles.length) line(`  dark: variants in ${e.darkFiles.join(', ')}`);
  line(`  exempt files ${e.exemptFiles}: ${e.exemptByReason.map((x) => `${x.files} ${x.reason}`).join('; ')}`);

  console.log(out.join('\n'));
}

if (mode === 'report') report();
else if (mode === 'check' || mode === 'baseline') check();
else {
  console.error(`ds: unknown mode "${mode}"; use check, baseline or report`);
  process.exitCode = 1;
}
