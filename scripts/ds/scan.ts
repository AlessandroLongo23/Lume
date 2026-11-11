/**
 * Shared scanner for the design-system checks (see scripts/ds/README.md).
 *
 * Reads every .ts/.tsx/.css file under src/, sorts it into a kind, blanks its
 * comments, and builds the two registries the rules need: the tokens (read
 * from the CSS) and the components (every export of a file the docs site
 * documents, i.e. one with a story, plus everything under shared/ui).
 *
 * Regexes here avoid lookbehind, named groups and the `s` flag: tsconfig
 * targets ES2017 and TypeScript rejects them in regex literals.
 */
import fs from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(__dirname, '..', '..');

// ─── Where things are ──────────────────────────────────────────────────────

/** The token layer: the only files where literal values belong. */
export const TOKEN_FILES = [
  'src/styles/tokens/palette.css',
  'src/styles/tokens/primitives.css',
  'src/styles/tokens/semantic.css',
  'src/styles/components.css',
  'src/app/globals.css',
];

/** Folders that hold the design system. A file with a sibling story counts too. */
export const DS_ROOTS = ['src/lib/components/shared/ui/', 'src/components/ui/'];

/** The shadcn component folder, the one place the shadcn bridge is still allowed. */
export const SHADCN_ROOT = 'src/components/ui/';

/** The JS mirror of the motion tokens. */
export const MOTION_FILE = 'src/lib/const/motion.ts';

/** Raw colour steps; everything else references them. */
export const PALETTE_FILE = 'src/styles/tokens/palette.css';

/**
 * Files outside the screen code, left out of every gate except unknown-token
 * and out of the adoption metrics. Matched on the repo-relative path.
 */
export const EXEMPT: { pattern: RegExp; reason: string }[] = [
  { pattern: /^src\/lib\/email\//, reason: 'email HTML: mail clients do not read CSS variables' },
  { pattern: /^src\/app\/api\//, reason: 'route handlers: the HTML they build is email, never a screen' },
  { pattern: /\/(opengraph-image|twitter-image|apple-icon|icon)\.tsx$/, reason: 'rendered to a PNG by next/og' },
  { pattern: /^src\/lib\/components\/admin\/legale\/(templates\/|PrintableDocument\.tsx$)/, reason: 'printed on paper: light whatever the theme, sized for A4' },
  { pattern: /^src\/lib\/utils\/tableExport\.ts$/, reason: 'export to a print window and XLSX: light whatever the theme' },
  { pattern: /^src\/lib\/supabase\/database\.types\.ts$/, reason: 'generated' },
  { pattern: /^src\/lib\/const\/(category-colors|palette-swatches)\.ts$/, reason: 'colours a salon picks for its clients and categories: data, not styling' },
];

/** Single rules switched off for one file, with the reason. Prefer `ds-ignore: <reason>` on the line. */
export const ALLOW: { file: string; rules: string[]; reason: string }[] = [
  { file: 'src/lib/components/admin/settings/BrandingPanel.tsx', rules: ['raw-color'], reason: 'the brand colours a salon picks for its public page: data' },
  { file: 'src/lib/components/shared/ui/FloatingPanel.tsx', rules: ['portal'], reason: 'its contract: the caller renders it through <Portal>' },
];

export function allowed(file: string, rule: string): boolean {
  return ALLOW.some((entry) => entry.file === file && entry.rules.includes(rule));
}

// ─── Files ─────────────────────────────────────────────────────────────────

export type Kind = 'token' | 'ds' | 'story' | 'exempt' | 'app';

export interface Source {
  /** Repo-relative path with forward slashes. */
  file: string;
  kind: Kind;
  ext: 'ts' | 'tsx' | 'css';
  /** The file as on disk. */
  text: string;
  /** The same text with comments blanked to spaces; offsets and lines match `text`. */
  code: string;
  lineStarts: number[];
}

export function lineOf(src: Source, offset: number): number {
  const starts = src.lineStarts;
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= offset) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

export function lineText(src: Source, line: number): string {
  const start = src.lineStarts[line - 1];
  const end = line < src.lineStarts.length ? src.lineStarts[line] - 1 : src.text.length;
  return src.text.slice(start, end);
}

/**
 * Blanks block comments (and line comments outside CSS) to spaces, keeping
 * every newline. Strings are skipped so a `//` inside a URL survives; single
 * and double quotes end at a newline, which bounds the damage an apostrophe
 * in JSX text can do.
 */
export function blankComments(text: string, css: boolean): string {
  const out = text.split('');
  let quote: string | null = null;
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    const n = text[i + 1];
    if (quote) {
      if (c === '\\') { i += 2; continue; }
      if (c === quote || (c === '\n' && quote !== '`')) quote = null;
      i++;
      continue;
    }
    if (c === '/' && n === '*') {
      const end = text.indexOf('*/', i + 2);
      const stop = end === -1 ? text.length : end + 2;
      for (let j = i; j < stop; j++) if (out[j] !== '\n') out[j] = ' ';
      i = stop;
      continue;
    }
    if (!css && c === '/' && n === '/' && text[i - 1] !== ':') {
      const end = text.indexOf('\n', i);
      const stop = end === -1 ? text.length : end;
      for (let j = i; j < stop; j++) out[j] = ' ';
      i = stop;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') quote = c;
    i++;
  }
  return out.join('');
}

function walk(dir: string, out: string[]) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx?|css)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) out.push(full);
  }
}

