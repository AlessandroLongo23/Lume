// Records one tutorial's guided tour. See lib/recorder.mjs.
//
// Usage (from the repo root, app running): node video/record.mjs <scenario> [--fast]
//   --fast       play the flow without pacing or capture, to check the tour still runs
//   --inspect=N  stop at step N and print what is clickable inside its spotlight

import { record } from './lib/recorder.mjs';

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith('--'));
if (!slug) {
  console.error('usage: node video/record.mjs <scenario> [--fast] [--inspect=N]');
  process.exit(1);
}

try {
  const inspect = args.find((a) => a.startsWith('--inspect='));
  const r = await record(slug, {
    fast: args.includes('--fast') || Boolean(inspect),
    inspect: inspect ? Number(inspect.split('=')[1]) : null,
  });
  const cleaned = Object.entries(r.removed).map(([t, n]) => `${t} ${n}`).join(', ') || 'nothing';
  for (const w of r.warnings) console.warn(`${slug}: warning: ${w}`);
  console.log(`${slug}: ${r.steps} steps, ${(r.videoMs / 1000).toFixed(1)}s of video from ${(r.realMs / 1000).toFixed(1)}s real; cleaned up: ${cleaned}`);
} catch (err) {
  console.error(err.message);
  if (err.removed) console.error(`${slug}: cleaned up: ${JSON.stringify(err.removed)}`);
  process.exit(1);
}
