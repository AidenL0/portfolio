import { test, expect } from '@playwright/test';

const frames = async (page: import('@playwright/test').Page) =>
  Number(await page.locator('[data-field]').getAttribute('data-frames'));

test('the particle field animates', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-field]')).toHaveAttribute('aria-hidden', 'true');
  await expect.poll(() => frames(page)).toBeGreaterThan(20);
});

test('hovering a social link gathers particles; leaving releases them', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('[data-field]');
  await expect(canvas).toHaveAttribute('data-gathering', 'false');
  await page.getByRole('link', { name: 'GitHub, AidenL0' }).hover();
  await expect(canvas).toHaveAttribute('data-gathering', 'true');
  await page.mouse.move(5, 5);
  await expect(canvas).toHaveAttribute('data-gathering', 'false');
});

test('keyboard focus on a social link gathers particles too', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('[data-field]');
  await page.getByRole('link', { name: 'LinkedIn, aiden-longoria' }).focus();
  await expect(canvas).toHaveAttribute('data-gathering', 'true');
  await page.getByRole('link', { name: 'LinkedIn, aiden-longoria' }).blur();
  await expect(canvas).toHaveAttribute('data-gathering', 'false');
});

test('the spotlight follows the cursor across a project tile', async ({ page }) => {
  await page.goto('/');
  const tile = page.locator('[data-spotlight]').first();
  const box = (await tile.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height / 2);
  await expect.poll(() => tile.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--x'))).toMatch(/^2\d(\.\d+)?%$/);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('draws a still frame and never loops', async ({ page }) => {
    await page.goto('/');
    await expect.poll(() => frames(page)).toBeGreaterThan(0);
    await page.waitForTimeout(1000);
    const settled = await frames(page);
    await page.waitForTimeout(1500);
    expect(await frames(page)).toBe(settled);
  });
});