export function exemptReason(file: string): string | null {
  return EXEMPT.find(({ pattern }) => pattern.test(file))?.reason ?? null;
}

export function loadSources(): Source[] {
  const paths: string[] = [];
  walk(path.join(ROOT, 'src'), paths);
  const files = paths.map((full) => path.relative(ROOT, full).split(path.sep).join('/')).sort();
  const stories = new Set(files.filter((file) => file.endsWith('.stories.tsx')));

  return files.map((file) => {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const ext = file.endsWith('.css') ? 'css' : file.endsWith('.tsx') ? 'tsx' : 'ts';
    let kind: Kind = 'app';
    if (TOKEN_FILES.includes(file)) kind = 'token';
    else if (stories.has(file)) kind = 'story';
    else if (exemptReason(file)) kind = 'exempt';
    else if (DS_ROOTS.some((root) => file.startsWith(root))) kind = 'ds';
    else if (stories.has(file.replace(/\.tsx?$/, '.stories.tsx'))) kind = 'ds';
    const lineStarts = [0];
    for (let i = 0; i < text.length; i++) if (text[i] === '\n') lineStarts.push(i + 1);
    return { file, kind, ext, text, code: blankComments(text, ext === 'css'), lineStarts };
  });
}

/** Coarse product areas, for adoption per area. */
export function areaOf(file: string): string {
  if (/^src\/(app\/admin|lib\/components\/admin|lib\/components\/shell)\//.test(file)) return 'admin app';
  if (/^src\/(app\/platform|lib\/components\/platform)\//.test(file)) return 'platform';
  if (/^src\/(app\/\(auth\)|app\/\(onboarding\)|app\/account|app\/auth|app\/welcome|lib\/components\/(auth|onboarding))\//.test(file)) return 'auth + onboarding';
  if (/^src\/(app\/\(public\)|lib\/components\/public)\//.test(file)) return 'public booking';
  if (/^src\/(app\/\(legal\)|app\/page\.tsx|lib\/components\/shared\/landing)/.test(file)) return 'landing + legal';
  return 'other';
}

// ─── Tokens ────────────────────────────────────────────────────────────────

export interface TokenDef {
  name: string;
  value: string;
  file: string;
  line: number;
  /** The selector of the block it is defined in (`:root`, `.dark`, `@theme inline`). */
  scope: string;
}

/** For every offset, the selector of the innermost block around it. */
function blockScopes(code: string): (offset: number) => string {
  const blocks: { start: number; end: number; selector: string }[] = [];
  const stack: { start: number; selector: string }[] = [];
  let last = 0;
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    if (c === '{') {
      stack.push({ start: i, selector: code.slice(last, i).trim().replace(/\s+/g, ' ') });
      last = i + 1;
    } else if (c === '}') {
      const open = stack.pop();
      if (open) blocks.push({ start: open.start, end: i, selector: open.selector });
      last = i + 1;
    } else if (c === ';') {
      last = i + 1;
    }
  }
  return (offset) => {
    let best: { start: number; end: number; selector: string } | null = null;
    for (const block of blocks) {
      if (block.start < offset && offset < block.end && (!best || block.start > best.start)) best = block;
    }
    return best?.selector ?? '';
  };
}

export interface Tokens {
  /** Every custom property defined in a stylesheet (light and dark blocks alike). */
  defs: Map<string, TokenDef[]>;
  /** Custom properties set from TS/TSX: style objects, setProperty, next/font. */
  runtime: Set<string>;
  /** Colour utility names (bg-X, text-X) from @theme: X → where it points. */
  colorUtilities: Map<string, 'token' | 'bridge' | 'palette'>;
  /** Lume palette families (neutral, brand-primary, danger, …). */
  paletteFamilies: string[];
  fontSizes: Set<string>;
  radii: Set<string>;
  shadows: Set<string>;
  /** z tier name → value. */
  zTiers: Map<string, number>;
  /** Duration token name → milliseconds. */
  durations: Map<string, number>;
  /** JS mirror: expression (DURATION.base) → seconds. */
  jsDurations: Map<string, number>;
  /** JS mirror: expression (EASE_OUT) → the four control points. */
  jsEasings: Map<string, number[]>;
  /** @utility recipes (control, surface-card, selected, …). */
  recipes: Set<string>;
}

/** The shadcn variables globals.css bridges to --lume-*; slated for removal (Phase C). */
export const BRIDGE_VARS = [
  'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
  'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
  'accent', 'accent-foreground', 'destructive', 'success', 'warning', 'border', 'input', 'ring',
  'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'radius',
  'sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
  'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring',
];

/** Tailwind's stock colour families, still compiled because palette.css does not reset them. */
export const STOCK_FAMILIES = [
  'slate', 'gray', 'zinc', 'stone', 'red', 'orange', 'amber', 'yellow', 'lime', 'green',
  'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
  'mauve', 'olive', 'mist', 'taupe',
];

/** Finds `@theme { … }` / `@theme inline { … }` blocks and returns their bodies. */
function themeBlocks(code: string): string[] {
  const blocks: string[] = [];
  const re = /@theme(?:\s+inline)?\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    let depth = 1;
    let i = m.index + m[0].length;
    const start = i;
    for (; i < code.length && depth > 0; i++) {
      if (code[i] === '{') depth++;
      else if (code[i] === '}') depth--;
    }
    blocks.push(code.slice(start, i - 1));
  }
  return blocks;
}

function toMs(value: string): number | null {
  const m = value.trim().match(/^(\d*\.?\d+)(ms|s)$/);
  if (!m) return null;
  return m[2] === 's' ? Number(m[1]) * 1000 : Number(m[1]);
}

export function loadTokens(sources: Source[]): Tokens {
  const tokens: Tokens = {
    defs: new Map(),
    runtime: new Set(),
    colorUtilities: new Map(),
    paletteFamilies: [],
    fontSizes: new Set(),
    radii: new Set(),
    shadows: new Set(),
    zTiers: new Map(),
    durations: new Map(),
    jsDurations: new Map(),
    jsEasings: new Map(),
    recipes: new Set(),
  };

  for (const src of sources) {
    if (src.ext === 'css') {
      const scopeAt = blockScopes(src.code);
      for (const m of src.code.matchAll(/(--[a-zA-Z][\w-]*)\s*:\s*([^;{}]+)[;}]/g)) {
        const def = { name: m[1], value: m[2].trim(), file: src.file, line: lineOf(src, m.index ?? 0), scope: scopeAt(m.index ?? 0) };
        const list = tokens.defs.get(m[1]) ?? [];
        list.push(def);
        tokens.defs.set(m[1], list);
      }
      for (const m of src.code.matchAll(/@utility\s+([\w-]+)/g)) tokens.recipes.add(m[1]);

      for (const body of themeBlocks(src.code)) {
        for (const m of body.matchAll(/--([a-zA-Z][\w-]*)\s*:\s*([^;]+);/g)) {
          const [, name, value] = m;
          if (name.startsWith('color-')) {
            const utility = name.slice('color-'.length);
            const family = utility.match(/^([a-z-]+?)-\d{2,3}$/);
            if (src.file === PALETTE_FILE) {
              // Every entry of the palette is a raw step, numbered (danger-500) or named (midnight-shell).
              const familyName = family ? family[1] : utility.replace(/-.*$/, '');
              if (!tokens.paletteFamilies.includes(familyName)) tokens.paletteFamilies.push(familyName);
              tokens.colorUtilities.set(utility, 'palette');
            } else if (/var\(--lume-/.test(value)) {
              tokens.colorUtilities.set(utility, 'token');
            } else {
              tokens.colorUtilities.set(utility, 'bridge');
            }
          } else if (name.startsWith('text-') && !name.includes('--')) {
            tokens.fontSizes.add(name.slice('text-'.length));
          } else if (name.startsWith('radius-')) {
            tokens.radii.add(name.slice('radius-'.length));
          } else if (name.startsWith('shadow-')) {
            tokens.shadows.add(name.slice('shadow-'.length));
          } else if (name.startsWith('z-')) {
            tokens.zTiers.set(name.slice(2), Number(value.trim()));
          } else if (name.startsWith('duration-')) {
            const ms = toMs(value);
            if (ms !== null) tokens.durations.set(name, ms);
          }
        }
      }
    } else {
      // Custom properties defined from code: '--x' keys, setProperty('--x'), next/font variables,
      // and Tailwind arbitrary properties ([--x:12px]).
      for (const m of src.code.matchAll(/['"`](--[a-zA-Z][\w-]*)['"`]/g)) tokens.runtime.add(m[1]);
      for (const m of src.code.matchAll(/\[(--[a-zA-Z][\w-]*):/g)) tokens.runtime.add(m[1]);
    }
  }

  const motion = sources.find((src) => src.file === MOTION_FILE);
  if (motion) {
    const durationObject = motion.code.match(/export const DURATION\s*=\s*\{([^}]*)\}/);
    if (durationObject) {
      for (const m of durationObject[1].matchAll(/(\w+)\s*:\s*(\d*\.?\d+)/g)) tokens.jsDurations.set(`DURATION.${m[1]}`, Number(m[2]));
    }
    for (const m of motion.code.matchAll(/export const (DURATION_\w+)\s*=\s*(\d*\.?\d+)/g)) tokens.jsDurations.set(m[1], Number(m[2]));
    for (const m of motion.code.matchAll(/export const (EASE_\w+)\s*=\s*\[([^\]]+)\]/g)) {
      tokens.jsEasings.set(m[1], m[2].split(',').map((n) => Number(n.trim())));
    }
  }

  return tokens;
}

/** True when a stylesheet or the code defines the custom property. */
export function isDefined(tokens: Tokens, name: string): boolean {
  return tokens.defs.has(name) || tokens.runtime.has(name);
}

/** --lume-* token → the colour utility @theme maps to it (--lume-hover → hover, for bg-hover). */
export function utilityForToken(tokens: Tokens): Map<string, string> {
  const out = new Map<string, string>();
  for (const [name, kind] of tokens.colorUtilities) {
    if (kind !== 'token') continue;
    const target = tokens.defs.get(`--color-${name}`)?.[0]?.value.match(/^var\(\s*(--lume-[\w-]+)\s*\)$/);
    if (target && !out.has(target[1])) out.set(target[1], name);
  }
  return out;
}

// ─── Components ────────────────────────────────────────────────────────────

export interface DsComponent {
  /** The exported name. */
  name: string;
  file: string;
  /** A story documents it (a story file imports the file it lives in). */
  storied: boolean;
}

const PASCAL = /^[A-Z][a-z][A-Za-z0-9]*$/;

function exportedNames(code: string): { names: string[]; defaultName: string | null } {
  const names = new Set<string>();
  let defaultName: string | null = null;
  for (const m of code.matchAll(/export\s+(default\s+)?(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/g)) {
    names.add(m[2]);
    if (m[1]) defaultName = m[2];
  }
  for (const m of code.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const part of m[1].split(',')) {
      const bits = part.trim().split(/\s+as\s+/);
      const exported = (bits[1] ?? bits[0]).trim();
      if (exported === 'default') defaultName = bits[0].trim();
      else if (exported && !exported.startsWith('type ')) names.add(exported);
    }
  }
  const def = code.match(/export\s+default\s+([A-Z][\w$]*)\s*;?\s*$/m);
  if (def) defaultName = def[1];
  return { names: [...names].filter((name) => PASCAL.test(name)), defaultName };
}

/** Resolves an import specifier to a repo-relative source file, or null. */
export function resolveImport(fromFile: string, spec: string, known: Set<string>): string | null {
  let base: string;
  if (spec.startsWith('@/')) base = 'src/' + spec.slice(2);
  else if (spec.startsWith('.')) base = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), spec));
  else return null;
  for (const candidate of [base, `${base}.tsx`, `${base}.ts`, `${base}/index.tsx`, `${base}/index.ts`]) {
    if (known.has(candidate)) return candidate;
  }
  return null;
}

export interface ImportBinding {
  /** Name used in this file. */
  local: string;
  /** Name exported by the target ('default' for a default import). */
  imported: string;
  /** Repo-relative target file, when it resolves inside src/. */
  target: string | null;
  spec: string;
}

export function importsOf(src: Source, known: Set<string>): ImportBinding[] {
  const bindings: ImportBinding[] = [];
  for (const m of src.code.matchAll(/import\s+(type\s+)?([^'";]*?)\s+from\s+['"]([^'"]+)['"]/g)) {
    if (m[1]) continue;
    const clause = m[2];
    const spec = m[3];
    const target = resolveImport(src.file, spec, known);
    const named = clause.match(/\{([^}]*)\}/);
    const head = clause.replace(/\{[^}]*\}/, '').replace(/,/g, ' ').trim();
    if (head && !head.startsWith('*')) bindings.push({ local: head.split(/\s+/)[0], imported: 'default', target, spec });
    if (named) {
      for (const part of named[1].split(',')) {
        const trimmed = part.trim();
        if (!trimmed || trimmed.startsWith('type ')) continue;
        const [imported, local] = trimmed.split(/\s+as\s+/).map((s) => s.trim());
        bindings.push({ local: local ?? imported, imported, target, spec });
      }
    }
  }
  return bindings;
}

export function loadComponents(sources: Source[]): Map<string, DsComponent[]> {
  const known = new Set(sources.map((src) => src.file));
  const storiedFiles = new Set<string>();
  for (const story of sources.filter((src) => src.kind === 'story')) {
    for (const binding of importsOf(story, known)) if (binding.target) storiedFiles.add(binding.target);
  }

  const byFile = new Map<string, DsComponent[]>();
  for (const src of sources) {
    if (src.kind !== 'ds' || src.ext !== 'tsx') continue;
    const { names, defaultName } = exportedNames(src.code);
    const all = new Set(names);
    if (defaultName && PASCAL.test(defaultName)) all.add(defaultName);
    byFile.set(
      src.file,
      [...all].map((name) => ({ name, file: src.file, storied: storiedFiles.has(src.file) })),
    );
  }

  // Barrels (detail/index.ts): an import through one resolves to the same component objects.
  for (const src of sources) {
    if (!DS_ROOTS.some((root) => src.file.startsWith(root)) || !/\/index\.tsx?$/.test(src.file)) continue;
    const reexported: DsComponent[] = [];
    for (const m of src.code.matchAll(/export\s*(\{[^}]*\}|\*)\s*from\s*['"]([^'"]+)['"]/g)) {
      const target = resolveImport(src.file, m[2], known);
      const list = target ? byFile.get(target) ?? [] : [];
      if (m[1] === '*') reexported.push(...list);
      else {
        const names = m[1].slice(1, -1).split(',').map((part) => part.trim().split(/\s+as\s+/)[0].trim());
        reexported.push(...list.filter((c) => names.includes(c.name)));
      }
    }
    if (reexported.length) byFile.set(src.file, reexported);
  }
  return byFile;
}

