import { test, expect } from '@playwright/test';
import {
  BASE_URL,
  PERSIST_KEY,
  gotoFresh,
  readStore,
} from './helpers/store';

test.describe('Settings - persistence', () => {
  test('default values are loaded on first visit', async ({ page }) => {
    await gotoFresh(page, '/settings');

    const sprintLength = page.locator('input[type="number"]');
    const standupTime = page.locator('input[type="time"]');

    await expect(sprintLength).toHaveValue('14');
    await expect(standupTime).toHaveValue('09:30');
  });

  test('changing sprint length writes to localStorage', async ({ page }) => {
    await gotoFresh(page, '/settings');

    const input = page.locator('input[type="number"]');
    await input.fill('7');
    await input.blur();

    await expect.poll(async () => {
      const store = await readStore(page);
      return store?.settings.sprintLengthDays;
    }).toBe(7);
  });

  test('changing standup time writes to localStorage', async ({ page }) => {
    await gotoFresh(page, '/settings');

    const input = page.locator('input[type="time"]');
    await input.fill('10:30');
    await input.blur();

    await expect.poll(async () => {
      const store = await readStore(page);
      return store?.settings.standupTime;
    }).toBe('10:30');
  });

  test('settings survive a hard reload', async ({ page }) => {
    await gotoFresh(page, '/settings');

    await page.locator('input[type="number"]').fill('21');
    await page.locator('input[type="time"]').fill('08:00');

    await expect.poll(async () => {
      const store = await readStore(page);
      return store?.settings.sprintLengthDays;
    }).toBe(21);

    await page.goto(BASE_URL + '/settings');

    await expect(page.locator('input[type="number"]')).toHaveValue('21');
    await expect(page.locator('input[type="time"]')).toHaveValue('08:00');
  });

  test('sprint length input enforces min/max bounds', async ({ page }) => {
    await gotoFresh(page, '/settings');

    const input = page.locator('input[type="number"]');
    await expect(input).toHaveAttribute('min', '1');
    await expect(input).toHaveAttribute('max', '30');
  });

  test('localStorage uses the documented persist key and shape', async ({ page }) => {
    await gotoFresh(page, '/settings');
    await page.locator('input[type="number"]').fill('10');
    await page.locator('input[type="number"]').blur();

    const raw = await page.evaluate((key) => localStorage.getItem(key), PERSIST_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed).toHaveProperty('state');
    expect(parsed).toHaveProperty('version');
    expect(parsed.state).toHaveProperty('settings');
    expect(parsed.state).toHaveProperty('sprints');
    expect(parsed.state).toHaveProperty('tickets');
  });
});
