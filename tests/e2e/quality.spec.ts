import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('has canonical, description, and Open Graph tags', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://aiden-longoria.pages.dev/');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /^I build the full stack/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://aiden-longoria.pages.dev/og.png');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
});

test('serves the favicon and share image', async ({ request }) => {
  const icon = await request.get('/favicon.svg');
  expect(icon.status()).toBe(200);
  const og = await request.get('/og.png');
  expect(og.status()).toBe(200);
  expect(og.headers()['content-type']).toContain('image/png');
});

for (const viewport of [{ width: 1280, height: 900 }, { width: 375, height: 800 }]) {
  test(`has no axe violations at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
}