/** Every component once, without the barrel entries that point at the same objects. */
export function uniqueComponents(components: Map<string, DsComponent[]>): DsComponent[] {
  return [...new Set([...components.values()].flat())];
}

/** Component files only (barrels left out). */
export function componentFiles(components: Map<string, DsComponent[]>): [string, DsComponent[]][] {
  return [...components].filter(([file, list]) => list.length && list.every((c) => c.file === file));
}

/** Maps each local JSX name in a file to the design-system component it imports. */
export function dsBindings(src: Source, components: Map<string, DsComponent[]>, known: Set<string>): Map<string, DsComponent> {
  const out = new Map<string, DsComponent>();
  for (const binding of importsOf(src, known)) {
    if (!binding.target) continue;
    const list = components.get(binding.target);
    if (!list) continue;
    const component = binding.imported === 'default'
      ? list.find((c) => c.name === path.posix.basename(binding.target!).replace(/\.tsx?$/, '')) ?? list[0]
      : list.find((c) => c.name === binding.imported);
    if (component) out.set(binding.local, component);
  }
  return out;
}

// ─── JSX ───────────────────────────────────────────────────────────────────

export interface Tag {
  name: string;
  /** Offset of the `<`. */
  start: number;
  /** The opening tag through its closing `>`. */
  text: string;
}

