// Plays one guided tour in the running app and records it. Writes, under
// video/public/<slug>/:
//   raw.mp4        constant-fps screen recording, no cursor
//   timeline.json  per-step timing, target and card rects, cursor moves, clicks
// The Remotion composition in video/src turns those two into the final video.
//
// The recorder is generic: what to do at each step is read off the same fields
// the tour uses to decide when to advance. A scenario (video/scenarios/<slug>.mjs)
// only adds what the tour cannot know: text to type, and how to perform the
// steps whose action is a choice (pick a client, click a free slot).

import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import { chromium } from 'playwright';
import { restore, snapshot } from './cleanup.mjs';

const VIDEO_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = path.resolve(VIDEO_DIR, '..');
// CI provides the environment itself; locally it comes from .env.test.
loadEnv({ path: path.join(ROOT, '.env.test'), quiet: true });

const VIEWPORT = { width: 1280, height: 720 };
const SCALE = 2;
const FPS = 30;
const TIMEZONE = 'Europe/Rome';

/**
 * The moment every recording pretends it is: the latest Wednesday, mid-morning.
 * The calendar opens on working hours whenever the pipeline runs (a Sunday
 * night included), and the videos do not change with the time of day. Never in
 * the future, so the session token does not look expired to the app.
 */
export function stageTime() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 4) % 7));
  d.setUTCHours(9, 30, 0, 0);
  // 10:30 in Rome is 09:30 UTC in winter and 08:30 in summer.
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: TIMEZONE, hour: '2-digit', hourCycle: 'h23' }).format(d),
  );
  d.setUTCHours(d.getUTCHours() - (hour - 10));
  if (d > new Date()) d.setUTCDate(d.getUTCDate() - 7);
  return d;
}

/** A date as a `datetime-local` input wants it, in the salon's timezone. */
export function inputDateTime(date) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: TIMEZONE, dateStyle: 'short', timeStyle: 'short' })
    .format(date)
    .replace(' ', 'T');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
// Time a tour card needs on screen: a floor plus a per-word allowance.
const readMs = (text) => Math.max(1500, 400 + text.split(/\s+/).length * 180);

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`missing ${name} (set it in the environment or in .env.test)`);
  return value;
}

/**
 * @param {string} slug       scenario name, the file under video/scenarios
 * @param {{ fast?: boolean, inspect?: number | null }} [options]
 *   `fast` plays the flow without pacing or capture, to check that a tour still
 *   runs end to end. `inspect` stops at that step and prints what is clickable
 *   inside its spotlight, for writing a scenario's `actions`.
 */
