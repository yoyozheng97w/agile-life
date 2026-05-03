import { test, expect } from '@playwright/test';
import { BASE_URL, gotoFresh, expectNoConsoleErrors } from './helpers/store';

test.describe('Smoke - app loads and routes work', () => {
  test('app boots with sidebar and four nav links', async ({ page }) => {
    await gotoFresh(page);

    await expect(page.getByRole('heading', { name: 'Agile Life' })).toBeVisible();

    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: /Sprint Board/ })).toBeVisible();
    await expect(nav.getByRole('link', { name: /History/ })).toBeVisible();
    await expect(nav.getByRole('link', { name: /Retrospective/ })).toBeVisible();
    await expect(nav.getByRole('link', { name: /Settings/ })).toBeVisible();
  });

  test('clicking each sidebar link navigates without error', async ({ page }) => {
    await gotoFresh(page);

    await page.getByRole('link', { name: /Settings/ }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    await page.getByRole('link', { name: /History/ }).click();
    await expect(page).toHaveURL(/\/history$/);
    await expect(page.getByRole('heading', { name: 'Sprint History' })).toBeVisible();

    await page.getByRole('link', { name: /Retrospective/ }).click();
    await expect(page).toHaveURL(/\/retro$/);
    await expect(page.getByRole('heading', { name: 'Retrospective' })).toBeVisible();

    await page.getByRole('link', { name: /Sprint Board/ }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('unknown routes redirect to Sprint Board', async ({ page }) => {
    await gotoFresh(page);
    await page.goto(BASE_URL + '/this-does-not-exist');
    await expect(page).toHaveURL(/\/$/);
  });

  test('initial load produces no console errors', async ({ page }) => {
    await expectNoConsoleErrors(page, async () => {
      await gotoFresh(page);
      await expect(page.getByRole('heading', { name: 'Agile Life' })).toBeVisible();
    });
  });

  test('empty state on Sprint Board prompts to create a sprint', async ({ page }) => {
    await gotoFresh(page);
    await expect(page.getByRole('heading', { level: 1, name: 'Create Sprint' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Create New Sprint/ })
    ).toBeVisible();
  });

  test('empty state on History shows informative message', async ({ page }) => {
    await gotoFresh(page, '/history');
    await expect(page.getByText(/No completed sprints yet/)).toBeVisible();
  });

  test('empty state on Retrospective shows informative message', async ({ page }) => {
    await gotoFresh(page, '/retro');
    await expect(page.getByText(/No completed sprints yet/)).toBeVisible();
  });
});