/**
 * Reads the opening tags named in `names` (or every tag when `names` is null).
 * Braces are tracked so `=>` inside an attribute expression does not end the tag.
 */
export function jsxTags(code: string, names: string[] | null): Tag[] {
  const tags: Tag[] = [];
  if (names && !names.length) return tags;
  const re = names
    ? new RegExp(`<(${names.map((n) => n.replace('.', '\\.')).join('|')})(?=[\\s/>])`, 'g')
    : /<([A-Za-z][\w.]*)(?=[\s/>])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    let depth = 0;
    let quote: string | null = null;
    let i = m.index + m[0].length;
    for (; i < code.length; i++) {
      const c = code[i];
      if (quote) {
        if (c === '\\') { i++; continue; }
        if (c === quote) quote = null;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') quote = c;
      else if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (c === '>' && depth <= 0) break;
    }
    tags.push({ name: m[1], start: m.index, text: code.slice(m.index, i + 1) });
  }
  return tags;
}

/** The value of a string attribute (`type="checkbox"`), or null. */
export function attr(tag: Tag, name: string): string | null {
  const m = tag.text.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|\\{\\s*['"\`]([^'"\`]*)['"\`]\\s*\\})`));
  return m ? (m[1] ?? m[2] ?? m[3] ?? '') : null;
}

export function hasAttr(tag: Tag, name: string): boolean {
  return new RegExp(`\\s${name}(?=[\\s=/>])`).test(tag.text);
}
