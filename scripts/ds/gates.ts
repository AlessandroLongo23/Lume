/**
 * Gates: rules where a violation reliably means something is wrong and the
 * fix is clear. They fail `npm run ds:check` only on violations the baseline
 * does not already know (see cli.ts). Rationale per rule in README.md.
 */
import {
  type DsComponent, type Source, type Tag, type Tokens,
  BRIDGE_VARS, SHADCN_ROOT, STOCK_FAMILIES,
  allowed, attr, dsBindings, hasAttr, importsOf, isDefined, jsxTags, lineOf, lineText, utilityForToken,
} from './scan';

export interface Finding {
  rule: string;
  file: string;
  line: number;
  /** What was found, as written. Part of the baseline key. */
  value: string;
  /** What to do instead. Not part of the baseline key. */
  hint: string;
  /** For native-element: the component that replaces it. */
  component?: string;
  /** Last line of a multi-line finding (a JSX opening tag); a ds-ignore anywhere up to it counts. */
  endLine?: number;
}

export interface Context {
  sources: Source[];
  tokens: Tokens;
  components: Map<string, DsComponent[]>;
  known: Set<string>;
}

/** Characters that can precede a utility class: whitespace, quote, brace, bracket, comma, variant colon, `!`. */
export const BOUNDARY = `(^|[\\s"'\`{(\\[,:!])`;
export const COLOR_PROPS = 'bg|text|border(?:-[xytrblse])?|ring(?:-offset)?|fill|stroke|outline|divide|from|via|to|shadow|decoration|accent|caret|placeholder|inset-ring|inset-shadow';
export const OPACITY = '(?:\\/[\\w.%\\[\\]]+)?';

/** Files the value gates judge: the design system and the app. */
const judged = (src: Source) => src.kind === 'ds' || src.kind === 'app';

function find(src: Source, offset: number, rule: string, value: string, hint: string, component?: string, endOffset?: number): Finding {
  const line = lineOf(src, offset);
  const endLine = endOffset === undefined ? line : lineOf(src, endOffset);
  return { rule, file: src.file, line, value, hint, ...(component ? { component } : {}), ...(endLine > line ? { endLine } : {}) };
}

// ─── raw-color ─────────────────────────────────────────────────────────────

/** Blanks the fallback of every `var(--x, fallback)`: a fallback is not a choice against a token. */
function blankVarFallbacks(code: string): string {
  const out = code.split('');
  const re = /var\(\s*--[\w-]+\s*,/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    let depth = 1;
    let i = m.index + m[0].length;
    for (; i < code.length && depth > 0; i++) {
      if (code[i] === '(') depth++;
      else if (code[i] === ')') depth--;
    }
    for (let j = m.index + m[0].length; j < i - 1; j++) if (out[j] !== '\n') out[j] = ' ';
  }
  return out.join('');
}

