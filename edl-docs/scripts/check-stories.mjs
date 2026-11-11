// Renders every story (or those whose id or file matches the filter) in the
// running docs server and reports errors: a thrown render, a console error,
// or an empty canvas. With --shots <dir> it also saves a screenshot of each.
//
//   node edl-docs/scripts/check-stories.mjs [filter] [--dark] [--shots dir]
//
// Run from the Lume root, with `npm run docs` up on :6061.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const value = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);
const shots = value('--shots');
const filter = argv.find((a, i) => !a.startsWith('--') && argv[i - 1] !== '--shots') ?? '';
const base = process.env.DOCS_URL ?? 'http://localhost:6061';
const theme = flag('--dark') ? 'dark' : 'light';

const index = await (await fetch(`${base}/__edl/index.json`)).json();
for (const [file, message] of Object.entries(index.errors ?? {})) console.log(`INDEX ERROR ${file}: ${message}`);
const stories = index.order
  .map((id) => index.entries[id])
  .filter((e) => e.type === 'story' && (e.id.includes(filter) || (e.importPath ?? '').includes(filter)));

if (shots) fs.mkdirSync(shots, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
let failed = 0;
for (const story of stories) {
  const problems = [];
  const onConsole = (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    // Network noise from stores that try to reach Supabase in the canvas.
    if (/Failed to load resource|ERR_CONNECTION|127\.0\.0\.1:9|fetch failed|Failed to fetch/.test(text)) return;
    problems.push(`console: ${text.slice(0, 300)}`);
  };
  const onError = (e) => problems.push(`pageerror: ${e.message.slice(0, 300)}`);
  page.on('console', onConsole);
  page.on('pageerror', onError);
  await page.goto(`${base}/preview.html?id=${story.id}&globals=theme:${theme}`);
  await page.waitForTimeout(Number(process.env.WAIT ?? 1500));
  const state = await page.evaluate(() => {
    const root = document.getElementById('edl-root');
    const err = document.querySelector('.edl-render-error');
    const text = (root?.innerText ?? '') + [...document.body.children].filter((n) => n !== root && n.id !== 'edl-docs-root' && n.tagName !== 'SCRIPT').map((n) => n.innerText ?? '').join('');
    const sized = root ? [...root.querySelectorAll('*')].some((n) => n.getBoundingClientRect().width > 0) : false;
    return { error: err?.textContent?.slice(0, 300) ?? null, empty: !sized && !text.trim() };
  });
  if (state.error) problems.push(`render: ${state.error}`);
  if (state.empty) problems.push('empty canvas');
  if (shots) await page.screenshot({ path: path.join(shots, `${story.id}--${theme}.png`) });
  page.off('console', onConsole);
  page.off('pageerror', onError);
  if (problems.length) failed++;
  console.log(`${problems.length ? 'FAIL' : 'ok  '} ${story.id}${problems.length ? '\n     ' + problems.join('\n     ') : ''}`);
}
await browser.close();
console.log(`\n${stories.length - failed}/${stories.length} stories render cleanly (${theme}).`);
process.exit(failed ? 1 : 0);
