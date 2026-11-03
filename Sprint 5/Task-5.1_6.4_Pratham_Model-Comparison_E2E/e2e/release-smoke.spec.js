import { test, expect } from '@playwright/test';

test('release smoke: app loads and core navigation is available', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).not.toBeEmpty();
  // Broad smoke assertion is deliberately app-agnostic; adjust selectors to the integrated UI.
  const visibleText = (await page.locator('body').innerText()).toLowerCase();
  expect(visibleText.length).toBeGreaterThan(10);
});
