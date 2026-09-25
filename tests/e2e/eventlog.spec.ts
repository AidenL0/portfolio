import { test, expect } from '@playwright/test';

test('only the ticketing case has an event log, hidden from assistive tech', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-eventlog]')).toHaveCount(1);
  await expect(page.locator('#ticketing [data-eventlog]')).toHaveAttribute('aria-hidden', 'true');
});

test('appends lines while the case is on screen', async ({ page }) => {
  await page.goto('/');
  const lines = page.locator('#ticketing [data-eventlog-lines] > div');
  await expect(lines).toHaveCount(18);
  await page.locator('#ticketing').scrollIntoViewIfNeeded();
  await expect.poll(() => lines.count(), { timeout: 8000 }).toBeGreaterThan(18);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('shows the initial lines and never appends', async ({ page }) => {
    await page.goto('/');
    const lines = page.locator('#ticketing [data-eventlog-lines] > div');
    await page.locator('#ticketing').scrollIntoViewIfNeeded();
    await expect(lines).toHaveCount(18);
    await page.waitForTimeout(5000);
    await expect(lines).toHaveCount(18);
  });
});