const SVG_PAINT_BEFORE = /(fill|stroke|stopColor|stop-color|floodColor|lightingColor)\s*=\s*\{?\s*["'`]?\s*$/;
/** `readVar('--lume-border') || '#e4e4e7'`: a JS fallback for a token read, like a var() fallback. */
const TOKEN_READ_FALLBACK = /(--[\w-]+['"`]?|(readVar|getPropertyValue)\(.*)\s*\)?\s*(\|\||\?\?)\s*['"`]$/;
/** Black or white in a gradient with `transparent`: an alpha mask, where only the alpha counts. */
const MASK_STOP = /^(#000|#000000|#fff|#ffffff|black|white)$/i;

function rawColor(src: Source): Finding[] {
  const findings: Finding[] = [];
  const code = blankVarFallbacks(src.code);
  const hint = 'raw colour: use a --lume-* colour token (semantic.css), which also switches in dark mode';

  const before = (offset: number) => code.slice(code.lastIndexOf('\n', offset) + 1, offset);
  const lineAt = (offset: number) => {
    const start = code.lastIndexOf('\n', offset) + 1;
    const end = code.indexOf('\n', offset);
    return code.slice(start, end === -1 ? code.length : end);
  };
  const isMaskStop = (value: string, offset: number) => MASK_STOP.test(value) && /gradient\(/.test(lineAt(offset)) && /transparent/.test(lineAt(offset));

  for (const m of code.matchAll(/(^|[^\w&#])(#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4}))(?![\w-])/g)) {
    const offset = (m.index ?? 0) + m[1].length;
    const hex = m[2];
    if (/^#(?:0{4}|[0-9a-fA-F]{6}00)$/.test(hex)) continue; // fully transparent
    if (/^#\d{3,4}$/.test(hex) && /\w\s*$/.test(before(offset))) continue; // "Ordine #123"
    if (SVG_PAINT_BEFORE.test(before(offset)) || TOKEN_READ_FALLBACK.test(before(offset))) continue;
    if (isMaskStop(hex, offset)) continue;
    findings.push(find(src, offset, 'raw-color', hex, hint));
  }

  for (const m of code.matchAll(/(^|[^\w.-])((?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\()/g)) {
    const offset = (m.index ?? 0) + m[1].length;
    const open = offset + m[2].length;
    let depth = 1;
    let i = open;
    for (; i < code.length && depth > 0; i++) {
      if (code[i] === '(') depth++;
      else if (code[i] === ')') depth--;
    }
    const args = code.slice(open, i - 1);
    // Computed colours (from a variable, a template, relative colour syntax) are not literals.
    if (!/^\s*-?\.?\d/.test(args) || /var\(|\$\{|calc\(|\bfrom\b/.test(args)) continue;
    if (/[,/]\s*0(?:\.0+)?%?\s*$/.test(args)) continue; // fully transparent
    if (SVG_PAINT_BEFORE.test(before(offset)) || TOKEN_READ_FALLBACK.test(before(offset))) continue;
    findings.push(find(src, offset, 'raw-color', code.slice(offset, i).replace(/\s+/g, ' '), hint));
  }

  if (src.ext === 'css') {
    const named = /(^|[\s;{])((?:color|background(?:-color)?|border(?:-[a-z]+)?-color|outline-color|fill|stroke)\s*:\s*(white|black|red|green|blue|gray|grey|orange|yellow|purple|pink)\b)/g;
    for (const m of code.matchAll(named)) findings.push(find(src, (m.index ?? 0) + m[1].length, 'raw-color', m[3], hint));
  }
  return findings;
}

// ─── palette ───────────────────────────────────────────────────────────────

function paletteHint(family: string): string {
  if (/^(danger|red|rose)$/.test(family)) return 'palette step: use bg-danger-soft / text-danger-strong / border-danger-line';
  if (/^(success|green|emerald|lime|teal)$/.test(family)) return 'palette step: use bg-success-soft / text-success-strong / border-success-line';
  if (/^(warning|amber|yellow|orange)$/.test(family)) return 'palette step: use bg-warning-soft / text-warning-strong / border-warning-line';
  if (/^(info|blue|sky|cyan)$/.test(family)) return 'palette step: use bg-info-soft / text-info-strong / border-info-line';
  if (/^(brand-primary|indigo|violet|purple)$/.test(family)) return 'palette step: use the accent tokens (--lume-accent, bg-accent-soft)';
  if (/^(neutral|zinc|gray|slate|stone|white|black)$/.test(family)) return 'palette step: use a --lume-* text, surface, border or overlay token (text-[var(--lume-text-secondary)], bg-hover, border-line)';
  return 'palette step: add a semantic token to semantic.css and use that';
}

/** The family a palette entry belongs to: `danger-500` → danger, `midnight-shell` → neutral. */
function familyOf(name: string): string {
  if (/^(midnight|pure-white|white|black)/.test(name)) return 'neutral';
  return name.replace(/-\d{2,3}$/, '');
}

function palette(src: Source, tokens: Tokens): Finding[] {
  const findings: Finding[] = [];
  // Every entry of palette.css by name, plus Tailwind's stock steps, which still compile.
  const lume = [...tokens.colorUtilities].filter(([, kind]) => kind === 'palette').map(([name]) => name).sort((a, b) => b.length - a.length).join('|');
  const stock = `(?:${STOCK_FAMILIES.join('|')})-\\d{2,3}|white|black`;
  const utility = new RegExp(`${BOUNDARY}((?:${COLOR_PROPS})-(${lume}|${stock})${OPACITY})(?![\\w-])`, 'g');
  for (const m of src.code.matchAll(utility)) {
    findings.push(find(src, (m.index ?? 0) + m[1].length, 'palette', m[2], paletteHint(familyOf(m[3]))));
  }
  for (const m of src.code.matchAll(new RegExp(`var\\(\\s*--color-(${lume}|(?:${STOCK_FAMILIES.join('|')})-\\d{2,3})\\s*\\)`, 'g'))) {
    findings.push(find(src, m.index ?? 0, 'palette', m[0], paletteHint(familyOf(m[1]))));
  }
  // Read from code by name: getPropertyValue('--color-danger-400').
  if (src.ext !== 'css') {
    for (const m of src.code.matchAll(new RegExp(`['"\`](--color-(${lume}|(?:${STOCK_FAMILIES.join('|')})-\\d{2,3}))['"\`]`, 'g'))) {
      findings.push(find(src, m.index ?? 0, 'palette', m[1], paletteHint(familyOf(m[2]))));
    }
  }
  return findings;
}

// ─── token-spelling ────────────────────────────────────────────────────────

/** Prefixes where `X-[var(--t)]` and the theme utility compile to the same CSS (not shadow-, which reads a var as a shadow). */
export const SPELLING_PREFIXES = 'bg|text|border(?:-[xytrblse])?|divide|stroke|fill|ring';

function tokenSpelling(src: Source, tokens: Tokens): Finding[] {
  const findings: Finding[] = [];
  const utilities = utilityForToken(tokens);
  for (const m of src.code.matchAll(new RegExp(`${BOUNDARY}((${SPELLING_PREFIXES})-\\[var\\((--lume-[\\w-]+)\\)\\])`, 'g'))) {
    const utility = utilities.get(m[4]);
    if (!utility) continue;
    findings.push(find(src, (m.index ?? 0) + m[1].length, 'token-spelling', m[2], `use ${m[3]}-${utility}: the same CSS, spelled the way the theme defines it`));
  }
  return findings;
}

// ─── bridge ────────────────────────────────────────────────────────────────

function bridge(src: Source, tokens: Tokens): Finding[] {
  if (src.file.startsWith(SHADCN_ROOT)) return [];
  const findings: Finding[] = [];
  const hint = 'shadcn bridge (globals.css, removed in Phase C): use the --lume-* token it points to';
  const names = [...tokens.colorUtilities].filter(([, kind]) => kind === 'bridge').map(([name]) => name);
  if (names.length) {
    const utility = new RegExp(`${BOUNDARY}((?:${COLOR_PROPS})-(?:${names.sort((a, b) => b.length - a.length).join('|')})${OPACITY})(?![\\w-])`, 'g');
    for (const m of src.code.matchAll(utility)) findings.push(find(src, (m.index ?? 0) + m[1].length, 'bridge', m[2], hint));
  }
  for (const m of src.code.matchAll(new RegExp(`var\\(\\s*--(${BRIDGE_VARS.join('|')})\\s*\\)`, 'g'))) {
    findings.push(find(src, m.index ?? 0, 'bridge', m[0], hint));
  }
  // Read from code by name: getPropertyValue('--chart-1').
  if (src.ext !== 'css') {
    for (const m of src.code.matchAll(new RegExp(`['"\`](--(${BRIDGE_VARS.join('|')}))['"\`]`, 'g'))) {
      findings.push(find(src, m.index ?? 0, 'bridge', m[1], hint));
    }
  }
  return findings;
}

// ─── unknown-token ─────────────────────────────────────────────────────────

/** Custom properties set by Tailwind or a library at runtime, never in our CSS. */
const LIBRARY_VARS = [
  /^--tw-/,
  /^--(anchor|available|transform-origin|positioner|popup|collapsible|accordion|active-tab|scroll-area|slider|viewport|nested-dialogs|indicator)/, // Base UI
  /^--radix-/,
  /^--default-/,
  /^--font-(sans|mono|serif)$/, // next/font
  /^--(container|breakpoint|blur|perspective|aspect|animate|inset-shadow|drop-shadow|text-shadow)-/,
];

/** Tailwind's default theme still defines its stock palette; the token-layer metric reports where it is used. */
const STOCK_PALETTE_VAR = new RegExp(`^--color-(${STOCK_FAMILIES.join('|')})-\\d{2,3}$`);

function unknownToken(src: Source, tokens: Tokens): Finding[] {
  const findings: Finding[] = [];
  const check = (name: string, offset: number) => {
    if (isDefined(tokens, name) || STOCK_PALETTE_VAR.test(name) || LIBRARY_VARS.some((re) => re.test(name))) return;
    findings.push(find(src, offset, 'unknown-token', name, 'no stylesheet or component defines this custom property; the declaration silently falls back'));
  };
  for (const m of src.code.matchAll(/var\(\s*(--[a-zA-Z][\w-]*)/g)) check(m[1], m.index ?? 0);
  // Tailwind v4 shorthand: bg-(--lume-x)
  for (const m of src.code.matchAll(/[\w\]]-\((--[a-zA-Z][\w-]*)\)/g)) check(m[1], m.index ?? 0);
  return findings;
}

// ─── z-index ───────────────────────────────────────────────────────────────

function zHint(tokens: Tokens, value: number | null, form: 'class' | 'var'): string {
  const tier = [...tokens.zTiers].find(([, v]) => v === value);
  if (!tier) return 'numeric z-index: use a semantic tier (z-sticky, z-dropdown, z-modal, …) or add one to primitives.css';
  return `numeric z-index: ${form === 'class' ? `z-${tier[0]}` : `var(--z-${tier[0]})`} has this value; name the role, not the number`;
}

function zIndex(src: Source, tokens: Tokens): Finding[] {
  const findings: Finding[] = [];
  for (const m of src.code.matchAll(new RegExp(`${BOUNDARY}(-?z-(\\d+|\\[[^\\]]+\\]))(?![\\w-])`, 'g'))) {
    const n = /^\d+$/.test(m[3]) ? Number(m[3]) * (m[2].startsWith('-') ? -1 : 1) : null;
    if (n === 0) continue; // z-0 is the stacking-context reset, not a tier
    findings.push(find(src, (m.index ?? 0) + m[1].length, 'z-index', m[2], zHint(tokens, n, 'class')));
  }
  for (const m of src.code.matchAll(/zIndex\s*:\s*(-?\d+)/g)) findings.push(find(src, m.index ?? 0, 'z-index', m[0], zHint(tokens, Number(m[1]), 'var')));
  if (src.ext === 'css') {
    for (const m of src.code.matchAll(/z-index\s*:\s*(-?\d+)/g)) findings.push(find(src, m.index ?? 0, 'z-index', m[0], zHint(tokens, Number(m[1]), 'var')));
  }
  return findings;
}

// ─── portal ────────────────────────────────────────────────────────────────

function portal(src: Source, ctx: Context): Finding[] {
  if (src.ext !== 'tsx') return [];
  const floating = src.code.match(/\bz-(dropdown|popover|modal-backdrop|modal|drawer-backdrop|drawer|tooltip|toast|command|lightbox|drag)(?![\w-])/);
  if (!floating) return [];
  // Our <Portal>, React's createPortal, a Base UI part (<Popover.Portal>), or d3 appending to <body>.
  const portals = /\bcreatePortal\b|<[A-Z]\w*\.Portal\b|select\(\s*document\.body\s*\)|document\.body\.append/.test(src.code)
    || importsOf(src, ctx.known).some((binding) => binding.local === 'Portal' || binding.imported === 'Portal');
  if (portals) return [];
  return [find(src, floating.index ?? 0, 'portal', floating[0], 'floating layer without <Portal>: a transformed or filtered ancestor traps its z-index (AGENTS.md)')];
}

// ─── raw-motion ────────────────────────────────────────────────────────────

/** --duration-spring is the sampling window of the spring curve, not a duration to tween with. */
function tweenDurations(tokens: Tokens): [string, number][] {
  return [...tokens.durations].filter(([name]) => name !== 'duration-spring');
}

export function durationHint(tokens: Tokens, ms: number): string {
  const css = tweenDurations(tokens).find(([, v]) => v === ms);
  const js = [...tokens.jsDurations].find(([, v]) => Math.abs(v * 1000 - ms) < 0.5);
  if (css || js) return `raw duration: this is ${[css && `var(--${css[0]})`, js && js[0]].filter(Boolean).join(' / ')}`;
  const nearest = tweenDurations(tokens).sort((a, b) => Math.abs(a[1] - ms) - Math.abs(b[1] - ms)).slice(0, 2);
  return `raw duration: no token is ${ms}ms; nearest ${nearest.map(([name, v]) => `--${name} (${v}ms)`).join(', ')}; ask before choosing`;
}

function insideReducedMotion(code: string, offset: number): boolean {
  const at = code.lastIndexOf('prefers-reduced-motion: reduce', offset);
  if (at === -1) return false;
  let depth = 0;
  for (let i = code.indexOf('{', at); i !== -1 && i < offset; i++) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') depth--;
  }
  return depth > 0;
}

const MOTION_LIBRARIES = /^(motion|motion\/react|framer-motion|gsap|@gsap\/react)$/;

function rawMotion(src: Source, tokens: Tokens, ctx: Context): Finding[] {
  const findings: Finding[] = [];
  for (const m of src.code.matchAll(new RegExp(`${BOUNDARY}(duration-(\\d+|\\[(\\d*\\.?\\d+)(ms|s)\\]))(?![\\w-])`, 'g'))) {
    const ms = m[4] ? Number(m[4]) * (m[5] === 's' ? 1000 : 1) : Number(m[3]);
    if (ms === 0) continue;
    findings.push(find(src, (m.index ?? 0) + m[1].length, 'raw-motion', m[2], durationHint(tokens, ms)));
  }
  for (const m of src.code.matchAll(/cubic-bezier\(\s*-?[\d.]/g)) {
    if (src.ext === 'css' && insideReducedMotion(src.code, m.index ?? 0)) continue;
    findings.push(find(src, m.index ?? 0, 'raw-motion', 'cubic-bezier()', 'raw curve: use ease-out / ease-in-out / ease-glide (var(--ease-*)) or EASE_* from lib/const/motion'));
  }
  // CSS declarations and style strings: transition / animation with a literal time.
  for (const m of src.code.matchAll(/(transition|animation)(?:-duration|Duration)?\s*:\s*['"`]?([^;'"`}\n]*)/g)) {
    if (src.ext === 'css' && insideReducedMotion(src.code, m.index ?? 0)) continue;
    for (const t of m[2].matchAll(/(^|[\s,(])(\d*\.?\d+)(ms|s)(?![\w-])/g)) {
      const ms = Number(t[2]) * (t[3] === 's' ? 1000 : 1);
      if (ms === 0) continue;
      findings.push(find(src, m.index ?? 0, 'raw-motion', `${t[2]}${t[3]}`, durationHint(tokens, ms)));
    }
  }
  // motion / gsap: durations in seconds and bezier arrays.
  if (src.ext !== 'css' && importsOf(src, ctx.known).some((binding) => MOTION_LIBRARIES.test(binding.spec))) {
    for (const m of src.code.matchAll(/\bduration\s*:\s*(\d*\.?\d+)(?![\w.])/g)) {
      const seconds = Number(m[1]);
      if (seconds === 0) continue;
      findings.push(find(src, m.index ?? 0, 'raw-motion', m[0].replace(/\s+/g, ' '), durationHint(tokens, Math.round(seconds * 1000))));
    }
    for (const m of src.code.matchAll(/\bease\s*:\s*\[\s*(-?[\d.]+\s*,\s*-?[\d.]+\s*,\s*-?[\d.]+\s*,\s*-?[\d.]+)\s*\]/g)) {
      const points = m[1].split(',').map((n) => Number(n.trim()));
      const named = [...tokens.jsEasings].find(([, v]) => v.every((n, i) => n === points[i]));
      findings.push(find(src, m.index ?? 0, 'raw-motion', `ease: [${points.join(', ')}]`,
        named ? `raw curve: this is ${named[0]}` : 'raw curve: no Lume easing has these points; use EASE_OUT, EASE_IN_OUT or EASE_GLIDE'));
    }
  }
  return findings;
}

// ─── raw-size ──────────────────────────────────────────────────────────────

function toPx(value: string): number | null {
  const m = value.trim().match(/^(-?\d*\.?\d+)(px|rem)$/);
  if (!m) return null;
  return m[2] === 'rem' ? Number(m[1]) * 16 : Number(m[1]);
}

function sizeHint(kind: string, value: string): string {
  const px = toPx(value);
  if (kind === 'text' && px !== null) {
    const scale: Record<number, string> = { 11: '2xs', 12: 'xs', 13: 'compact', 14: 'sm', 16: 'base', 18: 'lg', 20: 'xl', 24: '2xl', 28: 'headline', 30: '3xl', 36: '4xl', 48: '5xl', 60: '6xl' };
    return scale[px] ? `raw font size: this is text-${scale[px]}` : `raw font size: no step is ${px}px; use the type scale (text-2xs … text-6xl)`;
  }
  if (kind.startsWith('rounded') && px !== null) {
    const radii: Record<number, string> = { 4: 'sm', 8: 'md', 12: 'lg', 16: 'xl', 24: '2xl' };
    return radii[px] ? `raw radius: this is rounded-${radii[px]}` : `raw radius: no step is ${px}px (sm 4, md 8, lg 12, xl 16, 2xl 24)`;
  }
  if (/^(-?)(p|m|gap|space)/.test(kind) && px !== null) {
    return px % 2 === 0 ? `raw spacing: this is ${kind}-${px / 4} on the spacing scale` : `raw spacing: ${px}px is off the 4px scale`;
  }
  if (kind === 'shadow') return 'raw shadow: use shadow-xs … shadow-xl, shadow-float or the edge utility';
  if (kind === 'leading') return 'raw line height: use leading-tight / snug / normal / relaxed';
  if (kind === 'tracking') return 'raw letter spacing: use tracking-tight / normal / wide';
  if (kind === 'font') return 'raw font weight: use font-normal / medium / semibold / bold';
  return 'raw size: use a token from primitives.css';
}

const STYLE_SIZE_KEYS = /\b(fontSize|fontWeight|lineHeight|letterSpacing|padding\w*|margin\w*|gap|rowGap|columnGap|borderRadius|boxShadow)\s*:\s*(-?\d*\.?\d+(?![\w.])|['"`][^'"`\n]*['"`])/g;

function rawSize(src: Source): Finding[] {
  const findings: Finding[] = [];
  const utility = new RegExp(`${BOUNDARY}((-?)(text|leading|tracking|rounded(?:-[trblse]{1,2})?|p[xytrblse]?|m[xytrblse]?|gap(?:-[xy])?|space-[xy]|shadow|font)-\\[([^\\]\\s]+)\\])`, 'g');
  for (const m of src.code.matchAll(utility)) {
    const [, , whole, neg, kind, value] = m;
    if (/var\(|env\(|theme\(|--/.test(value)) continue;
    if (/#|rgba?\(|hsla?\(|oklch\(/.test(value)) continue; // colour: raw-color reports it
    const literal = /\d(px|rem|em)\b/.test(value) || ((kind === 'leading' || kind === 'font') && /^\d*\.?\d+$/.test(value));
    if (!literal) continue;
    findings.push(find(src, (m.index ?? 0) + m[1].length, 'raw-size', whole, sizeHint(neg + kind, value)));
  }
  if (src.ext === 'tsx') {
    for (const open of src.code.matchAll(/style=\{\{/g)) {
      let depth = 2;
      let i = (open.index ?? 0) + open[0].length;
      for (; i < src.code.length && depth > 0; i++) {
        if (src.code[i] === '{') depth++;
        else if (src.code[i] === '}') depth--;
      }
      const body = src.code.slice(open.index ?? 0, i);
      for (const m of body.matchAll(STYLE_SIZE_KEYS)) {
        const value = m[2].replace(/['"`]/g, '');
        if (/var\(|\$\{/.test(value) || /^-?0(px|rem)?$/.test(value.trim()) || !/\d/.test(value)) continue;
        findings.push(find(src, (open.index ?? 0) + (m.index ?? 0), 'raw-size', `${m[1]}: ${m[2]}`, 'literal size in a style prop: use the matching utility or var(--token)'));
      }
    }
  }
  if (src.ext === 'css') {
    for (const m of src.code.matchAll(/(^|[\s;{])((font-size|line-height|letter-spacing|padding(?:-[a-z]+)?|margin(?:-[a-z]+)?|gap|row-gap|column-gap|border-radius|box-shadow)\s*:\s*([^;}]+))/g)) {
      const value = m[4].trim();
      if (/var\(/.test(value) || !/\d(px|rem|em)\b/.test(value)) continue;
      if (/^0(px|rem)?$/.test(value)) continue;
      findings.push(find(src, (m.index ?? 0) + m[1].length, 'raw-size', m[2].trim(), cssSizeHint(m[3], value)));
    }
  }
  return findings;
}

/** The token a single stylesheet value maps to, written as CSS. */
function cssSizeHint(property: string, value: string): string {
  const px = toPx(value);
  if (px === null) return 'literal size in a stylesheet: use var(--token) from primitives.css';
  if (property === 'font-size') return sizeHint('text', value).replace(/text-([\w]+)$/, 'var(--text-$1)');
  if (property === 'border-radius') return sizeHint('rounded', value).replace(/rounded-([\w]+)$/, 'var(--radius-$1)');
  if (/^(padding|margin|gap|row-gap|column-gap)/.test(property)) {
    return px % 4 === 0 ? `raw spacing: this is calc(var(--spacing) * ${px / 4})` : `raw spacing: ${px}px is off the 4px scale`;
  }
  return 'literal size in a stylesheet: use var(--token) from primitives.css';
}

// ─── native-element ────────────────────────────────────────────────────────

/** `type` → the component for that input; null when no component covers it (file pickers, hidden, the native colour well). */
const INPUT_COMPONENT: Record<string, string | null> = {
  checkbox: 'Checkbox', radio: 'OptionGroup', date: 'DateField', 'datetime-local': 'DateTimeField',
  time: 'DateTimeField', number: 'NumberInput', search: 'Searchbar', range: 'Slider', tel: 'PhoneNumber',
  hidden: null, file: null, color: null,
};

const CLICKABLE_TAGS = ['div', 'span', 'li', 'p', 'img', 'section', 'article', 'header', 'footer'];
const TITLE_EXEMPT = new Set(['iframe', 'abbr', 'svg', 'link', 'style', 'meta', 'title', 'Link', 'a']);
/** A click handler that only stops the row's own click: a wrapper, not a control. */
const STOP_ONLY = /\sonClick=\{\s*\(?\s*\w+\s*\)?\s*=>\s*\w+\.stopPropagation\(\)\s*\}/;
/** Screens where data tables live (and should borrow table/tableStyles). */
export const DATA_TABLE_AREAS = /^src\/(app\/admin|lib\/components\/admin|app\/platform|lib\/components\/platform)\//;

/**
 * True when a <label> wraps or sits beside a Checkbox or Switch. Checkbox has no
 * label prop and Field is a label stack, so no component covers that row yet:
 * it is a gap in the library, reported by the metrics, not a violation.
 */
export function isCheckboxRow(code: string, tag: Tag): boolean {
  const around = code.slice(Math.max(0, tag.start - 300), tag.start + tag.text.length + 300);
  return /<(Checkbox|Switch)\b|type=["']checkbox["']/.test(around);
}

/** Which component replaces a native element; null when none does. */
export function replacementFor(tag: Tag, file: string, importsTableStyles: boolean, code: string): { component: string; value: string } | null {
  switch (tag.name) {
    case 'button': return { component: 'Button', value: '<button>' };
    case 'select': return { component: 'Select', value: '<select>' };
    case 'textarea': return { component: 'TextArea', value: '<textarea>' };
    case 'label': return isCheckboxRow(code, tag) ? null : { component: 'Field', value: '<label>' };
    case 'dialog': return { component: 'Modal', value: '<dialog>' };
    case 'input': {
      const type = (attr(tag, 'type') ?? 'text').toLowerCase();
      const component = type in INPUT_COMPONENT ? INPUT_COMPONENT[type] : 'FormInput';
      return component ? { component, value: `<input type="${type}">` } : null;
    }
    case 'h1':
      return /^src\/(app\/admin|lib\/components\/admin)\//.test(file) ? { component: 'PageHeader', value: '<h1>' } : null;
    case 'a':
    case 'Link':
      return /\bunderline\b/.test(tag.text) ? { component: 'TextLink', value: `<${tag.name} className="underline …">` } : null;
    case 'table':
      return importsTableStyles || !DATA_TABLE_AREAS.test(file) ? null : { component: 'tableStyles', value: '<table>' };
    default:
      // A declared role means a deliberate, keyboard-reachable control (a card, a drop zone).
      if (CLICKABLE_TAGS.includes(tag.name) && hasAttr(tag, 'onClick') && !hasAttr(tag, 'role') && !STOP_ONLY.test(tag.text)) {
        return { component: 'Button', value: `<${tag.name} onClick>` };
      }
      return null;
  }
}

function nativeElement(src: Source, ctx: Context): Finding[] {
  if (src.kind !== 'app' || src.ext !== 'tsx') return [];
  const findings: Finding[] = [];
  const importsTableStyles = importsOf(src, ctx.known).some((binding) => /table\/tableStyles\.tsx?$/.test(binding.target ?? ''));
  for (const tag of jsxTags(src.code, null)) {
    const replacement = replacementFor(tag, src.file, importsTableStyles, src.code);
    const end = tag.start + tag.text.length - 1;
    if (replacement) {
      const verb = replacement.component === 'tableStyles' ? 'style it with table/tableStyles' : `use <${replacement.component}>`;
      findings.push(find(src, tag.start, 'native-element', replacement.value, verb, replacement.component, end));
    }
    if (/^[a-z]/.test(tag.name) && !TITLE_EXEMPT.has(tag.name) && hasAttr(tag, 'title')) {
      findings.push(find(src, tag.start, 'native-element', `<${tag.name} title>`, 'use <Tooltip>: the title attribute is slow, unstyled and unreachable by keyboard', 'Tooltip', end));
    }
  }
  return findings;
}

// ─── third-party-ui ────────────────────────────────────────────────────────

function thirdPartyUi(src: Source, ctx: Context): Finding[] {
  if (src.kind !== 'app') return [];
  return importsOf(src, ctx.known)
    .filter((binding) => /^(@base-ui\/react|@radix-ui\/)/.test(binding.spec))
    .map((binding) => {
      const offset = src.code.indexOf(binding.spec);
      return find(src, offset, 'third-party-ui', binding.spec, 'primitive library imported by a screen: wrap it in shared/ui so the look lives in one place');
    });
}

// ─── ds-ignore ─────────────────────────────────────────────────────────────

function ignoreWithoutReason(src: Source): Finding[] {
  const findings: Finding[] = [];
  for (const m of src.text.matchAll(/ds-ignore(?!:\s*\S)/g)) {
    findings.push(find(src, m.index ?? 0, 'ds-ignore', 'ds-ignore', 'an ignore needs a reason: ds-ignore: <why>'));
  }
  return findings;
}

// ─── Run ───────────────────────────────────────────────────────────────────

export const GATES = ['raw-color', 'palette', 'bridge', 'token-spelling', 'unknown-token', 'z-index', 'portal', 'raw-motion', 'raw-size', 'native-element', 'third-party-ui', 'ds-ignore'] as const;

/**
 * True when `ds-ignore: <reason>` sits on the line above the finding, on its
 * line, or anywhere inside a multi-line JSX opening tag it spans.
 */
function ignored(src: Source, f: Finding): boolean {
  for (let line = Math.max(1, f.line - 1); line <= (f.endLine ?? f.line); line++) {
    if (/ds-ignore:\s*\S/.test(lineText(src, line))) return true;
  }
  return false;
}

export function runGates(ctx: Context): Finding[] {
  const findings: Finding[] = [];
  for (const src of ctx.sources) {
    if (src.file.startsWith('scripts/')) continue;
    const own: Finding[] = [];
    if (src.kind !== 'exempt') own.push(...unknownToken(src, ctx.tokens));
    if (judged(src)) {
      own.push(...rawColor(src), ...palette(src, ctx.tokens), ...bridge(src, ctx.tokens), ...tokenSpelling(src, ctx.tokens),
        ...zIndex(src, ctx.tokens), ...portal(src, ctx), ...rawMotion(src, ctx.tokens, ctx), ...rawSize(src),
        ...nativeElement(src, ctx), ...thirdPartyUi(src, ctx));
    }
    own.push(...ignoreWithoutReason(src));
    findings.push(...own.filter((f) => f.rule === 'ds-ignore' || (!ignored(src, f) && !allowed(src.file, f.rule))));
  }
  return findings;
}

/** Every design-system instance in app code, keyed by component name. Used by the adoption metrics. */
export function instancesInApp(ctx: Context): { component: DsComponent; src: Source; tag: Tag }[] {
  const out: { component: DsComponent; src: Source; tag: Tag }[] = [];
  for (const src of ctx.sources) {
    if (src.kind !== 'app' || src.ext !== 'tsx') continue;
    const bindings = dsBindings(src, ctx.components, ctx.known);
    if (!bindings.size) continue;
    for (const tag of jsxTags(src.code, [...bindings.keys()])) {
      out.push({ component: bindings.get(tag.name)!, src, tag });
    }
  }
  return out;
}
