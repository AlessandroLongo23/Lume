// Records and renders every tutorial video against the app that is running.
//
// Usage (from the repo root): node video/all.mjs [--only=a,b] [--check]
//   --only=a,b  limit the run to these scenarios
//   --check     play every tour without recording or rendering: a smoke test
//               that the guides still run end to end on this frontend
//
// Needs: the app reachable at E2E_BASE_URL (default http://localhost:3000),
// pointed at the staging database; the E2E_* and Supabase variables of
// .env.test in the environment; ffmpeg on the PATH. Exits non-zero if any
// tutorial fails, and writes video/out/report.json either way.

import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { record } from './lib/recorder.mjs';

const VIDEO_DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(VIDEO_DIR, 'out');

const args = process.argv.slice(2);
const check = args.includes('--check');
const only = args.find((a) => a.startsWith('--only='))?.slice('--only='.length).split(',');
const all = readdirSync(path.join(VIDEO_DIR, 'scenarios'))
  .filter((f) => f.endsWith('.mjs'))
  .map((f) => f.slice(0, -'.mjs'.length))
  .sort();
const unknown = (only ?? []).filter((s) => !all.includes(s));
if (unknown.length > 0) {
  console.error(`unknown scenario: ${unknown.join(', ')}`);
  process.exit(1);
}
const slugs = only ?? all;

const seconds = (ms) => `${(ms / 1000).toFixed(0)}s`;
const report = [];

// One at a time: the tours share one demo salon, and each run cleans up by
// removing what appeared in it since the run began.
for (const slug of slugs) {
  const entry = { slug, ok: false, warnings: [], error: null, videoMs: null, output: null };
  report.push(entry);
  try {
    const r = await record(slug, { fast: check });
    entry.ok = true;
    entry.warnings = r.warnings;
    entry.videoMs = r.videoMs;
    console.log(`recorded  ${slug}  ${r.steps} steps, ${seconds(r.videoMs)}${check ? ' (check only)' : ''}`);
  } catch (err) {
    entry.error = err.message;
    console.error(`FAILED    ${err.message}`);
  }
}

if (!check) {
  const recorded = report.filter((e) => e.ok);
  if (recorded.length > 0) {
    // Bundled once, after recording: the bundle takes a copy of video/public.
    const serveUrl = await bundle({
      entryPoint: path.join(VIDEO_DIR, 'src/index.ts'),
      publicDir: path.join(VIDEO_DIR, 'public'),
    });
    mkdirSync(OUT, { recursive: true });
    for (const entry of recorded) {
      const inputProps = { slug: entry.slug, timeline: null };
      const outputLocation = path.join(OUT, `${entry.slug}.mp4`);
      try {
        const composition = await selectComposition({ serveUrl, id: 'Tutorial', inputProps });
        await renderMedia({ composition, serveUrl, codec: 'h264', crf: 18, outputLocation, inputProps });
        // The poster shown before playback: the title card, once it has faded in.
        execFileSync('ffmpeg', [
          '-y', '-loglevel', 'error', '-ss', '1.5', '-i', outputLocation,
          '-frames:v', '1', '-q:v', '3', path.join(OUT, `${entry.slug}.jpg`),
        ]);
        entry.output = path.relative(path.resolve(VIDEO_DIR, '..'), outputLocation);
        console.log(`rendered  ${entry.output}`);
      } catch (err) {
        entry.ok = false;
        entry.error = `${entry.slug}: render: ${err.message.split('\n')[0]}`;
        console.error(`FAILED    ${entry.error}`);
      }
    }
  }
}

mkdirSync(OUT, { recursive: true });
writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));

const failed = report.filter((e) => !e.ok);
const warned = report.filter((e) => e.warnings.length > 0);
console.log(`\n${report.length - failed.length} of ${report.length} ${check ? 'tours ran' : 'videos done'}`);
for (const e of warned) for (const w of e.warnings) console.log(`warning   ${e.slug}: ${w}`);
for (const e of failed) console.log(`failed    ${e.error}`);
process.exit(failed.length > 0 ? 1 : 0);