export async function record(slug, { fast = false, inspect = null } = {}) {
  const base = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
  const salonId = requireEnv('E2E_TEST_SALON_ID');
  const { default: scenario } = await import(`../scenarios/${slug}.mjs`);
  const { getTour } = await import(path.join(ROOT, 'src/lib/tutorials/tours/index.ts'));
  const tour = getTour(scenario.tourId);
  if (!tour) throw new Error(`tour not found: ${scenario.tourId}`);
  if (!tour.endRoute) throw new Error(`tour ${scenario.tourId} has no endRoute to start from`);

  const db = createClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // A real device scale factor, not the emulated `deviceScaleFactor`: the CDP
  // screencast captures emulated pages at 1x, and the composition needs the extra
  // pixels to zoom into a field without going soft.
  const browser = await chromium.launch({ args: [`--force-device-scale-factor=${SCALE}`] });
  const context = await browser.newContext({ viewport: VIEWPORT, locale: 'it-IT', timezoneId: TIMEZONE });
  // Generous timeouts: on a busy machine the dev server can take a while, and
  // waiting costs nothing in the video because real time is remapped.
  context.setDefaultTimeout(fast ? 30000 : 120000);
  context.setDefaultNavigationTimeout(120000);
  const stage = stageTime();
  const page = await context.newPage();
  // Shift the page's `Date` back to the stage time. Only `Date` moves: timers,
  // animation frames and `performance.now()` keep running for real, which the
  // tour and the app's animations rely on (Playwright's own fake clock replaces
  // those too, and the tours stop advancing under it).
  await page.addInitScript((offset) => {
    const RealDate = Date;
    class StageDate extends RealDate {
      constructor(...args) {
        if (args.length === 0) super(RealDate.now() + offset);
        else super(...args);
      }
      static now() {
        return RealDate.now() + offset;
      }
    }
    globalThis.Date = StageDate;
  }, stage.getTime() - Date.now());
  // The Next.js dev indicator is not part of the product.
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.textContent = 'nextjs-portal { display: none !important; }';
    document.addEventListener('DOMContentLoaded', () => document.head.appendChild(style));
  });
  const cdp = await context.newCDPSession(page);
  // Kept for the failure report: what the app itself complained about.
  const complaints = [];
  page.on('console', (m) => { if (m.type() === 'error') complaints.push(`console: ${m.text().split('\n')[0].slice(0, 200)}`); });
  page.on('response', (r) => {
    if (r.status() < 400) return;
    const line = `${r.status()} ${r.request().method()} ${r.url().split('?')[0]}`;
    complaints.push(line);
    // The body usually names the cause (a constraint, a missing column).
    r.text().then((body) => complaints.push(`${line}: ${body.slice(0, 300)}`)).catch(() => {});
  });

  // Epoch milliseconds, so our own events and the browser's frame timestamps
  // share one clock.
  const clock = () => performance.timeOrigin + performance.now();
  let t0 = clock();
  const now = () => clock() - t0;

  // Video time. The flow runs in real time, so a busy machine stretches it: a
  // keystroke that should take 120ms can take seconds. Every wait therefore
  // declares how long it lasts in the video, and `marks` pairs the real clock
  // with the video clock at that point. Frames and events are logged in real
  // time and mapped through `toVideo` at the end, which makes the pacing the
  // same on every run.
  let marks = [[0, 0]];
  function advance(videoMs) {
    const [lastReal, lastVideo] = marks.at(-1);
    marks.push([Math.max(now(), lastReal + 0.001), lastVideo + videoMs]);
  }
  /** Waits `ms`, which is also what it lasts in the video. */
  async function pause(ms) {
    // Fast mode still waits a little: scrolls and focus changes need real time.
    await sleep(fast ? Math.min(ms, 120) : ms);
    advance(ms);
  }
  /** Waits for the app; lasts as long as it really took, up to `capMs`. */
  async function settle(fn, capMs) {
    const start = now();
    await fn();
    advance(Math.min(now() - start, capMs));
  }
  function toVideo(real) {
    const i = marks.findLastIndex(([r]) => r <= real);
    if (i < 0) return 0;
    const [r0, v0] = marks[i];
    if (i === marks.length - 1) return Math.round(v0);
    const [r1, v1] = marks[i + 1];
    return Math.round(v0 + ((real - r0) / (r1 - r0)) * (v1 - v0));
  }

  const frames = [];
  // Parked on the empty stretch of the top bar, where nothing reacts to hover.
  let cursor = { x: 520, y: 31 };
  const timeline = {
    slug,
    title: scenario.title,
    subtitle: scenario.subtitle,
    fps: FPS,
    viewport: VIEWPORT,
    cursorStart: { ...cursor },
    steps: [],
    moves: [],
    clicks: [],
    typing: [],
    durationMs: 0,
  };

  /** The tour card for step `i`: NextStep renders one dialog, labelled by the step title. */
  const cardFor = (i) =>
    page
      .getByRole('dialog', { name: tour.steps[i].title, exact: true })
      .filter({ hasText: `${i + 1} / ${tour.steps.length}` });

  async function moveTo(x, y) {
    const from = { ...cursor };
    const duration = Math.min(1100, Math.max(450, Math.hypot(x - from.x, y - from.y) * 1.1));
    const start = now();
    for (;;) {
      const p = fast ? 1 : Math.min(1, (now() - start) / duration);
      const e = easeInOut(p);
      await page.mouse.move(from.x + (x - from.x) * e, from.y + (y - from.y) * e);
      if (p >= 1) break;
      await sleep(12);
    }
    advance(duration);
    timeline.moves.push({ t0: start, t1: now(), from, to: { x, y } });
    cursor = { x, y };
  }

  async function clickAt(box) {
    await moveTo(box.x + box.width / 2, box.y + box.height / 2);
    await pause(320);
    const t = now();
    timeline.clicks.push({ t, ...cursor });
    await page.mouse.down();
    await pause(70);
    await page.mouse.up();
    return t;
  }

  /**
   * Clicks a step's own target. The tour's overlay blocks clicks outside the
   * spotlight, and a spotlight that has slipped off its target leaves only part
   * of it clickable: find a spot that still is, the way a user would, and say so.
   */
  async function clickTarget(target, i, title) {
    const spot = await target.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const hits = (x, y) => {
        const top = document.elementFromPoint(x, y);
        return top !== null && (el === top || el.contains(top));
      };
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      if (hits(cx, cy)) return { x: cx, y: cy, centred: true };
      const candidates = [];
      for (let fx = 0.1; fx < 1; fx += 0.1) {
        for (const fy of [0.5, 0.3, 0.7]) candidates.push({ x: r.left + r.width * fx, y: r.top + r.height * fy });
      }
      candidates.sort((a, b) => Math.abs(a.x - cx) - Math.abs(b.x - cx));
      const found = candidates.find((c) => hits(c.x, c.y));
      return found ? { ...found, centred: false } : null;
    });
    if (!spot) throw new Error(`"${title}": the target is covered and cannot be clicked`);
    if (!spot.centred) warnings.push(`step ${i} "${title}": the spotlight is off its target, only part of it is clickable`);
    return clickAt({ x: spot.x, y: spot.y, width: 0, height: 0 });
  }

  async function typeText(text) {
    const start = now();
    for (const ch of text) {
      await page.keyboard.type(ch);
      await pause(85 + Math.random() * 70);
    }
    timeline.typing.push({ t0: start, t1: now(), text });
  }

  /** A scenario locator: a CSS string, or `{ role, name }`, or `{ text }`, optionally scoped with `in`. */
  function locate(spec) {
    if (typeof spec === 'string') return page.locator(spec).first();
    const scope = spec.in ? page.locator(spec.in).first() : page;
    let found;
    if (spec.role) found = scope.getByRole(spec.role, { name: spec.name, exact: spec.exact ?? false });
    else if (spec.text) found = scope.getByText(spec.text, { exact: spec.exact ?? false });
    else if (spec.css) found = scope.locator(spec.css);
    else throw new Error(`bad locator: ${JSON.stringify(spec)}`);
    return spec.nth === undefined ? found.first() : found.nth(spec.nth);
  }

  /**
   * Performs a scripted step: a list of `{ click }`, `{ point, in }`, `{ type }`,
   * `{ press }`, `{ pause }` actions, each done with the visible cursor.
   */
  async function perform(actions) {
    let first = null;
    for (const action of actions) {
      if (action.point !== undefined) {
        // A spot inside an element, as fractions of its box: for targets with
        // no handle of their own, like a free slot on the calendar grid.
        const box = await locate(action.in).boundingBox();
        const [fx, fy] = action.point;
        const t = await clickAt({ x: box.x + box.width * fx, y: box.y + box.height * fy, width: 0, height: 0 });
        first ??= t;
      } else if (action.click !== undefined) {
        const target = locate(action.click);
        // A trial hover passes only once the element is visible, still, and not
        // covered, so a dropdown still opening holds the flow here.
        await settle(() => target.hover({ trial: true }), 700);
        const t = await clickAt(await target.boundingBox());
        first ??= t;
      } else if (action.type !== undefined) {
        await pause(350);
        await typeText(action.type);
      } else if (action.press !== undefined) {
        await page.keyboard.press(action.press);
        await pause(250);
      } else if (action.pause !== undefined) {
        await pause(action.pause);
      } else {
        throw new Error(`bad action: ${JSON.stringify(action)}`);
      }
      await pause(action.after ?? 450);
    }
    return first;
  }

  const warnings = [];
  let snap = null;
  let failure = null;
  let removed = {};
  try {
    snap = await snapshot(db, salonId);
    if (scenario.seed) await scenario.seed({ db, salonId, now: stage });

    await page.goto(`${base}/login`);
    await page.getByLabel('Email o telefono').fill(requireEnv('E2E_OWNER_EMAIL'));
    await page.locator('input[type="password"]').fill(requireEnv('E2E_OWNER_PASSWORD'));
    await page.getByRole('button', { name: 'Accedi' }).click();
    await page.waitForURL(/\/(admin|select-salon|select-workspace)/);
    // Force the demo salon (skip /select-salon) the same way the e2e fixture does.
    await context.addCookies([{
      name: 'lume-active-salon-id', value: salonId,
      domain: new URL(base).hostname, path: '/', httpOnly: true, secure: false, sameSite: 'Lax',
    }]);

    // Start the real guide from its help page, the way a user does. Everything
    // the video shows from here on (card, spotlight, copy) is the tour itself.
    await page.goto(`${base}${tour.endRoute}`);
    try { await page.getByRole('button', { name: 'Accetta' }).click({ timeout: 4000 }); } catch {}
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.getByRole('button', { name: 'Avvia guida interattiva' }).click();
    // Some tutorials open with a welcome splash, or a list of what the chain
    // will prepare first; its primary button starts the tour.
    const welcomeStart = page.locator('[role="dialog"] button').filter({ hasText: /^(Inizia|Iniziamo|Avvia|Comincia)/ });
    await cardFor(0).or(welcomeStart).first().waitFor();
    if (!(await cardFor(0).isVisible())) await welcomeStart.first().click();
    await cardFor(0).waitFor();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.mouse.move(cursor.x, cursor.y);
    await sleep(fast ? 200 : 1200);

    t0 = clock();
    marks = [[0, 0]];
    if (!fast) {
      cdp.on('Page.screencastFrame', (frame) => {
        frames.push({ t: frame.metadata.timestamp * 1000 - t0, data: Buffer.from(frame.data, 'base64') });
        cdp.send('Page.screencastFrameAck', { sessionId: frame.sessionId }).catch(() => {});
      });
      await cdp.send('Page.startScreencast', {
        format: 'jpeg',
        quality: 92,
        maxWidth: VIEWPORT.width * SCALE,
        maxHeight: VIEWPORT.height * SCALE,
        everyNthFrame: 1,
      });
    }
    await pause(900);

    for (const [i, step] of tour.steps.entries()) {
      const target = page.locator(step.selector).first();
      const card = cardFor(i);
      // Wait until the card stays where it is: it animates in, and pages that
      // load data after the step starts can still push it away. Only measure,
      // never scroll it into view: a user would not, and scrolling the page
      // drags the tour's overlay off its target.
      await settle(() => page.waitForLoadState('networkidle').catch(() => {}), 600);
      await settle(() => card.waitFor(), 800);
      let cardRect = null;
      for (let tries = 0; tries < 12; tries++) {
        await pause(tries === 0 ? 350 : 250);
        const box = await card.boundingBox();
        const still = cardRect && Math.abs(box.x - cardRect.x) < 1 && Math.abs(box.y - cardRect.y) < 1;
        cardRect = box;
        if (still) break;
      }
      // A card the viewer cannot see is a defect in the tour, not something to
      // work around quietly: note it, and step past it without the cursor.
      const isHidden = (box) => box.y + box.height / 2 > VIEWPORT.height || box.y + box.height / 2 < 0;
      const hidden = isHidden(cardRect);
      const flagHidden = (box) => {
        warnings.push(`step ${i} "${step.title}": the tour card is off screen (top at ${Math.round(box.y)}px of ${VIEWPORT.height})`);
        if (entry) entry.card = null;
      };
      let entry = null;
      if (hidden) {
        flagHidden(cardRect);
        cardRect = null;
      } else {
        const over = Math.max(
          -cardRect.x, -cardRect.y,
          cardRect.x + cardRect.width - VIEWPORT.width, cardRect.y + cardRect.height - VIEWPORT.height,
        );
        if (over > 30) warnings.push(`step ${i} "${step.title}": the tour card overflows the screen by ${Math.round(over)}px`);
      }
      const rect = await target.boundingBox();
      if (!rect) throw new Error(`step ${i}: target ${step.selector} is not on the page`);
      if (inspect === i) {
        const found = await target.evaluate((root) =>
          [...root.querySelectorAll('button, input, textarea, select, [role], [data-tour], a')]
            .filter((el) => el.getClientRects().length > 0)
            .slice(0, 80)
            .map((el) => [
              el.tagName.toLowerCase(),
              el.getAttribute('role') ?? '',
              el.getAttribute('data-tour') ?? '',
              el.getAttribute('placeholder') ?? el.getAttribute('aria-label') ?? '',
              (el.innerText ?? '').trim().replace(/\s+/g, ' ').slice(0, 50),
            ].join(' | ')),
        );
        console.log(`step ${i} "${step.title}" ${step.selector}\n${step.content}`);
        console.log(`target ${JSON.stringify(rect)} card ${JSON.stringify(cardRect)}\n${found.join('\n')}`);
        throw new Error('stopped for inspection');
      }
      advance(0);
      entry = { i, mode: step.mode, title: step.title, rect, card: cardRect, t0: now(), tAction: null, t1: 0 };
      const read = readMs(`${step.title} ${step.content}`);
      const last = i === tour.steps.length - 1;
      const advanceButton = card.getByRole('button', { name: /^(Avanti|Fine)$/ });
      const script = scenario.actions?.[step.completeOn] ?? scenario.actions?.[`#${i}`];
      // An input can be a function of the stage time, for dates.
      const rawInput = scenario.inputs?.[step.selector] ?? scenario.inputs?.[`#${i}`];
      const input = typeof rawInput === 'function' ? rawInput({ now: stage }) : rawInput;
      const field = step.advanceWhenFilled ? page.locator(step.advanceWhenFilled).first() : target;

      // What a user does at each kind of step, read off the same fields the tour
      // itself uses to decide when to move on.
      if (script) {
        await pause(read);
        entry.tAction = await perform(script);
        if (!step.completeOn && !step.advanceOnRoute && !last) await clickAt(await advanceButton.boundingBox());
      } else if (step.advanceWhenFilled || (step.optional && input !== undefined)) {
        const prefilled = step.advanceWhenFilled ? (await field.inputValue()) !== '' : false;
        if (input === undefined && !prefilled) {
          throw new Error(`step ${i}: scenario has no input for ${step.selector}`);
        }
        await pause(read * 0.6);
        if (input !== undefined) {
          entry.tAction = await clickAt(await field.boundingBox());
          await pause(450);
          // `{ fill }` sets the value in one go, for date and time fields whose
          // segments do not take plain typing.
          if (typeof input === 'string') await typeText(input);
          else await field.fill(input.fill);
        }
        await pause(Math.max(700, read * 0.4));
        await clickAt(await advanceButton.boundingBox());
      } else if (step.mode === 'action' && !step.optional) {
        await pause(read);
        entry.tAction = await clickTarget(target, i, step.title);
        if (step.advanceOnRoute) await settle(() => page.waitForURL(`**${step.advanceOnRoute}`), 1500);
      } else {
        if (!hidden) await pause(last ? read * 0.5 : read);
        // Late-loading pages can move the card after it first settled.
        if (!hidden && isHidden(await card.boundingBox())) flagHidden(await card.boundingBox());
        const button = await advanceButton.boundingBox();
        if (entry.card === null) {
          await pause(1200);
          if (!last) await advanceButton.evaluate((el) => el.click());
        } else if (!last) {
          await clickAt(button);
          // If the card slid away between measuring and clicking, the click
          // missed: same defect as above, caught late.
          const advanced = await cardFor(i + 1).waitFor({ timeout: 2500 }).then(() => true, () => false);
          if (!advanced && isHidden(await card.boundingBox())) {
            flagHidden(await card.boundingBox());
            await advanceButton.evaluate((el) => el.click());
          } else if (!advanced) {
            // Still on screen, so it only shifted: click it where it is now.
            await clickAt(await advanceButton.boundingBox());
          }
        } else {
          // The last card stays up: "Fine" would leave for the help page. The
          // cursor only comes to rest on it.
          await moveTo(button.x + button.width / 2, button.y + button.height / 2);
          await pause(read * 0.5);
        }
      }

      if (!last) await settle(() => cardFor(i + 1).waitFor(), 1500);
      entry.t1 = now();
      timeline.steps.push(entry);
    }

    await pause(600);
    timeline.durationMs = Math.round(marks.at(-1)[1]);
    if (!fast) await cdp.send('Page.stopScreencast');
  } catch (err) {
    // Leave a picture of where the flow stopped.
    const shot = path.join(VIDEO_DIR, 'out', `${slug}-error.png`);
    mkdirSync(path.dirname(shot), { recursive: true });
    await page.screenshot({ path: shot }).catch(() => {});
    // And say which tour card, if any, is up: a mismatch here usually means the
    // tour advanced differently from what the scenario expected.
    const cards = await page
      .locator('[role="dialog"]')
      .evaluateAll((els) => els.map((el) => {
        const r = el.getBoundingClientRect();
        return `"${el.getAttribute('aria-label')}" at ${Math.round(r.x)},${Math.round(r.y)}`;
      }))
      .catch(() => []);
    console.error(`${slug}: dialogs on screen: ${cards.join('; ') || 'none'}`);
    for (const line of complaints.slice(-8)) console.error(`${slug}: ${line}`);
    const lastClick = timeline.clicks.at(-1);
    if (lastClick) {
      const under = await page
        .evaluate(({ x, y }) => {
          const el = document.elementFromPoint(x, y);
          return el ? el.outerHTML.replace(/\s+/g, ' ').slice(0, 160) : 'nothing';
        }, lastClick)
        .catch(() => 'unknown');
      console.error(`${slug}: last click at ${Math.round(lastClick.x)},${Math.round(lastClick.y)} is over ${under}`);
    }
    const shown = await page
      .evaluate(() => document.body.innerText.split('\n').filter((l) => /errore|impossibile|non valid|obbligator|selezion|scegli un|aggiungi almeno|conflitt|sovrappon|già |occupat|richiest/i.test(l)).slice(0, 4))
      .catch(() => []);
    for (const line of shown) console.error(`${slug}: on screen: ${line.slice(0, 200)}`);
    failure = new Error(`${slug}: step ${timeline.steps.length}: ${err.message.split('\n')[0]} (see ${path.relative(ROOT, shot)})`);
  } finally {
    await browser.close();
    if (snap) removed = await restore(db, salonId, snap);
  }
  if (!failure) rmSync(path.join(VIDEO_DIR, 'out', `${slug}-error.png`), { force: true });
  if (failure) {
    failure.removed = removed;
    throw failure;
  }

  const realMs = marks.at(-1)[0];
  for (const frame of frames) frame.t = toVideo(frame.t);
  for (const step of timeline.steps) {
    step.t0 = toVideo(step.t0);
    step.t1 = toVideo(step.t1);
    if (step.tAction !== null) step.tAction = toVideo(step.tAction);
  }
  for (const span of [...timeline.moves, ...timeline.typing]) {
    span.t0 = toVideo(span.t0);
    span.t1 = toVideo(span.t1);
  }
  for (const click of timeline.clicks) click.t = toVideo(click.t);

  const result = {
    slug, steps: timeline.steps.length, videoMs: timeline.durationMs, realMs: Math.round(realMs), removed, warnings,
  };
  if (fast) return result;

  // Replace the previous recording only now that this one has succeeded.
  const outDir = path.join(VIDEO_DIR, 'public', slug);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  // Screencast frames arrive only when the page repaints. Resample to a constant
  // frame rate by showing, at each output tick, the latest frame captured so far.
  const ffmpeg = spawn('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-crf', '14', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-g', String(FPS / 2),
    '-movflags', '+faststart',
    path.join(outDir, 'raw.mp4'),
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const total = Math.ceil((timeline.durationMs / 1000) * FPS);
  for (let n = 0, k = 0; n < total; n++) {
    const t = (n * 1000) / FPS;
    while (k + 1 < frames.length && frames[k + 1].t <= t) k++;
    if (!ffmpeg.stdin.write(frames[k].data)) await once(ffmpeg.stdin, 'drain');
  }
  ffmpeg.stdin.end();
  const [code] = await once(ffmpeg, 'close');
  if (code !== 0) throw new Error(`ffmpeg exited with ${code}`);

  writeFileSync(path.join(outDir, 'timeline.json'), JSON.stringify(timeline, null, 2));
  return { ...result, frames: frames.length };
}
