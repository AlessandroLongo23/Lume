// Publishes the rendered videos to Supabase Storage, where the tutorial pages
// read them from (see `Tutorial.videoPath` in src/lib/tutorials/registry.ts).
//
// Usage (from the repo root, after all.mjs): node video/upload.mjs [--only=a,b]
//
// Each video/out/<slug>.mp4 goes to the public bucket `tutorials` as
// <slug>/video.mp4, with its poster frame next to it as <slug>/poster.jpg.
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, from the
// environment or .env.test.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';

const VIDEO_DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(VIDEO_DIR, 'out');
loadEnv({ path: path.resolve(VIDEO_DIR, '..', '.env.test'), quiet: true });

const BUCKET = 'tutorials';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const only = process.argv.slice(2).find((a) => a.startsWith('--only='))?.slice('--only='.length).split(',');
const slugs = readdirSync(OUT)
  .filter((f) => f.endsWith('.mp4'))
  .map((f) => f.slice(0, -'.mp4'.length))
  .filter((s) => !only || only.includes(s))
  .sort();
if (slugs.length === 0) {
  console.error('nothing to upload: no .mp4 in video/out (run all.mjs first)');
  process.exit(1);
}

const { data: buckets, error: listError } = await db.storage.listBuckets();
if (listError) throw new Error(`list buckets: ${listError.message}`);
if (!buckets.some((b) => b.name === BUCKET)) {
  const { error } = await db.storage.createBucket(BUCKET, { public: true });
  if (error) throw new Error(`create bucket: ${error.message}`);
  console.log(`created public bucket ${BUCKET}`);
}

let failed = 0;
for (const slug of slugs) {
  const files = [
    [`${slug}.mp4`, `${slug}/video.mp4`, 'video/mp4'],
    [`${slug}.jpg`, `${slug}/poster.jpg`, 'image/jpeg'],
  ];
  for (const [local, remote, contentType] of files) {
    const file = path.join(OUT, local);
    if (!existsSync(file)) continue;
    // A short cache: a regenerated video replaces the file at the same address.
    // Large uploads over a slow line drop now and then, so try a few times.
    let error = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      ({ error } = await db.storage
        .from(BUCKET)
        .upload(remote, readFileSync(file), { contentType, upsert: true, cacheControl: '3600' }));
      if (!error) break;
    }
    if (error) {
      failed++;
      console.error(`FAILED    ${remote}: ${error.message}`);
    } else {
      console.log(`uploaded  ${remote}`);
    }
  }
}
process.exit(failed > 0 ? 1 : 0);
