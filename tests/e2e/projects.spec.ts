import { test, expect } from '@playwright/test';

test.describe('project cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders one case per project, in order, with h3 titles', async ({ page }) => {
    const cases = page.locator('#projects article');
    await expect(cases).toHaveCount(3);
    await expect(cases.nth(0)).toHaveId('ticketing');
    await expect(cases.nth(1)).toHaveId('la-esquina');
    await expect(cases.nth(2)).toHaveId('fourth-quarter');
    await expect(page.getByRole('heading', { level: 3, name: 'Event-sourced ticketing platform' })).toBeVisible();
  });

  test('links the live project in a new tab, showing its host', async ({ page }) => {
    const link = page.locator('#ticketing a');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', 'https://northwind-helpdesk.up.railway.app');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toContainText('northwind-helpdesk.up.railway.app');
  });

  test('shows "Live link coming soon" and no link for pending projects', async ({ page }) => {
    for (const id of ['la-esquina', 'fourth-quarter']) {
      const card = page.locator(`#${id}`);
      await expect(card).toContainText('Live link coming soon');
      await expect(card.locator('a')).toHaveCount(0);
    }
  });

  test('lists the stack as chips', async ({ page }) => {
    await expect(page.locator('#la-esquina li')).toHaveText(['Astro', 'Cloudflare Pages', 'Stripe']);
  });

  test('every hub tile jumps to an existing case', async ({ page }) => {
    for (const href of await page.locator('[data-spotlight]').evaluateAll((els) => els.map((e) => e.getAttribute('href')))) {
      await expect(page.locator(href!)).toHaveCount(1);
    }
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('all content is still present and visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('#contact a')).toHaveCount(3);
    await expect(page.locator('[data-spotlight]')).toHaveCount(3);
    await expect(page.locator('#projects article')).toHaveCount(3);
    for (const a of await page.locator('#projects article').all()) await expect(a).toBeVisible();
  });
});

for (const width of [375, 320]) {
  test.describe(`at ${width}px wide`, () => {
    test.use({ viewport: { width, height: 800 } });

    test('the page never scrolls sideways', async ({ page }) => {
      await page.goto('/');
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(width);
    });
  });
}
