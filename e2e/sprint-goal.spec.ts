import { test, expect } from '@playwright/test';
import {
  BASE_URL,
  buildSprint,
  buildState,
  gotoSeeded,
  readStore,
  todayISO,
} from './helpers/store';

test.describe('Sprint Goal', () => {
  // ─── Sprint Board side ────────────────────────────────────────────────────

  test('Sprint Goal textarea is visible on an active sprint board', async ({ page }) => {
    const sprint = buildSprint();
    await gotoSeeded(page, buildState({ sprints: [sprint] }));

    await expect(
      page.getByPlaceholder('What is the goal for this sprint?')
    ).toBeVisible();
  });

  test('typing a goal and blurring saves it to localStorage', async ({ page }) => {
    const sprint = buildSprint({ id: 's1' });
    await gotoSeeded(page, buildState({ sprints: [sprint] }));

    const textarea = page.getByPlaceholder('What is the goal for this sprint?');
    await textarea.fill('Finish the onboarding flow');
    // blur by clicking elsewhere on the page
    await page.locator('h1').first().click();

    await expect.poll(async () => {
      const store = await readStore(page);
      return store?.sprints[0]?.goal;
    }).toBe('Finish the onboarding flow');
  });

  test('goal persists after a hard refresh', async ({ page }) => {
    const sprint = buildSprint({ id: 's1', goal: 'Survive the demo' });
    await gotoSeeded(page, buildState({ sprints: [sprint] }));

    const textarea = page.getByPlaceholder('What is the goal for this sprint?');
    await expect(textarea).toHaveValue('Survive the demo');

    await page.reload({ waitUntil: 'networkidle' });

    await expect(
      page.getByPlaceholder('What is the goal for this sprint?')
    ).toHaveValue('Survive the demo');
  });

  // ─── Retro side ───────────────────────────────────────────────────────────

  test('sprint goal is shown in the retro detail panel', async ({ page }) => {
    const sprint = buildSprint({
      id: 's1',
      status: 'completed',
      startDate: '2026-04-01',
      endDate: '2026-04-14',
      goal: 'Ship the MVP',
    });
    await gotoSeeded(page, buildState({ sprints: [sprint] }), '/retro');

    await page.locator('button').filter({ hasText: /Apr 1 – Apr 14/ }).click();

    await expect(page.getByText('Sprint Goal', { exact: true })).toBeVisible();
    await expect(page.getByText('Ship the MVP')).toBeVisible();
  });

  test('sprint without a goal does not show the goal section in retro', async ({ page }) => {
    const sprint = buildSprint({
      id: 's1',
      status: 'completed',
      startDate: '2026-04-01',
      endDate: '2026-04-14',
    });
    await gotoSeeded(page, buildState({ sprints: [sprint] }), '/retro');

    await page.locator('button').filter({ hasText: /Apr 1 – Apr 14/ }).click();

    // The goal section heading must not appear in the detail panel
    await expect(page.getByText('Sprint Goal', { exact: true })).toHaveCount(0);
  });
});
