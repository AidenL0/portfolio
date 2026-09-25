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

test.describe('pause motion control', () => {
  test('pauses the particles and CSS loops, then resumes them', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Pause motion' }).click();
    const play = page.getByRole('button', { name: 'Play motion' });
    await expect(play).toBeVisible();
    await page.waitForTimeout(100);
    const paused = await frames(page);
    await page.waitForTimeout(800);
    expect(await frames(page)).toBe(paused);
    await expect(page.locator('.caustics')).toHaveCSS('animation-play-state', 'paused');
    await play.click();
    await expect.poll(() => frames(page)).toBeGreaterThan(paused + 5);
    await expect(page.locator('.caustics')).toHaveCSS('animation-play-state', 'running');
  });

  test('stops the event log from appending', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Pause motion' }).click();
    const lines = page.locator('#ticketing [data-eventlog-lines] > div');
    await page.locator('#ticketing').scrollIntoViewIfNeeded();
    await page.waitForTimeout(5000);
    await expect(lines).toHaveCount(18);
  });

  test('remembers the choice across reloads', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Pause motion' }).click();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Play motion' })).toBeVisible();
    await page.waitForTimeout(300);
    const settled = await frames(page);
    await page.waitForTimeout(800);
    expect(await frames(page)).toBe(settled);
  });
});

test.describe('pause control with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('is hidden, since nothing moves', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-motion-toggle]')).toBeHidden();
  });
});
