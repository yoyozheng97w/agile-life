import { test, expect } from '@playwright/test';
import {
  gotoFresh,
  gotoSeeded,
  buildState,
  buildSprint,
  readStore,
  todayISO,
} from './helpers/store';

test.describe('Sprint creation', () => {
  test('shows create sprint dialog when no sprint exists', async ({ page }) => {
    await gotoFresh(page);
    await expect(page.getByRole('heading', { name: 'Create Sprint' })).toBeVisible();
  });

  test('opens form when "+ Create New Sprint" is clicked', async ({ page }) => {
    await gotoFresh(page);
    await page.getByRole('button', { name: /Create New Sprint/ }).click();

    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Create Sprint$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('cancel button closes the form without creating a sprint', async ({ page }) => {
    await gotoFresh(page);
    await page.getByRole('button', { name: /Create New Sprint/ }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('button', { name: /Create New Sprint/ })).toBeVisible();

    const store = await readStore(page);
    expect(store?.sprints ?? []).toHaveLength(0);
  });

  test('end date is auto-derived from start date and sprint length', async ({ page }) => {
    await gotoSeeded(page, buildState({
      settings: { sprintLengthDays: 7, standupTime: '09:30', notificationsEnabled: false },
    }));

    await page.getByRole('button', { name: /Create New Sprint/ }).click();
    await page.getByRole('button', { name: /^Create Sprint$/ }).click();

    // Sprint length 7 days, start today → end = today + 6
    await expect.poll(async () => {
      const store = await readStore(page);
      return store?.sprints[0]?.endDate;
    }).toBe(todayISO(6));
  });

  test('creating a sprint dated today transitions it to active automatically', async ({ page }) => {
    await gotoFresh(page);
    await page.getByRole('button', { name: /Create New Sprint/ }).click();
    await page.locator('input[type="date"]').fill(todayISO());
    await page.getByRole('button', { name: /^Create Sprint$/ }).click();

    await expect.poll(async () => {
      const store = await readStore(page);
      return store?.sprints[0]?.status;
    }).toBe('active');

    await expect(page.getByRole('heading', { name: /\w+ \d+ – \w+ \d+/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^To-Do/ })).toBeVisible();
  });

  test('a future-dated sprint stays in planning status', async ({ page }) => {
    await gotoFresh(page);
    await page.getByRole('button', { name: /Create New Sprint/ }).click();
    await page.locator('input[type="date"]').fill(todayISO(30));
    await page.getByRole('button', { name: /^Create Sprint$/ }).click();

    await expect.poll(async () => {
      const store = await readStore(page);
      return store?.sprints[0]?.status;
    }).toBe('planning');
  });

  test('persisted sprint has correct number and zero points initially', async ({ page }) => {
    await gotoFresh(page);
    await page.getByRole('button', { name: /Create New Sprint/ }).click();
    await page.locator('input[type="date"]').fill(todayISO());
    await page.getByRole('button', { name: /^Create Sprint$/ }).click();

    await expect.poll(async () => (await readStore(page))?.sprints.length).toBe(1);
    const store = await readStore(page);
    expect(store!.sprints[0].number).toBe(1);
    expect(store!.sprints[0].plannedPoints).toBe(0);
    expect(store!.sprints[0].completedPoints).toBe(0);
  });

  test('Edit Dates button updates the active sprint dates', async ({ page }) => {
    const sprint = buildSprint({ startDate: todayISO(), endDate: todayISO(13) });
    await gotoSeeded(page, buildState({ sprints: [sprint] }));

    await page.getByRole('button', { name: /Edit Dates/ }).click();

    const inputs = page.locator('input[type="date"]');
    await inputs.nth(0).fill(todayISO());
    await inputs.nth(1).fill(todayISO(20));
    await page.getByRole('button', { name: 'Save' }).click();

    await expect.poll(async () => {
      const store = await readStore(page);
      return store?.sprints[0]?.endDate;
    }).toBe(todayISO(20));
  });

  test('Edit Dates Cancel reverts the form without saving', async ({ page }) => {
    const sprint = buildSprint({ startDate: todayISO(), endDate: todayISO(13) });
    await gotoSeeded(page, buildState({ sprints: [sprint] }));

    await page.getByRole('button', { name: /Edit Dates/ }).click();
    await page.locator('input[type="date"]').nth(1).fill(todayISO(99));
    await page.getByRole('button', { name: 'Cancel' }).click();

    const store = await readStore(page);
    expect(store?.sprints[0].endDate).toBe(todayISO(13));
  });
});
