/**
 * Metrics: numbers to watch, which never fail a run. Each one reuses the gate
 * findings as its off-system side, so a metric and its gate cannot disagree.
 * What each metric can and cannot see is in README.md.
 */
import {
  type Context, type Finding,
  BOUNDARY, COLOR_PROPS, DATA_TABLE_AREAS, OPACITY,
  instancesInApp, isCheckboxRow,
} from './gates';
import {
  type DsComponent, type Tokens,
  ALLOW, STOCK_FAMILIES, TOKEN_FILES,
  areaOf, componentFiles, dsBindings, exemptReason, importsOf, jsxTags, lineOf, uniqueComponents,
} from './scan';

const pct = (part: number, whole: number) => (whole ? Number(((part / whole) * 100).toFixed(1)) : null);
const count = (text: string, re: RegExp) => (text.match(re) ?? []).length;
const judged = (ctx: Context) => ctx.sources.filter((src) => src.kind === 'ds' || src.kind === 'app');
const appTsx = (ctx: Context) => ctx.sources.filter((src) => src.kind === 'app' && src.ext === 'tsx');

// ─── component-adoption ───────────────────────────────────────────────────

/** Each replacing component and the design-system names that count as using it. */
const REPLACES: Record<string, string[]> = {
  Button: ['Button', 'TextButton'],
  FormInput: ['FormInput'],
  TextArea: ['TextArea'],
  Select: ['Select', 'PhonePrefixSelect'],
  Checkbox: ['Checkbox'],
  OptionGroup: ['OptionGroup', 'ToggleButton'],
  DateField: ['DateField'],
  DateTimeField: ['DateTimeField'],
  NumberInput: ['NumberInput'],
  Searchbar: ['Searchbar'],
  Slider: ['Slider'],
  PhoneNumber: ['PhoneNumber'],
  Field: ['Field'],
  Modal: ['Modal', 'AddModal', 'ConfirmDialog', 'DeleteModal', 'DeleteAllModal'],
  PageHeader: ['PageHeader'],
  TextLink: ['TextLink'],
  Tooltip: ['Tooltip'],
  tableStyles: [],
};

export function adoption(ctx: Context, findings: Finding[]) {
  const instances = instancesInApp(ctx);
  const native = findings.filter((f) => f.rule === 'native-element' && f.component);

  // tableStyles is a set of class strings, not a component: its uses are the tables in files that import it.
  const styledTables: { file: string }[] = [];
  for (const src of appTsx(ctx)) {
    if (!DATA_TABLE_AREAS.test(src.file)) continue;
    if (!importsOf(src, ctx.known).some((b) => /table\/tableStyles\.tsx?$/.test(b.target ?? ''))) continue;
    for (let i = 0; i < jsxTags(src.code, ['table']).length; i++) styledTables.push({ file: src.file });
  }

  const replacing = new Set(Object.values(REPLACES).flat());
  const systemUses = [
    ...instances.filter((i) => replacing.has(i.component.name)).map((i) => ({ file: i.src.file })),
    ...styledTables,
  ];

  const rows = Object.entries(REPLACES).map(([component, names]) => {
    const system = component === 'tableStyles'
      ? styledTables.length
      : instances.filter((i) => names.includes(i.component.name)).length;
    const nativeUses = native.filter((f) => f.component === component).length;
    return { component, system, native: nativeUses, adoption: pct(system, system + nativeUses) };
  }).filter((row) => row.system + row.native > 0)
    .sort((a, b) => b.native - a.native || b.system - a.system);

  const areas = new Map<string, { system: number; native: number }>();
  for (const use of systemUses) {
    const area = areas.get(areaOf(use.file)) ?? { system: 0, native: 0 };
    area.system++;
    areas.set(areaOf(use.file), area);
  }
  for (const f of native) {
    const area = areas.get(areaOf(f.file)) ?? { system: 0, native: 0 };
    area.native++;
    areas.set(areaOf(f.file), area);
  }

  // Reach: screen files (they render HTML elements) that import anything from the library or use a recipe.
  const dsFiles = new Set(ctx.sources.filter((s) => s.kind === 'ds').map((s) => s.file));
  const recipe = new RegExp(`${BOUNDARY}(?:${[...ctx.tokens.recipes].join('|')})(?![\\w-])`);
  const screens = appTsx(ctx).filter((src) => jsxTags(src.code, null).some((tag) => /^[a-z]/.test(tag.name)));
  const screensUsingDs = screens.filter((src) => importsOf(src, ctx.known).some((b) => b.target && dsFiles.has(b.target)) || recipe.test(src.code));

  return {
    adoption: pct(systemUses.length, systemUses.length + native.length),
    system: systemUses.length,
    native: native.length,
    components: rows,
    areas: [...areas].map(([area, v]) => ({ area, ...v, adoption: pct(v.system, v.system + v.native) }))
      .sort((a, b) => (a.adoption ?? 100) - (b.adoption ?? 100)),
    reach: { files: screens.length, usingDesignSystem: screensUsingDs.length, share: pct(screensUsingDs.length, screens.length) },
    instances: instances.length,
    componentsUsed: new Set(instances.map((i) => i.component.name)).size,
  };
}

