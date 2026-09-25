import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('shows the title and headline', async ({ page }) => {
  await expect(page).toHaveTitle('Aiden Longoria · Software Engineer');
  const h1 = page.getByRole('heading', { level: 1 });
  await expect(h1).toHaveText('From storefront sites to systems of record.');
  await expect(h1.locator('em')).toHaveText('to systems of record.');
  await expect(page.getByText('Software Engineer · Texas A&M–Kingsville ’27')).toBeVisible();
});

test('lists the three socials in order with exact URLs, opening in a new tab', async ({ page }) => {
  const expected = [
    ['GitHub, AidenL0', 'https://github.com/AidenL0'],
    ['LinkedIn, aiden-longoria', 'https://linkedin.com/in/aiden-longoria-4329a4366'],
    ['Handshake, profile', 'https://app.joinhandshake.com/profiles/tummy_ache_surviver'],
  ];
  const links = page.locator('#contact a');
  await expect(links).toHaveCount(3);
  for (const [i, [name, href]] of expected.entries()) {
    const link = links.nth(i);
    await expect(link).toHaveAccessibleName(name);
    await expect(link).toHaveAttribute('href', href);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toHaveAttribute('data-gather', '');
  }
});

test('shows a hub tile per project, linking to its case anchor', async ({ page }) => {
  const tiles = page.locator('[data-spotlight]');
  await expect(tiles).toHaveCount(3);
  await expect(tiles.nth(0)).toHaveAttribute('href', '#ticketing');
  await expect(tiles.nth(0)).toContainText('Northwind Helpdesk');
  await expect(tiles.nth(1)).toHaveAttribute('href', '#la-esquina');
  await expect(tiles.nth(2)).toHaveAttribute('href', '#fourth-quarter');
  await expect(tiles.nth(0)).not.toHaveAttribute('target', '_blank');
});

test('nav links point at real sections', async ({ page }) => {
  for (const id of ['projects', 'about', 'contact']) {
    await expect(page.locator(`nav a[href="#${id}"]`)).toHaveCount(1);
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
});
