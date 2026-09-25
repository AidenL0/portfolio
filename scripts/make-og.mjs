// Screenshots the built hero at 1200x630 into public/og.png. Run after `npm run build`.
import { preview } from 'astro';
import { chromium } from '@playwright/test';

const PORT = 4399;
const server = await preview({ root: '.', server: { port: PORT }, logLevel: 'warn' });
try {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto(`http://localhost:${PORT}/`);
  await page.waitForFunction(() => Number(document.querySelector('[data-field]')?.getAttribute('data-frames')) > 90);
  await page.screenshot({ path: 'public/og.png' });
  await browser.close();
  console.log('wrote public/og.png');
} finally {
  await server.stop();
}