// ─── token-coverage ───────────────────────────────────────────────────────

const COLOUR_VALUE = /^(#|rgba?\(|hsla?\(|oklch\(|oklab\(|lab\(|lch\(|color-mix\(|transparent\b|currentColor\b|white\b|black\b|var\(--color-)/;

/** --lume-* tokens whose value is a colour, following var() chains. */
function colourTokens(tokens: Tokens): Set<string> {
  const memo = new Map<string, boolean>();
  const isColour = (name: string, depth = 0): boolean => {
    if (memo.has(name)) return memo.get(name)!;
    const value = tokens.defs.get(name)?.[0]?.value ?? '';
    let result = COLOUR_VALUE.test(value);
    const ref = value.match(/^var\(\s*(--[\w-]+)\s*\)$/);
    if (!result && ref && depth < 8) result = isColour(ref[1], depth + 1);
    memo.set(name, result);
    return result;
  };
  return new Set([...tokens.defs.keys()].filter((name) => name.startsWith('--lume-') && isColour(name)));
}

function sizeCategory(value: string): string | null {
  if (/^(text-\[|fontSize|font-size|font-\[|fontWeight|leading|lineHeight|line-height|tracking|letterSpacing|letter-spacing)/.test(value)) return 'type';
  if (/^(rounded|borderRadius|border-radius)/.test(value)) return 'radius';
  if (/^(shadow|boxShadow|box-shadow)/.test(value)) return 'shadow';
  if (/^-?(p[xytrblse]?-\[|m[xytrblse]?-\[|gap|space|padding|margin|row-gap|column-gap|rowGap|columnGap)/.test(value)) return 'spacing';
  return null;
}

export function tokenCoverage(ctx: Context, findings: Finding[]) {
  const { tokens } = ctx;
  const colours = colourTokens(tokens);
  const tokenUtilities = [...tokens.colorUtilities].filter(([, kind]) => kind === 'token').map(([name]) => name).sort((a, b) => b.length - a.length);
  const semanticUtility = new RegExp(`${BOUNDARY}(?:${COLOR_PROPS})-(?:${tokenUtilities.join('|')})${OPACITY}(?![\\w-])`, 'g');
  const fontSizes = [...new Set([...tokens.fontSizes, '7xl', '8xl', '9xl'])].sort((a, b) => b.length - a.length).join('|');
  const tiers = [...tokens.zTiers.keys()].sort((a, b) => b.length - a.length).join('|');

  const tally = {
    colour: { token: 0, bridge: 0, palette: 0, literal: 0 },
    type: { token: 0, literal: 0 },
    spacing: { token: 0, literal: 0, halfSteps: 0 },
    radius: { token: 0, literal: 0 },
    shadow: { token: 0, literal: 0 },
    zIndex: { token: 0, literal: 0 },
    motion: { token: 0, literal: 0 },
  };
  for (const src of judged(ctx)) {
    const code = src.code;
    for (const m of code.matchAll(/var\(\s*(--lume-[\w-]+)|[\w\]]-\((--lume-[\w-]+)\)/g)) {
      if (colours.has(m[1] ?? m[2])) tally.colour.token++;
    }
    tally.colour.token += count(code, semanticUtility);

    tally.type.token += count(code, new RegExp(`${BOUNDARY}text-(?:${fontSizes})(?:\\/[\\w.]+)?(?![\\w-])`, 'g'))
      + count(code, new RegExp(`${BOUNDARY}(?:leading-(?:none|tight|snug|normal|relaxed|loose)|tracking-(?:tighter|tight|normal|wide|wider|widest)|font-(?:thin|extralight|light|normal|regular|medium|semibold|bold|extrabold|black))(?![\\w-])`, 'g'))
      + count(code, /var\(\s*--(text|leading|tracking|font-weight|lume-control-text)-/g);

    const spacing = [...code.matchAll(new RegExp(`${BOUNDARY}-?(?:p[xytrblse]?|m[xytrblse]?|gap(?:-[xy])?|space-[xy])-(\\d+(?:\\.\\d+)?|px)(?![\\w-])`, 'g'))];
    tally.spacing.token += spacing.length + count(code, /var\(\s*--(spacing|lume-control-(px|gap)-)/g);
    tally.spacing.halfSteps += spacing.filter((m) => /\.5$|^px$/.test(m[2])).length;

    tally.radius.token += count(code, new RegExp(`${BOUNDARY}rounded(?:-[trblse]{1,2})?(?:-(?:none|xs|sm|md|lg|xl|2xl|3xl|4xl|full))?(?![\\w\\[-])`, 'g'))
      + count(code, /var\(\s*--radius-/g);
    tally.shadow.token += count(code, new RegExp(`${BOUNDARY}(?:shadow-(?:2xs|xs|sm|md|lg|xl|2xl|float|none|inner)|edge)(?![\\w-])`, 'g'))
      + count(code, /shadow-\[[^\]]*var\(--lume-/g) + count(code, /var\(\s*--(shadow-|lume-shadow)/g);
    tally.zIndex.token += count(code, new RegExp(`${BOUNDARY}z-(?:${tiers})(?![\\w-])`, 'g')) + count(code, /var\(\s*--z-/g);

    const motionLines = code.split('\n').filter((line) => !/^\s*import\b/.test(line)).join('\n');
    tally.motion.token += count(code, /var\(\s*--(duration|ease)-/g)
      + count(code, new RegExp(`${BOUNDARY}ease-(?:out|in-out|glide|spring)(?![\\w-])`, 'g'))
      + count(motionLines, /\b(DURATION(\.\w+|_\w+)|EASE_[A-Z_]+|SPRING)\b/g);
  }

  for (const f of findings) {
    if (f.rule === 'raw-color') tally.colour.literal++;
    else if (f.rule === 'palette') tally.colour.palette++;
    else if (f.rule === 'bridge') tally.colour.bridge++;
    else if (f.rule === 'z-index') tally.zIndex.literal++;
    else if (f.rule === 'raw-motion') tally.motion.literal++;
    else if (f.rule === 'raw-size') {
      const category = sizeCategory(f.value) as keyof typeof tally | null;
      if (category && category in tally) (tally[category] as { literal: number }).literal++;
    }
  }

  const rows = Object.entries(tally).map(([category, t]) => {
    const off = 'bridge' in t ? t.bridge + t.palette + t.literal : t.literal;
    return { category, ...t, coverage: pct(t.token, t.token + off) };
  });
  return { categories: rows };
}

// ─── override-rate ────────────────────────────────────────────────────────

/** Utilities that change how a component looks, as opposed to where it sits. */
const VISUAL = /(^|[\s"'`{(:!])(bg-|text-(?!left|right|center|start|end|balance|pretty|wrap|nowrap|ellipsis|clip|justify)|border|rounded|shadow|font-|ring-|opacity-|p[xytrblse]?-\d|h-|size-|leading-|tracking-)/;

export function overrides(ctx: Context) {
  const rows = new Map<string, { instances: number; overridden: number; visual: number }>();
  for (const { component, tag } of instancesInApp(ctx)) {
    const row = rows.get(component.name) ?? { instances: 0, overridden: 0, visual: 0 };
    row.instances++;
    const classText = tag.text.match(/\s(className|style)\s*=\s*(\{[\s\S]*?\}(?=\s+\w+=|\s*\/?>)|"[^"]*"|'[^']*')/g)?.join(' ') ?? '';
    if (classText) {
      row.overridden++;
      if (VISUAL.test(classText) || /\sstyle\s*=/.test(classText)) row.visual++;
    }
    rows.set(component.name, row);
  }
  const all = [...rows].map(([component, r]) => ({ component, ...r, visualRate: pct(r.visual, r.instances) }));
  const instances = all.reduce((n, r) => n + r.instances, 0);
  const overridden = all.reduce((n, r) => n + r.overridden, 0);
  const visual = all.reduce((n, r) => n + r.visual, 0);
  return {
    instances,
    overriddenRate: pct(overridden, instances),
    visualRate: pct(visual, instances),
    components: all.filter((r) => r.instances >= 5).sort((a, b) => (b.visualRate ?? 0) - (a.visualRate ?? 0)).slice(0, 12),
  };
}

// ─── unused-components and story-coverage ─────────────────────────────────

export function library(ctx: Context) {
  const all: DsComponent[] = uniqueComponents(ctx.components);
  const inApp = new Map<string, number>();
  for (const { component } of instancesInApp(ctx)) inApp.set(`${component.file}#${component.name}`, (inApp.get(`${component.file}#${component.name}`) ?? 0) + 1);

  const inDs = new Map<string, number>();
  for (const src of ctx.sources.filter((s) => s.kind === 'ds' && s.ext === 'tsx')) {
    const bindings = dsBindings(src, ctx.components, ctx.known);
    // Same-file uses count too (a part used by its parent): find local exports by name.
    for (const c of ctx.components.get(src.file) ?? []) bindings.set(c.name, c);
    for (const tag of jsxTags(src.code, [...bindings.keys()])) {
      const c = bindings.get(tag.name)!;
      if (c.file === src.file && tag.text.includes(`function ${c.name}`)) continue;
      inDs.set(`${c.file}#${c.name}`, (inDs.get(`${c.file}#${c.name}`) ?? 0) + 1);
    }
  }

  const key = (c: DsComponent) => `${c.file}#${c.name}`;
  const unused = all.filter((c) => !inApp.get(key(c)) && !inDs.get(key(c)));
  const internalOnly = all.filter((c) => !inApp.get(key(c)) && inDs.get(key(c)));
  const files = componentFiles(ctx.components);
  const storied = files.filter(([, list]) => list.some((c) => c.storied));

  return {
    components: all.length,
    files: files.length,
    storyCoverage: pct(storied.length, files.length),
    unstoried: files.filter(([, list]) => !list.some((c) => c.storied)).map(([file]) => file),
    unused: unused.map((c) => `${c.name} (${c.file})`),
    internalOnly: internalOnly.map((c) => c.name),
    mostUsed: all.map((c) => ({ component: c.name, uses: inApp.get(key(c)) ?? 0 })).sort((a, b) => b.uses - a.uses).slice(0, 10),
  };
}

// ─── promotion-candidates ─────────────────────────────────────────────────

/** A local component named for a library role that does not use the library piece for that role. */
const ROLES: { suffix: RegExp; role: string; uses: RegExp }[] = [
  { suffix: /(Modal|Dialog)$/, role: 'dialog', uses: /shared\/ui\/(modals\/|SidePanel)/ },
  { suffix: /(Popover|Dropdown|Menu)$/, role: 'floating menu', uses: /shared\/ui\/(FloatingPanel|DropdownMenu|HoverPopover|list\/ListBox|Portal)|@base-ui\/react/ },
  { suffix: /(Badge|Chip|Pill)$/, role: 'badge or chip', uses: /shared\/ui\/(Tag|StatusDot|NumberBadge|detail\/DetailChip)/ },
  { suffix: /Tabs$/, role: 'tab bar', uses: /shared\/ui\/Tabs/ },
  { suffix: /Tooltip$/, role: 'tooltip', uses: /shared\/ui\/Tooltip/ },
  { suffix: /(Picker|Select|Input)$/, role: 'form control', uses: /shared\/ui\/(forms\/|Searchbar|ComuneAutocomplete|list\/ListBox|FloatingPanel)/ },
  { suffix: /Button$/, role: 'button', uses: /shared\/ui\/Button/ },
];

export function promotionCandidates(ctx: Context) {
  const out: { file: string; role: string }[] = [];
  for (const src of appTsx(ctx)) {
    const base = src.file.split('/').pop()!.replace(/\.tsx$/, '');
    const role = ROLES.find((r) => r.suffix.test(base));
    if (!role) continue;
    // A `ds-ignore: <reason>` in the file's opening lines says why it stays local.
    if (/ds-ignore:\s*\S/.test(src.text.split('\n').slice(0, 15).join('\n'))) continue;
    const specs = importsOf(src, ctx.known).map((b) => b.target ?? b.spec).join('\n');
    if (!role.uses.test(specs)) out.push({ file: src.file, role: role.role });
  }
  return out;
}

// ─── hand-rolled patterns (the "Not" column of shared/ui/README.md) ───────

export function handRolled(ctx: Context) {
  const patterns: Record<string, { why: string; files: Map<string, number> }> = {
    'checkbox row': { why: 'a <label> around a Checkbox or Switch: no component covers it (a gap, like SwitchRow for switches)', files: new Map() },
    'row hover': { why: 'hover:bg-… in screen code: list rows get the hover glide from ListBox', files: new Map() },
    'hand-made card': { why: 'border/edge + rounded + surface fill without surface-card', files: new Map() },
    'hand-made floating surface': { why: 'fixed/absolute + a large shadow without surface-float', files: new Map() },
    'key switch': { why: 'switch (e.key) in screen code: useListNavigation handles arrow keys', files: new Map() },
    'button restyle': { why: 'a muted-text or touch-height override on <Button>, which it already does', files: new Map() },
  };
  const bump = (name: string, file: string) => patterns[name].files.set(file, (patterns[name].files.get(file) ?? 0) + 1);

  for (const src of appTsx(ctx)) {
    // A `ds-ignore: <reason>` on the line, the line above, or inside the tag explains a deliberate exception.
    const lines = src.text.split('\n');
    const explained = (start: number, end = start) => {
      const first = lineOf(src, start);
      const last = lineOf(src, end);
      return lines.slice(Math.max(0, first - 2), last).some((line) => /ds-ignore:\s*\S/.test(line));
    };
    for (const tag of jsxTags(src.code, ['label'])) {
      if (isCheckboxRow(src.code, tag) && !explained(tag.start, tag.start + tag.text.length)) bump('checkbox row', src.file);
    }
    for (const m of src.code.matchAll(/(^|[\s"'`])hover:bg-/g)) if (!explained(m.index ?? 0)) bump('row hover', src.file);
    for (const m of src.code.matchAll(/["'`]([^"'`\n]{20,})["'`]/g)) {
      const cls = m[1];
      if (/surface-(card|float)/.test(cls) || explained(m.index ?? 0)) continue;
      if (/(^|\s)(border|edge)(\s|$)|shadow-\[inset/.test(cls) && /rounded-(lg|xl|2xl)/.test(cls) && /bg-(\[var\(--lume-(surface-raised|panel|surface)\)\]|card)/.test(cls)) bump('hand-made card', src.file);
      if (/(^|\s)(fixed|absolute)(\s|$)/.test(cls) && /shadow-(lg|xl|2xl|float)/.test(cls)) bump('hand-made floating surface', src.file);
    }
    for (const m of src.code.matchAll(/switch\s*\(\s*\w+\.key\s*\)/g)) if (!explained(m.index ?? 0)) bump('key switch', src.file);
    const bindings = dsBindings(src, ctx.components, ctx.known);
    const buttons = [...bindings].filter(([, c]) => c.name === 'Button').map(([local]) => local);
    for (const tag of jsxTags(src.code, buttons)) {
      if (/text-\[var\(--lume-text-muted\)\]|pointer-coarse:h-11/.test(tag.text) && !explained(tag.start, tag.start + tag.text.length)) bump('button restyle', src.file);
    }
  }
  return Object.entries(patterns).map(([pattern, { why, files }]) => ({
    pattern,
    why,
    count: [...files.values()].reduce((a, b) => a + b, 0),
    top: [...files].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([file, n]) => `${file} (${n})`),
  }));
}

// ─── token-layer ──────────────────────────────────────────────────────────

export function tokenLayer(ctx: Context, findings: Finding[]) {
  const { tokens } = ctx;
  const byFile = new Map<string, Set<string>>();
  for (const [name, defs] of tokens.defs) {
    for (const def of defs) {
      if (!TOKEN_FILES.includes(def.file)) continue;
      const set = byFile.get(def.file) ?? new Set();
      set.add(name);
      byFile.set(def.file, set);
    }
  }

  const semantic = [...tokens.defs.values()].flat().filter((d) => d.file === 'src/styles/tokens/semantic.css' && d.name.startsWith('--lume-'));
  const literals = semantic.filter((d) => !/var\(/.test(d.value) && !/^(transparent|currentColor|inherit)$/.test(d.value));
  const stockRefs = [...tokens.defs.values()].flat()
    .filter((d) => TOKEN_FILES.includes(d.file) && new RegExp(`var\\(--color-(${STOCK_FAMILIES.join('|')})-`).test(d.value));

  const colours = colourTokens(tokens);
  const light = new Set(semantic.filter((d) => d.scope === ':root').map((d) => d.name));
  const dark = new Set(semantic.filter((d) => d.scope === '.dark').map((d) => d.name));
  const lightOnly = [...light].filter((name) => colours.has(name) && !dark.has(name));

  // References from every non-story file, in var(), Tailwind shorthand or a string ('--lume-x').
  const refs = new Map<string, number>();
  for (const src of ctx.sources) {
    if (src.kind === 'story') continue;
    for (const m of src.code.matchAll(/var\(\s*(--lume-[\w-]+)|[\w\]]-\((--lume-[\w-]+)\)|['"`](--lume-[\w-]+)['"`]/g)) {
      const name = m[1] ?? m[2] ?? m[3];
      refs.set(name, (refs.get(name) ?? 0) + 1);
    }
  }
  const lumeNames = [...tokens.defs.keys()].filter((name) => name.startsWith('--lume-'));
  const dead = lumeNames.filter((name) => !refs.get(name));

  const palette = ctx.sources.find((s) => s.file === 'src/styles/tokens/palette.css');
  return {
    definitions: Object.fromEntries([...byFile].map(([file, set]) => [file.replace('src/styles/', '').replace('src/app/', ''), set.size])),
    semanticTokens: new Set(semantic.map((d) => d.name)).size,
    semanticLiterals: { count: literals.length, light: literals.filter((d) => d.scope === ':root').length, dark: literals.filter((d) => d.scope === '.dark').length, examples: literals.slice(0, 6).map((d) => `${d.name}: ${d.value} (${d.scope})`) },
    stockPaletteRefs: stockRefs.map((d) => `${d.name}: ${d.value} (${d.file}:${d.line})`),
    lightOnlyColourTokens: lightOnly,
    deadTokens: dead,
    unknownTokenRefs: findings.filter((f) => f.rule === 'unknown-token').length,
    stockPaletteCompiled: !/--color-\*\s*:\s*initial/.test(palette?.code ?? ''),
  };
}

// ─── escape-hatches ───────────────────────────────────────────────────────

/** Tailwind's important modifier inside a class string: `!bg-x` (v3 style) or `bg-x!` (v4). */
const IMPORTANT_UTILITY = /(^|\s)![a-z][\w-]*-[\w[\]/.%()-]+|(^|\s)[a-z][\w:-]*-[\w[\]/.%()-]+!(?=\s|$)/g;

export function escapeHatches(ctx: Context, baselineSize: number) {
  let ignores = 0;
  let important = 0;
  let darkVariants = 0;
  const darkFiles = new Map<string, number>();
  for (const src of ctx.sources) {
    if (src.kind === 'story') continue;
    ignores += count(src.text, /ds-ignore:\s*\S/g);
    if (src.kind !== 'ds' && src.kind !== 'app') continue;
    if (src.ext === 'css') important += count(src.code, /!important/g);
    else for (const m of src.code.matchAll(/["'`]([^"'`\n]*)["'`]/g)) important += count(m[1], IMPORTANT_UTILITY);
    const dark = count(src.code, /(^|[\s"'`])dark:/g);
    if (dark) {
      darkVariants += dark;
      darkFiles.set(src.file, dark);
    }
  }
  const exempt = new Map<string, number>();
  for (const src of ctx.sources.filter((s) => s.kind === 'exempt')) {
    const reason = exemptReason(src.file) ?? '';
    exempt.set(reason, (exempt.get(reason) ?? 0) + 1);
  }
  return {
    ignores,
    allowEntries: ALLOW.length,
    exemptFiles: ctx.sources.filter((s) => s.kind === 'exempt').length,
    exemptByReason: [...exempt].map(([reason, files]) => ({ reason, files })),
    baseline: baselineSize,
    importantModifiers: important,
    darkVariants,
    darkFiles: [...darkFiles].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([file, n]) => `${file} (${n})`),
  };
}
