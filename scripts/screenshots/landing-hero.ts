import { baseURL, ensureOutputDir, openBrowser, outPath } from './_shared';

async function main(): Promise<void> {
  await ensureOutputDir();
  const { browser, page } = await openBrowser({ width: 1440, height: 900 });

  try {
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: outPath('landing-hero.png'), fullPage: false });
    console.log(`Saved ${outPath('landing-hero.png')}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
