import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import path from 'node:path';
import fs from 'node:fs/promises';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.test' });

export const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
export const outputDir = path.join(process.cwd(), 'public/marketing/screenshots');

export interface ShootContext {
  browser: Browser;
  context: BrowserContext;
  page: Page;
}

export async function openBrowser(opts?: {
  width?: number;
  height?: number;
  deviceScaleFactor?: number;
  colorScheme?: 'light' | 'dark';
}): Promise<ShootContext> {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: opts?.width ?? 1440, height: opts?.height ?? 900 },
    deviceScaleFactor: opts?.deviceScaleFactor ?? 2,
    colorScheme: opts?.colorScheme ?? 'light',
  });
  const page = await context.newPage();
  return { browser, context, page };
}

export async function ensureOutputDir(): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });
}

export function outPath(filename: string): string {
  return path.join(outputDir, filename);
}
